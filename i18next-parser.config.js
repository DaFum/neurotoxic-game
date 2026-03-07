export default {
  locales: ['en', 'de'],
  defaultNamespace: 'ui',
  lexers: {
    js: ['JsxLexer'], // we're parsing jsx and js files
    jsx: ['JsxLexer'],
    default: ['JsxLexer']
  },
  // the array of files to parse
  input: ['src/**/*.{js,jsx}'],
  // the output path where dictionaries will be stored
  output: 'public/locales/$LOCALE/$NAMESPACE.json',

  // additional settings to match existing application structure
  sort: true, // sort keys alphabetically
  createOldCatalogs: false, // don't create *.old.json files
  keySeparator: '.', // standard separator for nested keys
  namespaceSeparator: ':',
  useKeysAsDefaultValue: false // leave translations blank rather than using the key itself
};
