import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import stylisticJs from '@stylistic/eslint-plugin-js'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', 'docs/**', '.husky/**']
  },
  {
    files: ['src/**/*.{js,mjs,cjs,jsx,ts,tsx}', 'tests/**/*.{js,mjs,cjs,jsx,ts,tsx}', 'scripts/**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      '@stylistic/js': stylisticJs
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-constant-condition': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'prefer-const': 'off'
    }
  }
)
