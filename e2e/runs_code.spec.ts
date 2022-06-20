import { test, expect, Page } from '@playwright/test';
import { createNew, forEachLang, goToPage, host, testRunCode } from './helpers';

test.describe('Basic Functionality', () => {
  test('should run code', async ({ page }) => {
    await createNew(page);
    await page.waitForSelector('button:has-text("Run Code")');
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));

    // let monaco load
    await page.waitForTimeout(500);

    await page.click('[data-test-id="input-editor"]');
    await page.keyboard.type('1 2 3');

    await forEachLang(page, async () => {
      await testRunCode(page);
    });
  });

  test('should sync code', async ({ page, browser }) => {
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await createNew(page);
    await page.waitForSelector('button:has-text("Run Code")');
    await goToPage(page, page2);
    await page2.waitForSelector('button:has-text("Run Code")');

    // let monaco load
    await page.waitForTimeout(500);
    await page2.waitForTimeout(500);

    await page.click('[data-test-id="input-editor"]');
    await page.keyboard.type('1 2 3');

    await page2.waitForSelector('text="1 2 3"', { timeout: 2000 });

    await page2.close();
    await context2.close();
  });
});
