export default {
  locales: ['en', 'de'],
  defaultNamespace: 'ui',
  ns: [
    'ui',
    'items',
    'venues',
    'events',
    'economy',
    'chatter',
    'minigame',
    'unlocks'
  ],

  // files to parse (include TypeScript)
  input: ['src/**/*.{js,jsx,ts,tsx}'],

  // skip common noise
  ignore: [
    '**/node_modules/**',
    'src/**/*.spec.{js,jsx,ts,tsx}',
    'src/**/*.stories.{js,jsx,ts,tsx}'
  ],

  // output
  output: 'public/locales/$LOCALE/$NAMESPACE.json',
  indentation: 2,           // readable JSON formatting
  sort: true,               // sort keys alphabetically
  createOldCatalogs: false,
  keepRemoved: true,
  keySeparator: ".",
  namespaceSeparator: ':',
  useKeysAsDefaultValue: false,
  defaultValue: '',         // make new keys explicit empty strings

  // parse function/component names
  func: ['i18next.t', 'i18n.t', 't', 'translate', 'formatMessage'],
  // If your code uses <Trans> component with custom prop name, we can configure `trans` too.

  // lexers
  lexers: {
    js: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    tsx: ['JsxLexer'],
    default: ['JavascriptLexer']
  },

  // extra
  verbose: true
};