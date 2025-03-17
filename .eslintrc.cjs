module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: ['airbnb-base', 'eslint:recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'import', 'prettier'],
  rules: {
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-param-reassign': ['warn'],
    'import/extensions': 'off',
    'import/prefer-default-export': ['off'],
    'import/no-extraneous-dependencies': ['off'],
    'import/no-unresolved': 'off',
    'class-methods-use-this': 'off',
    'vue/multi-word-component-names': 'off',
    'no-undef': 'off',
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'import/no-relative-packages': 'off',
    'arrow-body-style': 'off',
    'no-use-before-define': 'off',
  },
};
