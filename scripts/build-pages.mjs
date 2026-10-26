import { build } from 'vite';
import { writeFile } from 'node:fs/promises';

await build({ build: { outDir: 'docs', emptyOutDir: true } });
await writeFile('docs/.nojekyll', '');
console.log('GitHub Pages output: docs/ (publish main branch, /docs folder).');
