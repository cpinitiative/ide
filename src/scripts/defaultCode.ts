export default {
  cpp: `// Source: https://usaco.guide/general/io

#include <bits/stdc++.h>
using namespace std;

int main() {
\tint a, b, c; cin >> a >> b >> c;
\tcout << "The sum of these three numbers is " << a + b + c << "\\n";
}
`,
  java: `// Source: https://usaco.guide/general/io

import java.io.*;
import java.util.StringTokenizer;

public class Main {
\tpublic static void main(String[] args) throws IOException {
\t\tBufferedReader r = new BufferedReader(new InputStreamReader(System.in));
\t\tPrintWriter pw = new PrintWriter(System.out);

\t\tStringTokenizer st = new StringTokenizer(r.readLine());
\t\tint a = Integer.parseInt(st.nextToken());
\t\tint b = Integer.parseInt(st.nextToken());
\t\tint c = Integer.parseInt(st.nextToken());
\t\tpw.print("The sum of these three numbers is ");
\t\tpw.println(a + b + c);
\t\t/*
\t\t * Make sure to include the line below, as it
\t\t * flushes and closes the output stream.
\t\t */
\t\tpw.close();
\t}
}
`,
  py: `# Source: https://usaco.guide/general/io

a, b, c = map(int, input().split())
print("The sum of these three numbers is", a + b + c)
`,
};
