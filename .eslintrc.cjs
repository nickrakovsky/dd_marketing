module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:astro/recommended',
    'plugin:astro/jsx-a11y-recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-restricted-syntax': [
      'error',
      {
        selector: "JSXAttribute[name.name='href'] > Literal[value=/^\\/.*\\/$/]",
        message: 'Internal links should not have trailing slashes (e.g., use /posts/slug instead of /posts/slug/).',
      },
      {
        selector: "JSXAttribute[name.name='href'] > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.cooked=/^\\/.*\\/$/]",
        message: 'Internal links in template literals should not have trailing slashes.',
      }
    ],
  },
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
      rules: {
        // Astro-specific rules
      },
    },
    {
      files: ['*.jsx', '*.tsx'],
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
      ],
      plugins: ['react'],
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'react/no-unescaped-entities': 'off',
        'react-hooks/set-state-in-effect': 'warn',
      },
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
    }
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
