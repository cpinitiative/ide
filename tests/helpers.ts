import { Page } from 'playwright';

export const host = 'http://localhost:5000';

export const testRunCode = async (page: Page): Promise<void> => {
  await page.click('button:has-text("Run Code")');
  expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
  await page.waitForSelector('button:has-text("Run Code")');
  expect(await page.$('text=Successful')).toBeTruthy();
  expect(await page.$('text="sum is 6"')).toBeTruthy();
};

export const forEachLang = async (
  page: Page,
  func: () => Promise<unknown>
): Promise<void> => {
  await page.click('text=Main.java');
  await page.waitForSelector('button:has-text("Run Code")');
  await func();

  await page.click('text=Main.py');
  await page.waitForSelector('button:has-text("Run Code")');
  await func();

  await page.click('text=Main.cpp');
  await page.waitForSelector('button:has-text("Run Code")');
  await func();
};
