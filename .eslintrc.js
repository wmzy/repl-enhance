module.exports = {
  root: true,
  env: {
    node: true
  },
  plugins: ['prettier'],
  extends: [
    'airbnb-base',
    'eslint-config-prettier'
  ],
  rules: {
    'prettier/prettier': ['error'],
    "no-use-before-define": ["error", { "functions": false, "classes": false }],
    "consistent-return": ["error", { "treatUndefinedAsUnspecified": true }],
    "no-void": 0,
    'no-return-assign': ['error', 'except-parens'],
    'no-shadow': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
