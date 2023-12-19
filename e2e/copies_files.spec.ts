import { test, expect } from '@playwright/test';
import {
  host,
  setInputEditorValue,
  setMainEditorValue,
  waitForMonacoToLoad,
} from './helpers';

test.describe('Basic Functionality', () => {
  test('should copy files', async ({ page }) => {
    await page.goto(`${host}/n`);
    await page.waitForSelector('button:has-text("Run Code")');

    await waitForMonacoToLoad(page);

    await setMainEditorValue(page, 'code_value', 'cpp');
    await setInputEditorValue(page, 'input_value');

    // sync with yjs server
    await page.waitForTimeout(1500);

    await page.goto(page.url() + '/copy');
    await page.waitForSelector('button:has-text("Run Code")');

    await expect(page.getByText('code_value')).toHaveCount(1);
    await expect(page.getByText('input_value')).toHaveCount(1);
  });
});
