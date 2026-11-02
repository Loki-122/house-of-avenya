import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const pages = [
  '/',
  '/collections',
  '/women',
  '/new-arrivals',
  '/about',
  '/contact',
  '/cart',
  '/wishlist',
  '/admin/login',
  '/checkout',
];

const pagesWithHeader = ['/', '/collections', '/women', '/new-arrivals', '/about', '/contact', '/cart', '/wishlist'];

for (const viewport of viewports) {
  test.describe(`Responsive ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const path of pages) {
      test(`renders ${path}`, async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 30000 });
        expect(response, `No response for ${path}`).not.toBeNull();

        const bodyText = await page.locator('body').innerText();
        expect(bodyText).not.toMatch(/Application error/i);
        expect(bodyText).not.toMatch(/Internal Server Error/i);

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > doc.clientWidth;
        });
        if (overflow) {
          console.log(`HORIZONTAL_OVERFLOW: ${path} [${viewport.name}] scrollWidth=${await page.evaluate(() => document.documentElement.scrollWidth)} clientWidth=${await page.evaluate(() => document.documentElement.clientWidth)}`);
        }
        expect(overflow, `Horizontal overflow on ${path} at ${viewport.name}`).toBe(false);

        if (pagesWithHeader.includes(path)) {
          const header = page.locator('header').first();
          await expect(header, `Header not visible on ${path} at ${viewport.name}`).toBeVisible();
        }

        // Main content visible
        const main = page.locator('main').first();
        if (await main.count() > 0) {
          await expect(main, `Main not visible on ${path} at ${viewport.name}`).toBeVisible();
        }

        // Screenshot
        await page.screenshot({ path: `test-results/responsive/${viewport.name}-${path.replace(/\//g, '_') || 'home'}.png`, fullPage: true });
      });
    }

    test('mobile nav opens and closes on /', async ({ page }) => {
      if (viewport.name !== 'mobile') test.skip();
      await page.goto('/', { waitUntil: 'networkidle' });
      await page.waitForSelector('button[aria-label="Open navigation menu"]:not([disabled])', { timeout: 10000 });
      await page.locator('button[aria-label="Open navigation menu"]').first().click();
      await page.waitForSelector('button[aria-label="Close navigation menu"]', { timeout: 5000 });
      await page.locator('button[aria-label="Close navigation menu"]').first().click();
      await page.waitForSelector('button[aria-label="Open navigation menu"]', { timeout: 5000 });
    });

    test('password toggle on /admin/login hidden->visible->hidden', async ({ page }) => {
      await page.goto('/admin/login', { waitUntil: 'networkidle' });
      const passwordInput = page.locator('#admin-password');
      await expect(passwordInput).toHaveAttribute('type', 'password');
      await page.getByRole('button', { name: 'Show password' }).click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
      await page.getByRole('button', { name: 'Hide password' }).click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });
}
