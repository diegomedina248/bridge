const overrideRules = {
  'no-console': 'error',
  camelcase: ['warn', { allow: ['^UNSAFE'] }],
  // this was colliding with the sub render functions
  // can be set back when it supports regex entries in exceptMethods
  'no-promise-executor-return': 'off',
  'class-methods-use-this': 'off',
  'no-underscore-dangle': ['error', { allow: ['_id'] }],
  'n/no-missing-import': [
    'error',
    {
      allowModules: ['electron', '@jest/globals'],
    },
  ],
  'n/no-unpublished-import': 'off',
  'n/exports-style': ['error', 'exports'],
  'n/file-extension-in-import': ['error', 'always'],
  'n/prefer-global/buffer': ['error', 'always'],
  'n/prefer-global/console': ['error', 'always'],
  'n/prefer-global/process': ['error', 'always'],
  'n/prefer-global/url-search-params': ['error', 'always'],
  'n/prefer-global/url': ['error', 'always'],
  'n/prefer-promises/dns': 'error',
  'n/prefer-promises/fs': 'error',
  'n/no-process-exit': 'off',
  'n/no-extraneous-import': [
    'error',
    {
      allowModules: ['electron'],
    },
  ],
  'import/default': 'error',
  'import/export': 'error',
  'import/named': 'error',
  'import/no-named-as-default': 'off',
  'import/namespace': ['error', { allowComputed: true }],
  // 'import/no-unresolved': ['error', { commonjs: true, amd: true }],
  'import/no-unresolved': 'off',
  'import/order': [
    'error',
    {
      groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
      pathGroups: [
        {
          pattern: '@clutch-creator/**',
          group: 'external',
          position: 'after',
        },
      ],
      pathGroupsExcludedImportTypes: ['builtin'],
      'newlines-between': 'never',
    },
  ],
  'jsx-a11y/click-events-have-key-events': 'warn',
  'jsx-a11y/label-has-associated-control': [
    'error',
    { controlComponents: ['Input', 'LazyInput'] },
  ],
  'jsx-a11y/media-has-caption': 'warn',
  'jsx-a11y/mouse-events-have-key-events': 'warn',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'react/prop-types': 'off',
  'react/no-unstable-nested-components': [
    'error',
    {
      allowAsProps: true,
    },
  ],
  'react/destructuring-assignment': [
    'error',
    'always',
    { ignoreClassFields: true },
  ],
  // removed object prop type from forbidden since it leads to duplicate
  // object structure types declaration which can be hard to maintain in
  // the long term
  'react/forbid-prop-types': [
    'warn',
    {
      forbid: ['any'],
    },
  ],
  'react/require-default-props': 'off',
  'react/jsx-curly-newline': 'off',
  'react/jsx-filename-extension': [
    'warn',
    { extensions: ['.js', '.jsx', '.tsx'] },
  ],
  'react/jsx-props-no-spreading': 'off',
  // fix prettier and airbnb not playing together nicely
  'react/jsx-wrap-multilines': [
    'error',
    { declaration: false, assignment: false },
  ],
  'react/state-in-constructor': 'off',
  'react/static-property-placement': ['error', 'static public field'],
  // React sub renders should go below the main render
  // why? you read code from top to bottom
  'react/sort-comp': [
    'error',
    {
      order: [
        'static-variables',
        'static-methods',
        'lifecycle',
        '/^on.+$/',
        '/^(get|set)(?!(InitialState$|DefaultProps$|ChildContext$)).+$/',
        'everything-else',
        'render',
        '/^render.+$/',
      ],
    },
  ],
  'no-param-reassign': [
    'error',
    {
      props: true,
      ignorePropertyModificationsFor: ['draftState', 'acc'],
      ignorePropertyModificationsForRegex: ['^draft'],
    },
  ],
  'padding-line-between-statements': [
    'warn',
    { blankLine: 'always', prev: '*', next: 'return' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
    {
      blankLine: 'any',
      prev: ['const', 'let', 'var'],
      next: ['const', 'let', 'var'],
    },
  ],
  'no-unused-vars': 'off',
  'no-use-before-define': 'off',
  '@typescript-eslint/no-require-imports': 'error',
  '@typescript-eslint/no-use-before-define': [
    'error',
    { enums: false, typedefs: false, ignoreTypeReferences: true },
  ],
  'no-shadow': 'off',
  '@typescript-eslint/no-shadow': ['error'],
  '@typescript-eslint/no-unused-vars': [
    'error',
    { vars: 'all', args: 'after-used', ignoreRestSiblings: true },
  ],
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-ignore': 'allow-with-description',
      minimumDescriptionLength: 3,
    },
  ],
  'import/extensions': [
    'error',
    'ignorePackages',
    {
      jsx: 'always',
      ts: 'never',
    },
  ],
};

// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:n/recommended',
    'plugin:n/recommended-module',
    'airbnb',
    'prettier',
    'plugin:json/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 7,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      legacyDecorators: true,
    },
  },
  rules: overrideRules,
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.test.js'],
      rules: {
        'n/no-missing-import': 'off',
      },
    },
  ],
};
