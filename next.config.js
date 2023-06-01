/*
next-global-css is needed to import monaco-editor properly
See https://github.com/vercel/next.js/discussions/27953#discussioncomment-1992992
*/
const { withGlobalCss } = require('next-global-css');

const withConfig = withGlobalCss();

module.exports = withConfig({
  env: {
    IS_TEST_ENV: process.env.IS_TEST_ENV,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
});
