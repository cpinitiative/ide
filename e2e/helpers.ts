import { Page, expect } from '@playwright/test';

export const host = 'http://localhost:3000';

export async function createNew(page1: Page) {
  // page1.on('dialog', dialog => dialog.accept('nice title'));
  await page1.goto(`${host}/n`);
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

export const testRunCode = async (
  page: Page,
  isMobile: boolean
): Promise<void> => {
  if (isMobile) {
    await page.click('text=Input/Output');
  }
  await page.locator('button:has-text("stdout")').click();
  await page.click('button:has-text("Run Code")');
  expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
  await page.waitForSelector('button:has-text("Run Code")');
  await expect(page.getByText('Successful')).toBeVisible({ timeout: 1000 });
  await page.locator('button:has-text("stdout")').click();
  await expect(
    page.getByText('The sum of these three numbers is 6')
  ).toBeVisible({ timeout: 1000 });
  if (isMobile) {
    await page.getByTestId('mobile-bottom-nav-code-button').click();
  }
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

export const waitForEditorToLoad = async (page: Page): Promise<void> => {
  // wait for monaco / codemirror to load (monaco / codemirror is a lazy component, so it may take some time for it to load)
  await expect(page.getByTestId('editorLoadingMessage')).toHaveCount(0);
};

export const isMonaco = async (page: Page): Promise<boolean> => {
  // note: this is a hacky way to detect whether we are using monaco.
  // in particular, it's possible for this.monaco to be loaded,
  // for us to resize the window to be small, and for us to use codemirror
  // even though this.monaco is set
  if (await page.evaluate(`this.monaco`)) {
    return true;
  }
  return false;
};

export const setMainEditorValue = async (
  page: Page,
  value: string,
  language: string // needed for monaco only
): Promise<void> => {
  if (await isMonaco(page)) {
    await page.evaluate(
      `this.monaco.editor.getModels().find(x => x.getLanguageId() === "${language}").setValue(\`${value}\`)`
    );
  } else {
    await page.evaluate(`
      this.TEST_mainCodemirrorEditor.dispatch({
        changes: {from: 0, to: this.TEST_mainCodemirrorEditor.state.doc.length, insert: \`${value}\`}
      });
    `);
  }
};

export const setInputEditorValue = async (
  page: Page,
  value: string
): Promise<void> => {
  if (await isMonaco(page)) {
    await page.evaluate(
      `this.monaco.editor.getModels().find(x => x.getLanguageId() === "plaintext").setValue(\`${value}\`)`
    );
  } else {
    await page.evaluate(`
      this.TEST_inputCodemirrorEditor.dispatch({
        changes: {from: 0, to: this.TEST_inputCodemirrorEditor.state.doc.length, insert: \`${value}\`}
      });
    `);
  }
};
