// TODO: Rename to usaco_judge.spec.ts once USACO judge Cloudflare issues are fixed
import { test, expect } from '@playwright/test';
import {
  host,
  setMainEditorValue,
  switchLang,
  waitForEditorToLoad,
} from './helpers';

test.describe('USACO Judge Functionality', () => {
  test('should fetch usaco info correctly', async ({ page, isMobile }) => {
    await page.goto(`${host}/usaco/1131`);
    await page.waitForSelector('button:has-text("Run Code")');
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));
    // let monaco load
    await page.waitForTimeout(500);

    expect(await page.$('text=2021 US Open Bronze')).toBeTruthy();
    expect(await page.$('text=Acowdemia I')).toBeTruthy();

    if (isMobile) {
      await page.click('text=Input/Output');
    }

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

  test('should be able to run samples', async ({ page, isMobile }) => {
    await page.goto(`${host}/usaco/1131`);

    await page.waitForSelector('button:has-text("Run Code")');
    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));

    await waitForEditorToLoad(page);

    if (isMobile) {
      await page.click('text=Input/Output');
    }

    await page.locator('button:has-text("Run Samples")').click();

    await page
      .locator('[data-test-id="run-code-loading"]')
      .waitFor({ state: 'detached' });
    await expect(
      page.locator('[data-test-id="code-execution-output-status"]')
    ).toContainText('Sample Verdicts: WW. Sample 1: Wrong Answer');

    await switchLang(page, 'Java');
    await page.waitForSelector('button:has-text("Run Code")');

    const code = `import java.io.BufferedReader;
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
`.replace(/\n/g, '');

    await setMainEditorValue(page, code, 'java');

    await page.locator('button:has-text("Run Samples")').click();

    await page
      .locator('[data-test-id="code-execution-output-status"]')
      .waitFor({ state: 'visible' });

    await expect(
      page.locator('[data-test-id="code-execution-output-status"]')
    ).toContainText('Sample Verdicts: AA. Sample 2: Successful');
  });

  test('should be able to submit to USACO server', async ({
    page,
    isMobile,
  }) => {
    await page.goto(`${host}/usaco/1131`);
    await page.waitForSelector('button:has-text("Run Code")');

    await waitForEditorToLoad(page);

    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));

    await page.waitForSelector('button:has-text("Run Code")');

    // Submit code
    if (isMobile) {
      await page.click('text=Input/Output');
    }
    await page.locator('button:has-text("Submit")').click();

    await page
      .locator('text="Incorrect answer on sample input case -- details below"')
      .waitFor({ state: 'attached', timeout: 60000 }); // sometimes USACO server is slow...
  });

  test('should be able to use file I/O for usaco problems', async ({
    page,
    isMobile,
  }) => {
    await page.goto(`${host}/usaco/363`);
    await page.waitForSelector('button:has-text("Run Code")');

    await waitForEditorToLoad(page);

    expect(page.url()).toMatch(new RegExp(`${host}/[A-z0-9_-]{19}`));

    const code = `#include <iostream>
    #include <algorithm>
    #include <cstdio>
    #include <cstring>
    
    using namespace std;
    
    #define MAXN 100010
    
    int X[MAXN];
    int Y[MAXN];
    int PI[MAXN];
    
    void compose(int* R, int* A, int* B, int N) {
      for(int i = 0; i < N; i++) {
        R[i] = A[B[i]];
      }
    }
    
    int main() {
      freopen("shuffle.in", "r", stdin);
      freopen("shuffle.out", "w", stdout);
    
      int N, M, Q; cin >> N >> M >> Q;
      int T = N - M + 1;
      for(int i = 0; i < N; i++) {
        X[i] = i;
        if(i < M) {
          int x; cin >> x; x--;
          PI[x] = i;
        } else {
          PI[i] = i;
        }
      }
      rotate(PI, PI + 1, PI + N);
    
      for(int i = 31 - __builtin_clz(T); i >= 0; i--) {
        compose(Y, X, X, N);
        memcpy(X, Y, sizeof(X));
        if(T & 1 << i) {
          compose(Y, X, PI, N);
          memcpy(X, Y, sizeof(X));
        }
      }
      for(int i = 0; i < Q; i++) {
        int x; cin >> x;
        cout << X[(N + M - 1 - x) % N] + 1 << endl;
      }
      return 0;
    }`;
    await setMainEditorValue(page, code, 'cpp');

    if (isMobile) {
      await page.click('text=Input/Output');
    }
    await page.locator('button:has-text("Run Samples")').click();

    await page
      .locator('[data-test-id="code-execution-output-status"]')
      .waitFor({ state: 'visible' });

    await expect(
      page.locator('[data-test-id="code-execution-output-status"]')
    ).toContainText('Sample: Successful');
  });
});
