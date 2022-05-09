module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-sass-guidelines'],
  rules: {
    'selector-max-id': 1,
    'max-nesting-depth': [
      5,
      {
        ignoreAtRules: ['each', 'media', 'supports', 'include'],
      },
    ],
    'selector-max-compound-selectors': 5,
    'selector-class-pattern': false,
    'no-descending-specificity': false,
    'custom-property-no-missing-var-function': false,
  },
}
