module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Allow Tailwind/PostCSS specific at-rules like @tailwind, @apply, @layer, etc.
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen', 'layer', 'component', 'utilities', 'screen']
    }],
    // Allow global pseudo-class sometimes used in CSS-in-JS / Tailwind plugins
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['global']
    }]
  },
  ignoreFiles: ['**/node_modules/**', 'public/**']
};
