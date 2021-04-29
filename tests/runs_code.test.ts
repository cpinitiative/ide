/// <reference types="jest-playwright-preset" />
/// <reference types="expect-playwright" />

test('should run code', async () => {
  await page.goto('http://localhost:3000/');
  await page.waitForSelector('button:has-text("Run Code")');
  expect(page.url()).toMatch(/http:\/\/localhost:3000\/[A-z0-9_-]{19}/);

  const testRunCode = async () => {
    await page.click('button:has-text("Run Code")');
    expect(await page.$('[data-test-id="run-code-loading"]')).toBeTruthy();
    await page.waitForSelector('button:has-text("Run Code")');
    expect(await page.$('text=Accepted')).toBeTruthy();
    expect(await page.$('text="sum is 6"')).toBeTruthy();
  };

  await page.click('[data-test-id="input-editor"]');
  await page.keyboard.type('1 2 3');

  await page.click('text=Main.java');
  testRunCode();

  await page.click('text=Main.py');
  testRunCode();

  await page.click('text=Main.cpp');
  testRunCode();
});

test('should sync code', async () => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  await page1.goto('http://localhost:3000/');
  await page1.waitForSelector('button:has-text("Run Code")');
  await page2.goto(page1.url());
  await page2.waitForSelector('button:has-text("Run Code")');

  await page1.click('[data-test-id="input-editor"]');
  await page1.keyboard.type('1 2 3');

  await page2.waitForSelector('text="1 2 3"', { timeout: 2000 });

  await page1.close();
  await page2.close();
  await context1.close();
  await context2.close();
});

// hide typescript warning
// eslint-disable-next-line jest/no-export
export default {};
