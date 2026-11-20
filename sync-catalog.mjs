import { readFileSync, writeFileSync } from 'node:fs';

// A classic script lets the static app open from file:// as well as HTTP.
const directory = new URL('./app/data/', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('trophies.json', directory), 'utf8'));
const head = { ...catalog, trophies: undefined };
const rows = catalog.trophies.map(entry => `    ${JSON.stringify(entry)}`).join(',\n');
const wrapped = `${JSON.stringify(head, null, 2).slice(0, -2)},\n  "trophies": [\n${rows}\n  ]\n}`;
const script = `// Generated from trophies.json by sync-catalog.mjs.\nconst ledgerCatalog = ${wrapped};\n`;
writeFileSync(new URL('catalog.js', directory), script);
