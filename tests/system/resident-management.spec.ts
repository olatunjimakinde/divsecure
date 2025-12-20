import { test, expect } from '@playwright/test';
import { createTestUser } from '../utils';

test.describe('Resident Management', () => {
    let userEmail: string;
    let userPassword: string;

    test.beforeAll(async () => {
        const user = await createTestUser();
        userEmail = user.email;
        userPassword = user.password;
    });

    test('should invite and remove a resident', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('input[name="email"]', userEmail);
        await page.fill('input[name="password"]', userPassword);
        await page.click('button:has-text("Log In")');
        await expect(page).not.toHaveURL('/login', { timeout: 15000 });

        // Ensure we are on the create community page
        if (!page.url().includes('/communities/create')) {
            await page.goto('/communities/create');
        }

        // 2. Create Community
        const timestamp = Date.now();
        const communitySlug = `res-test-${timestamp}`;
        await page.waitForSelector('input[name="name"]');
        await page.fill('input[name="name"]', `Resident Test Community ${timestamp}`);
        await page.fill('input[name="address"]', '456 Resident Lane');
        await page.fill('input[name="slug"]', communitySlug);
        await page.click('button[type="submit"]');

        // Wait for redirect to community page
        try {
            await expect(page).toHaveURL(new RegExp(`/communities/${communitySlug}`), { timeout: 10000 });
        } catch (e) {
            console.log('Failed to redirect. Current URL:', page.url());
            const errorText = await page.locator('.text-destructive').textContent().catch(() => 'No error text found');
            console.log('Error message on page:', errorText);

            throw e;
        }

        // 3. Navigate to People Directory
        await page.goto(`/communities/${communitySlug}/people`);
        await expect(page.locator('h1', { hasText: 'People' })).toBeVisible();

        // 4. Invite Resident
        await page.click('button:has-text("Invite Resident")');
        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        const residentEmail = `resident.${timestamp}@example.com`;
        const residentName = 'Test Resident';
        await page.fill('input[name="fullName"]', residentName);
        await page.fill('input[name="email"]', residentEmail);
        await page.fill('input[name="unitNumber"]', '101');

        // Wait for button and click
        await page.click('button:has-text("Send Invitation")');

        // Verify Resident Added
        try {
            await expect(page.locator('div[role="dialog"]')).toBeHidden({ timeout: 5000 });
        } catch (e) {
            console.log('Dialog did not close. Checking for errors...');
            const dialogContent = await page.locator('div[role="dialog"]').textContent().catch(() => 'No dialog content');
            console.log('Dialog content:', dialogContent);
            const toastContent = await page.locator('[data-sonner-toast]').textContent().catch(() => 'No toast found');
            console.log('Toast content:', toastContent);
            throw e;
        }
        await expect(page.locator('tr', { hasText: residentName })).toBeVisible();
        await expect(page.locator('tr', { hasText: '101' })).toBeVisible();

        // 5. Remove Resident
        // Use more specific locator for dropdown
        const row = page.locator('tr', { hasText: residentName });
        await row.locator('button').click(); // Click dropdown trigger
        await page.click('div[role="menuitem"]:has-text("Remove Resident")');

        // Confirm
        await expect(page.locator('div[role="alertdialog"]')).toBeVisible();
        await page.click('button:has-text("Remove")');

        // Verify Removed
        await expect(page.locator('tr', { hasText: residentName })).toBeHidden();
    });
});
