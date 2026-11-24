#!/usr/bin/env node
// Build dist/page.html: one self-contained page (CSS and JS inlined, nothing loaded from anywhere).
//   node scripts/build.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'dist', 'page.html');

// The browser gets the modules as plain declarations: drop import lines and `export` keywords.
export function stripModule(src) {
  return src
    .split('\n')
    .filter((line) => !/^\s*import\s/.test(line))
    .join('\n')
    .replace(/^export\s+(const|function|let|class)\s/gm, '$1 ');
}

export async function build() {
  const read = (p) => readFileSync(join(ROOT, p), 'utf8');
  const { COPY } = await import(pathToFileURL(join(ROOT, 'src', 'config.mjs')).href);
  const js = [stripModule(read('src/config.mjs')), stripModule(read('src/forecast.mjs')), read('src/app.js')].join('\n');
  if (js.includes('</script')) throw new Error('script would close its own tag');
  const html = read('src/page.html')
    .replace('__TITLE__', COPY.title)
    .replace('/*__CSS__*/', () => read('src/styles.css'))
    .replace('/*__JS__*/', () => js);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, html);
  return html;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await build();
  console.log(`built ${OUT}`);
}
