import { test, expect } from '@playwright/test';
import { host, isMonaco } from './helpers';

test.describe('Mobile Specific Checks', () => {
  test('should load monaco for desktop and codemirror for mobile', async ({
    page,
    isMobile,
  }) => {
    await page.goto(`${host}/n`);
    await page.waitForSelector('button:has-text("Run Code")');
    await expect(page.getByTestId('monacoLoadingMessage')).toHaveCount(0);

    if (isMobile) {
      expect(await isMonaco(page)).toBeFalsy();
    } else {
      expect(await isMonaco(page)).toBeTruthy();
    }
  });
});
