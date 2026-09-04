import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { pureLogicRules } from './tools/eslint-config/constitutional.js';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      // Fixtures que existen para FALLAR a propósito.
      // Los ejecuta tools/verify-rules.mjs con --no-ignore.
      'tools/fixtures/**',
      // Worktrees de git para trabajo en paralelo (ver README): son copias
      // completas del repo, no código propio de esta rama.
      '.worktrees/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,


  // Herramientas y configuración: corren en Node, no en el navegador.
  {
    files: ['**/*.cjs', '**/*.mjs', '**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'writable',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },

  // Capas puras: contracts y la lógica de cada juego (Art. 3.1 – 3.3).
  // El glob lleva ** delante para que aplique igual a los fixtures.
  {
    files: ['**/packages/contracts/src/**/*.ts', '**/packages/games/*/src/logic/**/*.ts'],
    languageOptions: { globals: { window: 'readonly', performance: 'readonly' } },
    rules: pureLogicRules,
  },
);
