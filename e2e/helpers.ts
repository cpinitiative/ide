import { Page, expect } from '@playwright/test';

export const host = 'http://localhost:3000';

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
  await page.locator('button:has-text("stdout")').click();
  await page.click('button:has-text("Run Code")');
  expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
  await page.waitForSelector('button:has-text("Run Code")');
  expect(await page.$('text=Successful')).toBeTruthy();
  await page.locator('button:has-text("stdout")').click();
  expect(
    await page.$('text="The sum of these three numbers is 6"')
  ).toBeTruthy();
};

export const switchLang = async (
  page: Page,
  lang: 'Java' | 'Python 3.8.1' | 'C++'
) => {
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: lang }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForSelector('button:has-text("Run Code")');
};

export const forEachLang = async (
  page: Page,
  func: () => Promise<unknown>
): Promise<void> => {
  await switchLang(page, 'Java');
  await func();

  await switchLang(page, 'Python 3.8.1');
  await func();

  await switchLang(page, 'C++');
  await func();
};
