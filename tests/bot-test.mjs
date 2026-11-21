// TIDEWATCH bot smoke test (Node, no browser).
// A careful bot must WIN 5/5; a random bot must LOSE 5/5. Both drive the
// exact same sim the browser plays, through the same public verbs a human
// uses: startGame, clickAt, nextRound, useHint, step.
//
//   node tests/bot-test.mjs
//
// Careful bot: clicks the centre of every known difference (left panel),
// advancing through round-end screens as they come.
// Random bot: clicks random points inside the panels — the way a player
// who never learned to look plays.

import {
  PANEL_LEFT, ROUNDS, newGame, startGame, nextRound, clickAt, step,
} from '../game/src/sim.js';

function careful(g) {
  if (g.phase === 'title') { startGame(g); return; }
  if (g.phase === 'roundEnd') { nextRound(g); return; }
  if (g.phase !== 'play') return;
  const round = ROUNDS[g.round];
  for (const d of round.diffs) {
    if (g.found.includes(d.id)) continue;
    const [dx, dy] = d.pts[0];
    clickAt(g, PANEL_LEFT.x + dx, PANEL_LEFT.y + dy);
    return; // one click per tick, like a human
  }
}

function randomBot(g, bot) {
  if (g.phase === 'title') { startGame(g); return; }
  if (g.phase === 'roundEnd') { nextRound(g); return; }
  if (g.phase !== 'play') return;
  if (g.time - bot.lastAct < 0.4) return;
  bot.lastAct = g.time;
  const panel = Math.random() < 0.5 ? PANEL_LEFT : { x: 656, y: 84, w: 608, h: 652 };
  const x = panel.x + Math.random() * panel.w;
  const y = panel.y + Math.random() * panel.h;
  clickAt(g, x, y);
}

function runOne(botFn, seed) {
  const g = newGame(seed);
  const bot = { lastAct: -1 };
  const dt = 1 / 30;
  let t = 0;
  const maxT = 1200; // sim-seconds cap per run
  while (t < maxT && g.phase !== 'won' && g.phase !== 'lost') {
    botFn(g, bot);
    step(g, dt);
    t += dt;
  }
  return {
    phase: g.phase,
    score: g.score,
    round: g.round + 1,
    found: g.found.length,
    lives: g.lives,
    reason: g.endReason,
    simSeconds: Math.round(t),
  };
}

const carefulSeeds = [1, 2, 3, 4, 5];
const randomSeeds = [11, 12, 13, 14, 15];

let carefulWins = 0;
console.log('--- careful bot (must WIN 5/5) ---');
for (const s of carefulSeeds) {
  const r = runOne(careful, s);
  console.log('seed ' + s + ': ' + r.phase + '  score=' + r.score + ' round=' + r.round + ' found=' + r.found + ' lives=' + r.lives + ' (' + r.simSeconds + 's sim)');
  if (r.phase === 'won') carefulWins++;
}

let randomLosses = 0;
console.log('--- random bot (must LOSE 5/5) ---');
for (const s of randomSeeds) {
  const r = runOne(randomBot, s);
  console.log('seed ' + s + ': ' + r.phase + '  score=' + r.score + ' round=' + r.round + ' found=' + r.found + ' lives=' + r.lives + ' reason=' + r.reason + ' (' + r.simSeconds + 's sim)');
  if (r.phase === 'lost') randomLosses++;
}

console.log('---');
console.log('careful wins: ' + carefulWins + '/5   random loses: ' + randomLosses + '/5');
if (carefulWins === 5 && randomLosses === 5) {
  console.log('BOT TEST: PASS');
  process.exit(0);
} else {
  console.log('BOT TEST: FAIL');
  process.exit(1);
}
