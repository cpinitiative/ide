/// <reference types="jest-playwright-preset" />
/// <reference types="expect-playwright" />

import { forEachLang, testRunCode, host, createNew, goToPage } from './helpers';

test('should run code', async () => {
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

test('should sync code', async () => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  await createNew(page1);
  await page1.waitForSelector('button:has-text("Run Code")');
  await goToPage(page1, page2);
  await page2.waitForSelector('button:has-text("Run Code")');

  // let monaco load
  await page1.waitForTimeout(500);
  await page2.waitForTimeout(500);

  await page1.click('[data-test-id="input-editor"]');
  await page1.keyboard.type('1 2 3');

  await page2.waitForSelector('text="1 2 3"', { timeout: 2000 });

  await page1.close();
  await page2.close();
  await context1.close();
  await context2.close();
});

// hide typescript warning
// eslint-disable-next-line jest/no-export
export default {};
