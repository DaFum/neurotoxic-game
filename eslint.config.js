import js from '@eslint/js'
import globals from 'globals'
import eslintReact from '@eslint-react/eslint-plugin'
import tseslint from 'typescript-eslint'
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

const UNUSED_VARS_IGNORE_PATTERNS = {
  varsIgnorePattern: '^_',
  argsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_'
}

const BASE_LANGUAGE_OPTIONS = {
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
}

const BASE_PLUGINS = {
  ...eslintReact.configs.recommended.plugins
}

const BASE_RULES = {
  ...prettier.rules,
  'no-restricted-imports': ['error', RESTRICTED_IMPORTS],
  'no-unused-vars': ['warn', UNUSED_VARS_IGNORE_PATTERNS]
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
    languageOptions: BASE_LANGUAGE_OPTIONS,
    plugins: BASE_PLUGINS,
    rules: {
      ...js.configs.recommended.rules,
      ...eslintReact.configs.recommended.rules,
      ...BASE_RULES,
      // PropTypes are intentionally used in this JS project for runtime type checking
      '@eslint-react/no-prop-types': 'off'
    }
  },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    ...eslintReact.configs.recommended,
    languageOptions: {
      ...BASE_LANGUAGE_OPTIONS,
      parser: tseslint.parser
    },
    plugins: {
      ...BASE_PLUGINS,
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      ...js.configs.recommended.rules,
      ...eslintReact.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...BASE_RULES,
      // PropTypes are intentionally used in this codebase for runtime checks in TSX too.
      '@eslint-react/no-prop-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        UNUSED_VARS_IGNORE_PATTERNS
      ],
      // TODO: Create a tracked issue to move the rule to 'error' after cleaning up existing offenders in economyEngine, gameStateUtils, midiPlayback, logger
      '@typescript-eslint/no-explicit-any': 'warn'
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
