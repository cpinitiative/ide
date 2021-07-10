import { Page } from 'playwright';

export const host = 'http://localhost:5000';

export async function createNew(page1: Page) {
  // page1.on('dialog', dialog => dialog.accept('nice title'));
  await page1.goto(`${host}/new`);
  // await page1.waitForTimeout(2000); // wait for dialog to be accepted?
  // expect(await page1.title()).toMatch(
  //   'nice title · Real-Time Collaborative Online IDE'
  // );
}

export async function goToPage(page1: Page, page2: Page) {
  await page2.goto(page1.url());
  // await page2.waitForTimeout(2000); // wait for title to update
  // expect(await page2.title()).toMatch(
  //   'nice title · Real-Time Collaborative Online IDE'
  // );
}

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
