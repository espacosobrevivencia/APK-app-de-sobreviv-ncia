import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const www = path.join(root, 'www');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

for (const name of ['manifest.json', 'icone.png']) {
  fs.copyFileSync(path.join(root, name), path.join(www, name));
}

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Injeta a ponte Capacitor/Android antes do primeiro script inline do app.
// A versão anterior procurava APP_VERSION logo após <script>, mas o index
// possui "use strict" antes dessa constante, então a injeção não acontecia.
const inlineScriptTag = '<script>';
const nativeBridgeTag = '<script src="./native-bridge.js"></script>\n<script>';

if (!html.includes('native-bridge.js')) {
  const pos = html.indexOf(inlineScriptTag);

  if (pos === -1) {
    throw new Error('Não foi encontrado o script principal no index.html.');
  }

  html =
    html.slice(0, pos) +
    nativeBridgeTag +
    html.slice(pos + inlineScriptTag.length);
}

if (!html.includes('<script src="./native-bridge.js"></script>')) {
  throw new Error('Falha ao injetar native-bridge.js no index.html.');
}

fs.writeFileSync(path.join(www, 'index.html'), html);

await build({
  entryPoints: [path.join(root, 'native-entry.js')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome100'],
  outfile: path.join(www, 'native-bridge.js'),
  minify: true
});

if (!fs.existsSync(path.join(www, 'native-bridge.js'))) {
  throw new Error('native-bridge.js não foi gerado.');
}

console.log('www preparado com ponte nativa');
