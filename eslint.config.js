import js from '@eslint/js'
import globals from 'globals'
import eslintReact from '@eslint-react/eslint-plugin'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'

// Shared to keep JS/TS rulesets consistent.
const RESTRICTED_IMPORTS = {
  patterns: [
    {
      group: ['**/data/events.js'],
      message:
        'Use the canonical event DB entrypoint: src/data/events/index.js.'
    }
  ]
}

export default [
  {
    ignores: [
      'dist/**',
      'src/data/songs.js',
      '.agents/**',
      'report/**',
      '.claude/**'
    ]
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
      'no-restricted-imports': ['error', RESTRICTED_IMPORTS],
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
    files: ['**/*.{ts,tsx}'],
    ...eslintReact.configs.recommended,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
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
      '@typescript-eslint': tseslint,
      ...eslintReact.configs.recommended.plugins
    },
    rules: {
      ...js.configs.recommended.rules,
      ...eslintReact.configs.recommended.rules,
      ...prettier.rules,
      'no-restricted-imports': ['error', RESTRICTED_IMPORTS],
      // PropTypes are intentionally used in this codebase for runtime checks in TSX too.
      '@eslint-react/no-prop-types': 'off',
      // Project policy is "never any"; keep this visible in lint output.
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
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
      '**/*.{config,setup}.{ts,mts,cts}',
      'tests/**/*.{js,jsx,mjs}',
      'tests/**/*.{ts,tsx,mts,cts}',
      'e2e/**/*.{js,jsx,mjs}',
      'extract_venues.js',
      'scripts/**/*.{js,cjs,mjs}'
    ],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    rules: {
      '@eslint-react/component-hook-factories': 'off'
    }
  }
]
