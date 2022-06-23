import { test, expect, Page } from '@playwright/test';
import { host } from './helpers';

test.describe('Dashboard Page', () => {
  test('should show recently accessed files', async ({ page, context }) => {
    await page.goto(`${host}`);
    await page.locator('text=Loading...').waitFor({ state: 'hidden' });
    expect(await page.$('text=Unnamed Workspace')).toBeFalsy();

    await page.goto(`${host}/new`);
    await page.waitForSelector('button:has-text("Run Code")');
    await page.waitForSelector('button:has-text("1 User Online")');
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));
    await page.waitForTimeout(500); // waiting for file info to be uploaded to firebase

    await page.goto(`${host}`);

    await page.locator('text=Loading...').waitFor({ state: 'hidden' });

    expect(await page.$('text=Unnamed Workspace')).toBeTruthy();
  });
});
