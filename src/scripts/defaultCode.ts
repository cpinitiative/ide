export default {
  cpp: `// Source: https://usaco.guide/general/io

#include <bits/stdc++.h>
using namespace std;

int main() {
\tint a, b, c; cin >> a >> b >> c;
\tcout << "sum is " << a+b+c << "\\n";
}
`,
  java: `// Source: https://usaco.guide/general/io

/** Simple yet moderately fast I/O routines.
 *
 * Example usage:
 *
 * Kattio io = new Kattio();
 *
 * while (io.hasMoreTokens()) {
 *    int n = io.nextInt();
 *    double d = io.nextDouble();
 *    double ans = d*n;
 *
 *    io.println("Answer: " + ans);
 * }
 *
 * io.close();
 *
 *
 * Some notes:
 *
 * - When done, you should always do io.close() or io.flush() on the
 *   Kattio-instance, otherwise, you may lose output.
 *
 * - The nextInt(), nextDouble(), and nextLong() methods will throw an
 *   exception if there is no more data in the input, so it is generally
 *   a good idea to use hasMoreTokens() to check for end-of-file.
 *
 * @author: Kattis
 */

import java.util.*;
import java.io.*;

class Kattio extends PrintWriter {
\tprivate BufferedReader r;
\tprivate StringTokenizer st = new StringTokenizer("");
\tprivate String token;

\t// standard input
\tpublic Kattio() { this(System.in,System.out); }
\tpublic Kattio(InputStream i, OutputStream o) {
\t\tsuper(o);
\t\tr = new BufferedReader(new InputStreamReader(i));
\t}
\t// USACO-style file input
\tpublic Kattio(String problemName) throws IOException { 
\t\tsuper(new FileWriter(problemName+".out"));
\t\tr = new BufferedReader(new FileReader(problemName+".in"));
\t}

\tprivate String peek() {
\t\tif (token == null)
\t\t\ttry {
\t\t\t\twhile (!st.hasMoreTokens()) {
\t\t\t\t\tString line = r.readLine();
\t\t\t\t\tif (line == null) return null;
\t\t\t\t\tst = new StringTokenizer(line);
\t\t\t\t}
\t\t\t\ttoken = st.nextToken();
\t\t\t} catch (IOException e) { }
\t\treturn token;
\t}
\tpublic boolean hasMoreTokens() { return peek() != null; }
\tpublic String next() {
\t\tString ans = peek(); 
\t\ttoken = null;
\t\treturn ans;
\t}
\t
\tpublic int nextInt() { return Integer.parseInt(next()); }
\tpublic double nextDouble() { return Double.parseDouble(next()); }
\tpublic long nextLong() { return Long.parseLong(next()); }
}

public class Main {
\tstatic Kattio io = new Kattio();
\tpublic static void main(String[] args) {
\t\tint a = io.nextInt();
\t\tint b = io.nextInt();
\t\tint c = io.nextInt();
\t\tio.print("sum is ");
\t\tio.println(a + b + c);
\t\tio.close(); // make sure to include this line -- closes io and flushes the output
\t}
}
`,
  py: `# Source: https://usaco.guide/general/io

a,b,c = map(int, input().split())
print("sum is",a+b+c)
`,
};
