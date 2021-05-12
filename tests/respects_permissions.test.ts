/// <reference types="jest-playwright-preset" />
/// <reference types="expect-playwright" />

import { testRunCode } from './helpers';

// note: these tests are currently quite bad -- we need error handling for when permission is denied
// rather than just silently failing.

test('should support view only', async () => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  await page1.goto('http://localhost:5000/');
  await page1.click('text=File');
  await page1.click('text=Settings');
  await page1.click('div[role="radio"]:has-text("View Only")');
  await page1.click('text=Save');

  await page2.goto(page1.url());
  await page2.waitForSelector('button:has-text("Run Code")');
  await page2.waitForSelector('text="View Only"', { timeout: 2000 });

  // let monaco load
  await page1.waitForTimeout(500);
  await page2.waitForTimeout(500);

  // test input
  await page2.click('[data-test-id="input-editor"]');
  await page2.keyboard.type('1 2 3');
  expect(await page2.$('text="1 2 3"')).toBeFalsy();

  await page1.click('[data-test-id="input-editor"]');
  await page1.waitForTimeout(200);
  await page1.keyboard.type('1 2 3');

  await page1.waitForTimeout(200);
  expect(await page1.$('text="1 2 3"')).toBeTruthy();
  await page2.waitForSelector('text="1 2 3"', { timeout: 2000 });

  // test editor
  await page2.click('.view-lines div:nth-child(10)');
  await page1.waitForTimeout(200);
  await page2.keyboard.type('// this is a comment');
  await page1.waitForTimeout(200);
  expect(await page2.$('text="// this is a comment"')).toBeFalsy();
  await page1.click('.view-lines div:nth-child(10)');
  await page1.waitForTimeout(200);
  await page1.keyboard.type('// this is a comment');
  await page1.waitForTimeout(200);
  expect(await page1.$('text="// this is a comment"')).toBeTruthy();
  await page2.waitForSelector('text="// this is a comment"', { timeout: 2000 });
  // test run buttons -- both should work
  await testRunCode(page1);
  await testRunCode(page2);
  await page1.click('text="Main.java"');
  await page2.click('text="Main.java"');
  await page1.waitForSelector('button:has-text("Run Code")');
  await page2.waitForSelector('button:has-text("Run Code")');
  await page2.click('.view-lines div:nth-child(2)');
  await page1.waitForTimeout(200);
  await page2.keyboard.type('// this is a comment');
  await page1.waitForTimeout(200);
  expect(await page2.$('text="// this is a comment"')).toBeFalsy();
  await page1.click('.view-lines div:nth-child(2)');
  await page1.waitForTimeout(200);
  await page1.keyboard.type('// this is a comment');
  await page1.waitForTimeout(200);
  expect(await page1.$('text="// this is a comment"')).toBeTruthy();
  await page2.waitForSelector('text="// this is a comment"', { timeout: 2000 });
  // test run buttons -- both should work
  await testRunCode(page1);
  await testRunCode(page2);
  await page1.click('text="Main.py"');
  await page2.click('text="Main.py"');
  await page1.waitForSelector('button:has-text("Run Code")');
  await page2.waitForSelector('button:has-text("Run Code")');
  await page2.click('.view-lines div:nth-child(5)');
  await page1.waitForTimeout(200);
  await page2.keyboard.type('# this is a comment');
  await page1.waitForTimeout(200);
  expect(await page2.$('text="# this is a comment"')).toBeFalsy();
  await page1.click('.view-lines div:nth-child(5)');
  await page1.waitForTimeout(200);
  await page1.keyboard.type('# this is a comment');
  await page1.waitForTimeout(200);
  expect(await page1.$('text="# this is a comment"')).toBeTruthy();
  await page2.waitForSelector('text="# this is a comment"', { timeout: 2000 });
  // test run buttons -- both should work
  await testRunCode(page1);
  await testRunCode(page2);

  await page1.close();
  await page2.close();
  await context1.close();
  await context2.close();
});
