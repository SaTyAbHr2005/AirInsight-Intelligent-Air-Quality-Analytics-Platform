import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // JSX member/renamed components (motion.div, icon: Icon) aren't seen as uses without eslint-plugin-react
      'no-unused-vars': ['error', { varsIgnorePattern: '^([A-Z_]|motion$)', argsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // React Three Fiber mutates three.js objects every frame by design
    files: ['src/three/**', 'src/components/ButterflyGauge.jsx'],
    rules: { 'react-hooks/immutability': 'off' },
  },
])
