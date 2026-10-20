import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

let local = {};
try {
  local = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const env = { ...local, ...process.env };
const id = (env.FORMSPREE_FORM_ID || '').trim();
const endpoint = (env.FORMSPREE_ENDPOINT || '').trim() || (id ? `https://formspree.io/f/${id}` : '');
if (!/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(endpoint)) {
  throw new Error('Set FORMSPREE_FORM_ID or FORMSPREE_ENDPOINT to your Formspree form endpoint.');
}
await writeFile(new URL('../assets/js/contact-config.js', import.meta.url),
  `// Generated public configuration. Do not put private keys here.\nwindow.PORTFOLIO_CONFIG = ${JSON.stringify({ formspreeEndpoint: endpoint })};\n`);
console.log('Formspree contact configuration generated.');
