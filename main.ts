// TIDEWATCH entrypoint (Node 22, standard library only).
//
// The game itself is plain static files under game/ — an index.html plus ES
// modules, no library and no network request — and this program is the
// handover: it copies game/ and screenshots/ from beside this file into the
// output directory and writes dossier.json there with the vendored make.fun
// library, exactly the summary the judge reads.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });

const shotsDir = join(repoRoot, 'screenshots');
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps, mirrored here so a local run refuses what the scorer
// would refuse: at most 4 screenshots and none over 256 KiB, at most 993
// files totalling 48 MiB under game/, and no game path over 1000 bytes.
// dossier.json text itself is capped at 163,840 bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
