module.exports = {
  env: {
    node: true,
    es2021: true,
    'jest/globals': true
  },
  extends: ['eslint:recommended', 'plugin:jest/recommended'],
  plugins: ['jest'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always']
  }
};
