import { test, expect, Page } from '@playwright/test';
import { host, setInputEditorValue, setMainEditorValue } from './helpers';

test.describe('Basic Functionality', () => {
  test('should copy files', async ({ page }) => {
    await page.goto(`${host}/n`);
    await page.waitForSelector('button:has-text("Run Code")');

    // let monaco load
    await page.waitForTimeout(500);

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
