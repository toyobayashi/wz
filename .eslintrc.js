module.exports = {
  root: true,
  env: {
    node: true,
    browser: true
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'standard-with-typescript'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/method-signature-style': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/prefer-includes': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/class-literal-property-style': 'off',
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'none',
        requireLast: true
      },
      singleline: {
        delimiter: 'semi',
        requireLast: false
      }
    }]
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true
  }
}
