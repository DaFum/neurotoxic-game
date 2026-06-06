/** @type {import('stylelint').Config} */
export default {
  extends: [
    'stylelint-config-standard',
    '@dreamsicle.io/stylelint-config-tailwindcss' // Erlaubt @theme, @utility, @apply etc. nativ
  ],
  rules: {
    'block-no-empty': true,
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    'no-descending-specificity': null,
    'color-hex-length': null,
    'comment-empty-line-before': null,
    'rule-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'media-feature-range-notation': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'at-rule-empty-line-before': null
    // Tailwind-spezifische Feineinstellungen falls nötig
  }
}
