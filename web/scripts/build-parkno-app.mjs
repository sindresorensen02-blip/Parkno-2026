import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sources = [
  'kit/ios-frame.jsx',
  'kit/Icon.jsx',
  'kit/Primitives.jsx',
  'kit/ParkingCard.jsx',
  'kit/BottomNav.jsx',
  'kit/Screens.jsx',
  'kit/App.jsx',
];

const tempDir = join(tmpdir(), 'parkno-build');
const entry = join(tempDir, 'parkno-app.jsx');
mkdirSync(tempDir, { recursive: true });

const source = sources
  .map((file) => readFileSync(join(root, file), 'utf8'))
  .join('\n\n');

writeFileSync(entry, source, 'utf8');

const command = [
  'npx --yes esbuild',
  JSON.stringify(entry),
  '--bundle',
  '--format=iife',
  '--jsx-factory=React.createElement',
  '--jsx-fragment=React.Fragment',
  '--target=es2018',
  '--charset=utf8',
  '--outfile=assets/parkno-app.js',
  '--minify',
].join(' ');

execSync(command, { cwd: root, stdio: 'inherit' });

rmSync(tempDir, { recursive: true, force: true });
