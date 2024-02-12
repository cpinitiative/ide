import { test, expect } from '@playwright/test';
import { host, waitForEditorToLoad } from './helpers';

test.use({ userAgent: 'Windows' });

test.describe('Windows EOL fix', () => {
  // Monaco editor uses \r\n on Windows, but this breaks YJS.
  // We manually patch monaco-editor to use \n everywhere.
  test('should use \\n in windows for EOL instead of \\r\\n', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "Monaco isn't used on mobile");

    await page.goto(`${host}/n`);
    await page.waitForSelector('button:has-text("Run Code")');

    await waitForEditorToLoad(page);

    // don't know why, but initially Monaco will be \n.
    // this forces it to re-evaluate the EOL, which exposes the \r\n bug.
    await page.evaluate(`this.monaco.editor.getModels()[0].setValue(".")`);
    expect(
      await page.evaluate(`this.monaco.editor.getModels()[0].getEOL()`)
    ).toEqual('\n');
  });
});
