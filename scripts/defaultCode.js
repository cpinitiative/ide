export default {
  cpp: `// Source: https://usaco.guide/general/io

#include <iostream>
using namespace std;

int main() {
    int a, b, c; cin >> a >> b >> c;
    cout << "sum is " << a+b+c << "\\n";
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
    private BufferedReader r;
    private StringTokenizer st = new StringTokenizer("");
    private String token;

    // standard input
    public Kattio() { this(System.in,System.out); }
    public Kattio(InputStream i, OutputStream o) {
        super(o);
        r = new BufferedReader(new InputStreamReader(i));
    }
    // USACO-style file input
    public Kattio(String problemName) throws IOException { 
        super(new FileWriter(problemName+".out"));
        r = new BufferedReader(new FileReader(problemName+".in"));
    }

    private String peek() {
        if (token == null)
            try {
                while (!st.hasMoreTokens()) {
                    String line = r.readLine();
                    if (line == null) return null;
                    st = new StringTokenizer(line);
                }
                token = st.nextToken();
            } catch (IOException e) { }
        return token;
    }
    public boolean hasMoreTokens() { return peek() != null; }
    private String next() {
        String ans = peek(); 
        token = null;
        return ans;
    }
    
    public int nextInt() { return Integer.parseInt(next()); }
    public double nextDouble() { return Double.parseDouble(next()); }
    public long nextLong() { return Long.parseLong(next()); }
}

public class Main {
    static Kattio io = new Kattio();
    public static void main(String[] args) {
        int a = io.nextInt();
        int b = io.nextInt();
        int c = io.nextInt();
        io.print("sum is ");
        io.println(a + b + c);
        io.close(); // make sure to include this line -- closes io and flushes the output
    }
}
`,
  py: `# Source: https://usaco.guide/general/io

a,b,c = map(int, input().split())
print("sum is",a+b+c)
`,
};
