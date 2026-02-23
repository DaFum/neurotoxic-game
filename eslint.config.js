import js from '@eslint/js'
import globals from 'globals'
import eslintReact from '@eslint-react/eslint-plugin'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['dist/**', 'src/data/songs.js', '.claude/**']
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    ...eslintReact.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.es2021
      }
    },
    plugins: {
      ...eslintReact.configs.recommended.plugins
    },
    rules: {
      ...js.configs.recommended.rules,
      ...eslintReact.configs.recommended.rules,
      ...prettier.rules,
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/data/events.js'],
              message:
                'Use the canonical event DB entrypoint: src/data/events/index.js.'
            }
          ]
        }
      ],
      'no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      // PropTypes are intentionally used in this JS project for runtime type checking
      '@eslint-react/no-prop-types': 'off'
    }
  },
  {
    files: [
      '.eslintrc.cjs',
      'vite.config.js',
      '*.config.js',
      'tests/**/*.{js,jsx,mjs}',
      'e2e/**/*.{js,jsx,mjs}',
      'extract_venues.js'
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
]
