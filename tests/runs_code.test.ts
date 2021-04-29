/// <reference types="jest-playwright-preset" />
/// <reference types="expect-playwright" />

test('should work', async () => {
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('button:has-text("Run Code")');
  expect(page.url()).toMatch(/http:\/\/localhost:3000\/[A-z0-9_-]{19}/);

  await page.click('button:has-text("Run Code")');
  expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
  await page.waitForSelector('button:has-text("Run Code")');
  expect(await page.$('text=Accepted')).toBeTruthy();

  await page.click('[data-test-id="input-editor"]');
  await page.keyboard.type('1 2 3');

  await page.click('text=Main.java');
  await page.click('button:has-text("Run Code")');
  expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
  await page.waitForSelector('button:has-text("Run Code")');
  expect(await page.$('text=Accepted')).toBeTruthy();
  expect(await page.$('text="sum is 6"')).toBeTruthy();

  await page.click('text=Main.py');
  await page.click('button:has-text("Run Code")');
  expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
  await page.waitForSelector('button:has-text("Run Code")');
  expect(await page.$('text=Accepted')).toBeTruthy();
  expect(await page.$('text="sum is 6"')).toBeTruthy();

  await page.click('text=Main.cpp');
  await page.click('button:has-text("Run Code")');
  expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
  await page.waitForSelector('button:has-text("Run Code")');
  expect(await page.$('text=Accepted')).toBeTruthy();
  expect(await page.$('text="sum is 7"')).toBeTruthy();
});

// hide typescript warning
// eslint-disable-next-line jest/no-export
export default {};
