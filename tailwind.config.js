const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './src/**/*.js',
    './src/**/*.ts',
    './src/**/*.tsx',
    './pages/**/*.js',
    './pages/**/*.ts',
    './pages/**/*.tsx',
  ],
  theme: {
    extend: {
      colors: {
        gray: colors.neutral,
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
