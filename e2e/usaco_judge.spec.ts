import { test, expect, Page } from '@playwright/test';
import { createNew, forEachLang, goToPage, host, testRunCode } from './helpers';

test.describe('USACO Judge Functionality', () => {
  test('should fetch usaco info correctly', async ({ page }) => {
    await page.goto(`${host}/usaco/1131`);
    await page.waitForSelector('button:has-text("Run Code")');
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));
    // let monaco load
    await page.waitForTimeout(500);

    expect(await page.$('text=2021 US Open Bronze')).toBeTruthy();
    expect(await page.$('text=Acowdemia I')).toBeTruthy();

    await page.locator('text=Sample 1').click();
    expect(await page.$('text=4 0 1 100 2 3')).toBeTruthy();

    await page.locator('text=Sample 2').click();
    expect(await page.$('text=4 1 1 100 2 3')).toBeTruthy();
  });

  test('should throw an error for an invalid USACO ID', async ({ page }) => {
    await page.goto(`${host}/usaco/sfkj23`);

    await page.locator('text=Loading').waitFor({ state: 'detached' });

    expect(
      await page.$('text=Error: Could not identify problem ID.')
    ).toBeTruthy();
  });

  test('should be able to run samples', async ({ page }) => {
    await page.goto(`${host}/usaco/1131`);
    await page.waitForSelector('button:has-text("Run Code")');
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));
    // let monaco load
    await page.waitForTimeout(500);

    await page.locator('button:has-text("Run Samples")').click();

    await page
      .locator('[data-test-id="run-code-loading"]')
      .waitFor({ state: 'detached' });
    expect(
      await page.$('text=Sample Verdicts: WW. Sample 1: Wrong Answer')
    ).toBeTruthy();

    await page.locator('button:has-text("Java")').click();
    // Click editor
    await page.locator('.view-lines').first().click();

    await page.locator('[data-test-id="code-editor"]').press('Control+a');
    await page.locator('[data-test-id="code-editor"]').type(
      `import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.Comparator;
import java.util.StringTokenizer;
public class AcowdemiaI {
static int hIndex(Integer[] papers) {int h = papers.length;while (h > 0 && papers[h - 1] < h) h--;return h;}
public static void main(String[] args) throws IOException {
BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
StringTokenizer tokenizer = new StringTokenizer(in.readLine());
int n = Integer.parseInt(tokenizer.nextToken());
int l = Integer.parseInt(tokenizer.nextToken());
Integer[] papers = new Integer[n];
tokenizer = new StringTokenizer(in.readLine());
for (int j = 0; j < n; j++) papers[j] = Integer.parseInt(tokenizer.nextToken());
Arrays.sort(papers, Comparator.reverseOrder());
int h = hIndex(papers);
if (h != n)for (int j = h; j >= 0 && j > h - l; j--)papers[j]++;
Arrays.sort(papers, Comparator.reverseOrder());
System.out.println(hIndex(papers));
}
}
`.replace(/\n/g, '') // without this, sometimes monaco adds closing braces that causes test to fail
    );

    await page.locator('button:has-text("Run Samples")').click();

    await page
      .locator('[data-test-id="run-code-loading"]')
      .waitFor({ state: 'detached' });

    expect(
      await page.$('text=Sample Verdicts: AA. Sample 2: Successful')
    ).toBeTruthy();
  });

  test('should be able to submit to USACO server', async ({ page }) => {
    await page.goto(`${host}/usaco/1131`);
    await page.waitForSelector('button:has-text("Run Code")');
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));

    // Submit code
    await page.locator('button:has-text("Submit")').click();

    await page
      .locator('text=Incorrect answer on sample input case -- details below')
      .waitFor({ state: 'attached', timeout: 20000 });
  });
});
