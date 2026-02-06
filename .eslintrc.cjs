module.exports = {
  ignorePatterns: ['dist/', 'src/data/songs.js'],
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: ['react'],
  rules: {
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'no-unused-vars': ['warn', { varsIgnorePattern: '^_' }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}
