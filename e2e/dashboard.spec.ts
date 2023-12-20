import { test, expect, Page } from '@playwright/test';
import { host } from './helpers';

test.describe('Dashboard Page', () => {
  test('should show recently accessed files', async ({ page, isMobile }) => {
    await page.goto(`${host}`);
    await page.locator('text=Loading...').waitFor({ state: 'hidden' });
    expect(await page.$('text=Unnamed Workspace')).toBeFalsy();

    await page.goto(`${host}/n`);
    await page.waitForSelector('button:has-text("Run Code")');
    if (!isMobile) {
      await page.waitForSelector('button:has-text("1 User Online")');
    }
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));
    await page.waitForTimeout(1500); // waiting for file info to be uploaded to firebase

    await page.goto(`${host}`);

    await page.locator('text=Loading...').waitFor({ state: 'hidden' });
    await page.locator('text=Loading files...').waitFor({ state: 'hidden' });

    expect(await page.$('text=Unnamed Workspace')).toBeTruthy();
    expect(await page.$('text="Me"')).toBeTruthy();
  });

  test('should show owner field properly', async ({
    page,
    browser,
    isMobile,
  }) => {
    await page.goto(`${host}/n`);
    await page.waitForSelector('button:has-text("Run Code")');
    await page.locator('text=File').click();
    await page.locator('text=Settings').click();
    // Click user button tab
    await page.locator('text="User"').click();
    await page.locator('input[name="name"]').click();
    await page.locator('input[name="name"]').press('Control+a');
    await page.locator('input[name="name"]').fill('My Name');
    await page.locator('text=Save').click();

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto(page.url());
    await page2.waitForSelector('button:has-text("Run Code")');
    if (!isMobile) {
      await page2.waitForSelector('button:has-text("2 Users Online")');
    }
    expect(page2.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));
    await page2.waitForTimeout(1500); // waiting for file info to be uploaded to firebase

    await page2.goto(`${host}`);
    await page.goto(`${host}`);

    await page2.locator('text=Loading...').waitFor({ state: 'hidden' });
    await page.locator('text=Loading...').waitFor({ state: 'hidden' });
    await page2.locator('text=Loading files...').waitFor({ state: 'hidden' });
    await page.locator('text=Loading files...').waitFor({ state: 'hidden' });

    expect(await page2.$('text="My Name"')).toBeTruthy();
    expect(await page.$('text="Me"')).toBeTruthy();

    await page2.close();
    await context2.close();
  });
});
