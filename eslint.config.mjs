import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...tseslint.configs.recommended,
);
