import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('./', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const shots = JSON.parse(readFileSync(join(root, 'shots.json'), 'utf8'));

function packageLedger() {
  const captures = join(root, 'screenshots');
  const expected = shots.map((shot: { file: string }) => shot.file).sort();
  if (expected.length !== 4 || JSON.stringify(readdirSync(captures).sort()) !== JSON.stringify(expected)) {
    throw Error('Expected the four ledger screenshots listed in shots.json');
  }
  mkdirSync(output, { recursive: true });
  for (const folder of ['app', 'screenshots']) {
    cpSync(join(root, folder), join(output, folder), { recursive: true });
  }
  const dossier = buildDossier(output, {
    text_max_bytes: 160 * 1024,
    screenshots: { max: 4, max_bytes: 256 * 1024 },
    app_max_files: 993,
    app_max_bytes: 48 * 1024 * 1024,
  });
  writeFileSync(join(output, 'dossier.json'), dossier);
}

packageLedger();
