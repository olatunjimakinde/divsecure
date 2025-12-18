
import { test, expect } from '@playwright/test';

test('homepage loads and shows heading', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/DivSecure|Community/);

    // Expect the main heading to be visible
    // Adjust the selector based on your actual homepage content
    await expect(page.locator('h1')).toBeVisible();
});
