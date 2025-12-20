import { test, expect } from '@playwright/test';
import { createTestUser } from '../utils';

test.describe('Maintenance Requests', () => {
    let userEmail: string;
    let userPassword: string;

    test.beforeAll(async () => {
        const user = await createTestUser();
        userEmail = user.email;
        userPassword = user.password;
    });

    test('should create and manage maintenance requests', async ({ page, browser }) => {
        // 1. Setup: Create Community & Manager
        await page.goto('/create');
        await page.fill('input[name="email"]', userEmail);
        await page.fill('input[name="password"]', userPassword);
        await page.click('button:has-text("Log In")');
        await expect(page).not.toHaveURL('/login', { timeout: 15000 });

        // Ensure we are on the create community page if not already redirected
        if (!page.url().includes('/communities/create') && !page.url().includes('/communities/')) {
            await page.goto('/communities/create');
        }

        // 2. Create Community
        const timestamp = Date.now();
        const communityName = `Maintenance Test ${timestamp}`;
        const communitySlug = `maint-test-${timestamp}`;

        // Only create if we are on the create page (handling potential redirect variations)
        if (page.url().includes('/communities/create')) {
            await page.waitForSelector('input[name="name"]');
            await page.fill('input[name="name"]', communityName);
            await page.fill('input[name="address"]', '789 Repair Rd');
            await page.fill('input[name="slug"]', communitySlug);
            await page.fill('textarea[name="description"]', 'Test community description'); // Added description
            await page.click('button[type="submit"]');

            try {
                await expect(page).toHaveURL(new RegExp(`/communities/${communitySlug}`), { timeout: 10000 });
            } catch (e) {
                console.log('Failed to redirect. Current URL:', page.url());
                const errorText = await page.locator('.text-destructive').textContent().catch(() => 'No specific error text found');
                const alertText = await page.locator('div[role="alert"]').textContent().catch(() => 'No alert found');
                console.log('Error message on page:', errorText);
                console.log('Alert message on page:', alertText);
                throw e;
            }
        } else {
            // If we are already on a community page, we might need to create a new one to be clean, 
            // or just use the current one if we can extract the slug. 
            // For reliability in this specific test, let's force navigate to create if we aren't there and didn't just create one.
            // But the previous block handles the "landing on create" case. 
            // If we landed on a dashboard, we are good? No, we need a known slug. 
            // Let's assume the standard flow for a new user lands on /communities/create
        }

        // 3. Resident Flow: Submit Request
        await page.goto(`/communities/${communitySlug}/maintenance`);
        await expect(page.locator('h1')).toContainText('Maintenance Requests');

        // Open Dialog
        await page.click('button:has-text("New Request")');
        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        // Fill Form
        const requestTitle = `Broken Window ${timestamp}`;
        await page.fill('input[name="title"]', requestTitle);
        await page.fill('textarea[name="description"]', 'The window in the living room is cracked.');
        await page.fill('input[name="unitNumber"]', '202');

        // Submit
        await page.click('button:has-text("Submit Request")');

        // Verify in List
        try {
            await expect(page.locator('div[role="dialog"]')).toBeHidden();
        } catch (e) {
            console.log('Dialog did not close. Checking for errors...');
            const dialogText = await page.locator('div[role="dialog"]').textContent().catch(() => 'No dialog text');
            const toastText = await page.locator('[data-sonner-toast]').textContent().catch(() => 'No toast text');
            console.log('Dialog Content:', dialogText);
            console.log('Toast Content:', toastText);
            throw e;
        }

        // Reload to ensure data is fetched (handle potential revalidation race condition)
        await page.reload();
        await expect(page.locator('h1')).toContainText('Maintenance Requests');

        await expect(page.locator('div', { hasText: requestTitle }).first()).toBeVisible();
        await expect(page.locator('div', { hasText: 'Pending' }).first()).toBeVisible();

        // 4. Manager Flow: Update Status
        // Navigate to Manager Dashboard
        await page.goto(`/communities/${communitySlug}/manager/maintenance`);
        await expect(page.locator('h1')).toContainText('Maintenance Requests');

        // Verify Request is visible
        await expect(page.locator('td', { hasText: requestTitle })).toBeVisible();

        // Update Status to In Progress
        // Find the select trigger in the same row as the request
        const row = page.locator('tr', { hasText: requestTitle });
        const statusTrigger = row.locator('button[role="combobox"]'); // Select trigger is a button
        await statusTrigger.click();

        await page.click('div[role="option"]:has-text("In Progress")');

        // Verify Visual Change (Toast is flaky in headless)
        // Verify badge color/text changed
        // The SelectValue should now show "In Progress"
        await expect(statusTrigger).toHaveText('In Progress');

        // 5. Verify Resident View Updated
        await page.goto(`/communities/${communitySlug}/maintenance`);
        await expect(page.locator('div', { hasText: requestTitle }).first()).toBeVisible();
        await expect(page.locator('div', { hasText: /In Progress/i }).first()).toBeVisible();
    });
});
