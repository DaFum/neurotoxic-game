import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default [
  {
    ignores: ['dist/**', 'src/data/songs.js', '.claude/**']
  },
  react.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
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
      'react-hooks': reactHooks
    },
    settings: {
      react: {
        version: '19.2.4'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...prettier.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
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
      ]
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
