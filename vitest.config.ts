import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      // Worktrees de git para trabajo en paralelo (ver README): son copias
      // completas del repo, no código propio de esta rama.
      '.worktrees/**',
    ],
  },
});
