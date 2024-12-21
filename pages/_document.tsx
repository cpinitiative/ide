import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
        <script
          defer
          data-site-id="ide.usaco.guide"
          src="https://assets.onedollarstats.com/tracker.js"
        ></script>
      </body>
    </Html>
  );
}
