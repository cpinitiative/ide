import { test, expect, Page } from '@playwright/test';
import { host, setInputEditorValue, setMainEditorValue } from './helpers';

test.describe('Basic Functionality', () => {
  test('should copy files', async ({ page, context }) => {
    await page.goto(`${host}/n`);
    await page.waitForSelector('button:has-text("Run Code")');

    // let monaco load
    await page.waitForTimeout(500);

    await page.click('[data-test-id="input-editor"]');
    await page.keyboard.type('1 2 3');

    await setMainEditorValue(page, 'code_value', 'cpp');
    await setInputEditorValue(page, 'input_value');

    // sync with yjs server
    await page.waitForTimeout(1500);

    await page.goto(page.url() + '/copy');
    await page.waitForSelector('button:has-text("Run Code")');

    expect(await page.$('text="code_value"')).toBeTruthy();

    // wait for yjs server to sync. Run Code button is shown once the main
    // editor is loaded, but the input editor might not have loaded yet.
    await page.waitForTimeout(1500);
    expect(await page.$('text="input_value"')).toBeTruthy();
  });
});
