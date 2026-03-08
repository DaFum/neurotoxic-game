export default {
  locales: ['en', 'de'],
  defaultNamespace: 'ui',
  lexers: {
    js: ['JavascriptLexer'],
    ts: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
    tsx: ['JsxLexer'],
    default: ['JavascriptLexer']
  },
  // the array of files to parse (include TypeScript)
  input: ['src/**/*.{js,jsx,ts,tsx}'],
  // the output path where dictionaries will be stored
  output: 'public/locales/$LOCALE/$NAMESPACE.json',

  // additional settings to match existing application structure
  sort: true,
  createOldCatalogs: false,
  keepRemoved: true,
  keySeparator: false,
  namespaceSeparator: ':',
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
  useKeysAsDefaultValue: false,
  pluralSeparator: false
}
