import { test, expect, Page } from '@playwright/test';
import {
  createNew,
  forEachLang,
  goToPage,
  host,
  testRunCode,
  waitForEditorToLoad,
} from './helpers';

test.describe('Basic Functionality', () => {
  test('should run code', async ({ page, isMobile }) => {
    await createNew(page);
    await page.waitForSelector('button:has-text("Run Code")');
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));

    // let monaco load
    await waitForEditorToLoad(page);

    await forEachLang(page, async () => {
      await testRunCode(page, isMobile);
    });
  });

  test('should sync code', async ({ page, browser, isMobile }) => {
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await createNew(page);
    await page.waitForSelector('button:has-text("Run Code")');
    await goToPage(page, page2);
    await page2.waitForSelector('button:has-text("Run Code")');

    // let monaco load
    await waitForEditorToLoad(page);
    await waitForEditorToLoad(page2);

    if (isMobile) {
      await page.click('text=Input/Output');
      await page2.click('text=Input/Output');
    }

    await page.click('[data-test-id="input-editor"]');
    await page.keyboard.type(' 4 5 6');

    await page2.waitForSelector('text="1 2 3 4 5 6"', { timeout: 2000 });

    await page2.close();
    await context2.close();
  });

  test('should sync output', async ({ page, browser, isMobile }) => {
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await createNew(page);
    await page.waitForSelector('button:has-text("Run Code")');
    await goToPage(page, page2);
    await page2.waitForSelector('button:has-text("Run Code")');

    // let monaco load
    await waitForEditorToLoad(page);
    await waitForEditorToLoad(page2);
    await page.waitForTimeout(500);
    await page2.waitForTimeout(500);

    await page.click('button:has-text("Run Code")');
    expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
    await page2.waitForSelector('[data-test-id="run-code-loading"]');
    await page.waitForSelector('button:has-text("Run Code")');
    await page2.waitForSelector('button:has-text("Run Code")');

    if (isMobile) {
      await page.click('text=Input/Output');
      await page2.click('text=Input/Output');
    }

    expect(await page.$('text=Successful')).toBeTruthy();
    expect(await page2.$('text=Successful')).toBeTruthy();
    await page.locator('button:has-text("stdout")').click();
    await page2.locator('button:has-text("stdout")').click();
    expect(
      await page.$('text="The sum of these three numbers is 6"')
    ).toBeTruthy();
    expect(
      await page2.$('text="The sum of these three numbers is 6"')
    ).toBeTruthy();

    await page2.close();
    await context2.close();
  });
});
