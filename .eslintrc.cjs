module.exports = {
  // 1. Keep your custom ignores
  ignorePatterns: ['dist/', 'src/data/songs.js'],

  env: {
    browser: true,
    es2021: true
  },

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    // 2. CRITICAL: 'prettier' must be LAST. 
    // It turns off every rule in the plugins above that conflicts with your formatting.
    'prettier' 
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
    // 3. Your existing custom rules (Perfect, keep them)
    'react/prop-types': 'warn',
    'react/react-in-jsx-scope': 'off', // Essential for React 17+
    'react/jsx-uses-react': 'off',     // Essential for React 17+
    
    // 4. Best Practice Update: 
    // Ensure arguments that start with _ are ignored (e.g. _req, _event)
    'no-unused-vars': ['warn', { 
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_' 
    }]
  },

  settings: {
    react: {
      version: 'detect' // Automatically picks up the React version from package.json
    }
  },

  overrides: [
    {
      files: ['.eslintrc.cjs', 'vite.config.js', '*.config.js'],
      env: {
        node: true
      }
    }
  ]
}
