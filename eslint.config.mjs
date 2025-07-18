import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
      parser: tsEslint.parser,
      parserOptions: {
        parser: tsEslint.parser,
      }
    }
  },
  {
    ignores: [
      'build/',
      'dist/',
      'node_modules/',
      '.history/',
      '.github/',
      '.vscode/',
      'build/',
      'coverage/',
      '.env*',
      '.DS_Store',
      '.vercel'
    ]
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    }
  }
];