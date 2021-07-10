/// <reference types="jest-playwright-preset" />
/// <reference types="expect-playwright" />

import { testRunCode, goToPage, createNew } from './helpers';

// note: these tests are currently quite bad -- we need error handling for when permission is denied
// rather than just silently failing.

test('should support view only', async () => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  await createNew(page1);
  await page1.waitForSelector('text="Run Code"');
  await page1.click('text=File');
  await page1.click('text=Settings');
  await page1.click('div[role="radio"]:has-text("View Only")');
  await page1.click('text=Save');

  await goToPage(page1, page2);
  await page2.waitForSelector('button:has-text("Run Code")');
  await page2.waitForSelector('text="View Only"');

  // let monaco load
  await page1.waitForTimeout(500);
  await page2.waitForTimeout(500);

  // test input
  await page2.click('[data-test-id="input-editor"]');
  await page2.waitForTimeout(200);
  await page2.keyboard.type('1 2 3');
  await page2.waitForTimeout(200);
  expect(await page2.$('text="1 2 3"')).toBeFalsy();

  await page1.click('[data-test-id="input-editor"]');
  await page1.waitForTimeout(200);
  await page1.keyboard.type('1 2 3');
  await page1.waitForTimeout(200);
  expect(await page1.$('text="1 2 3"')).toBeTruthy();
  await page2.waitForSelector('text="1 2 3"');

  // test scribble
  await page2.click('text=scribble');
  await page2.waitForTimeout(200);
  await page2.click('[data-test-id="scribble-editor"]');
  await page2.waitForTimeout(200);
  await page2.keyboard.type('testing scribble');
  await page2.waitForTimeout(200);
  expect(await page2.$('text="testing scribble"')).toBeFalsy();

  await page1.click('text=scribble');
  await page1.waitForTimeout(200);
  await page1.click('[data-test-id="scribble-editor"]');
  await page1.waitForTimeout(200);
  await page1.keyboard.type('testing scribble');
  await page1.waitForTimeout(200);
  expect(await page1.$('text="testing scribble"')).toBeTruthy();
  await page2.waitForSelector('text="testing scribble"');

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
  await page2.waitForSelector('text="// this is a comment"');
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
  await page2.waitForSelector('text="// this is a comment"');
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
  await page2.waitForSelector('text="# this is a comment"');
  // test run buttons -- both should work
  await testRunCode(page1);
  await testRunCode(page2);

  await page1.close();
  await page2.close();
  await context1.close();
  await context2.close();
});

test('should work when default permission is changed', async () => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  await createNew(page1);
  await page1.waitForSelector('button:has-text("Run Code")');

  await goToPage(page1, page2);
  await page2.waitForSelector('button:has-text("Run Code")');

  // let monaco load
  await page1.waitForTimeout(500);
  await page2.waitForTimeout(500);

  // test input: everything should still work right now
  await page2.click('[data-test-id="input-editor"]');
  await page2.keyboard.type('1 2 3');
  await page2.waitForSelector('text="1 2 3"');

  // try view only
  await page1.click('text=File');
  await page1.click('text=Settings');
  await page1.click('div[role="radio"]:has-text("View Only")');
  await page1.click('text=Save');
  await page2.waitForSelector('text="View Only"');

  // test input: we shouldn't be able to type anything on page 2
  await page2.click('[data-test-id="input-editor"]');
  await page2.keyboard.type('4 5 6');
  expect(await page2.$('text="4 5 6"')).toBeFalsy();

  // try private
  await page1.click('text=File');
  await page1.click('text=Settings');
  await page1.click('div[role="radio"]:has-text("Private")');
  await page1.click('text=Save');
  await page2.waitForSelector('text="This file is private."');

  // back to read/write
  await page1.click('text=File');
  await page1.click('text=Settings');
  await page1.click('div[role="radio"]:has-text("Public Read & Write")');
  await page1.click('text=Save');
  await page2.waitForSelector('button:has-text("Run Code")');

  // test input: we should be able to type stuff now
  await page2.click('[data-test-id="input-editor"]');
  await page2.keyboard.type('0 9 8');
  // 1 2 3 from above
  await page2.waitForSelector('text="1 2 30 9 8"');

  await page1.close();
  await page2.close();
  await context1.close();
  await context2.close();
});
