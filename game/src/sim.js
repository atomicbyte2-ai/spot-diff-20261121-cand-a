// TIDEWATCH — The Lighthouse Keeper's Eye. Pure game logic (no DOM, no
// browser APIs), so the same module drives the browser game and the Node
// bot smoke test. One seeded renderer draws both panels; the right panel
// is the base scene plus the round's differences applied.
//
// Layout (canvas 1280x800):
//   top HUD bar y 0..64, panels y 84..736 (608x652 each), bottom bar y 744..800.
//   left panel  x 16..624  ("ORIGINAL"), right panel x 656..1264 ("CHANGED?").

export const W = 1280;
export const H = 800;
export const PANEL = { w: 608, h: 652, y: 84 };
export const PANEL_LEFT = { x: 16, y: 84, w: 608, h: 652 };
export const PANEL_RIGHT = { x: 656, y: 84, w: 608, h: 652 };
export const ROUND_TIME = 90;
export const DIFFS_PER_ROUND = 7;
export const MAX_LIVES = 3;

// A difference: one or more hit points in panel-local coordinates.
// `pts` holds the left-panel point first, then any extra point (e.g. a
// moved buoy also counts at its new spot on the right panel).
export const ROUNDS = [
  {
    name: 'ROUND 1 — DUSK',
    sub: 'The storm is coming. Spot 7 changes before dark.',
    skyTop: '#241a4e', skyMid: '#6b3a6e', skyLow: '#e8734a',
    sea: '#1b2a52', seaDeep: '#101d3d', starCount: 26, rain: false,
    sun: null, moon: true, lightning: false,
    diffs: [
      { id: 'light', label: 'Lighthouse light OUT', pts: [[300, 168]], r: 34 },
      { id: 'gull', label: 'An extra gull', pts: [[470, 120]], r: 26 },
      { id: 'sail', label: 'Sail changed colour', pts: [[110, 430]], r: 34 },
      { id: 'rowboat', label: 'Rowboat MISSING', pts: [[470, 520]], r: 30 },
      { id: 'window', label: 'A window lit up', pts: [[95, 355]], r: 24 },
      { id: 'buoy', label: 'Buoy changed colour', pts: [[200, 560]], r: 26 },
      { id: 'flag', label: 'Flag changed colour', pts: [[360, 136]], r: 24 },
    ],
  },
  {
    name: 'ROUND 2 — STORM',
    sub: 'Rain lashes the harbor. The light must not fail.',
    skyTop: '#0a1224', skyMid: '#233349', skyLow: '#4a5a74',
    sea: '#12233a', seaDeep: '#0a1626', starCount: 4, rain: true,
    sun: null, moon: true, lightning: false,
    diffs: [
      { id: 'moon', label: 'The moon is GONE', pts: [[90, 90]], r: 30 },
      { id: 'bolt', label: 'Lightning struck', pts: [[520, 200]], r: 34 },
      { id: 'lampwin', label: 'Tower window dark', pts: [[304, 300]], r: 24 },
      { id: 'sail', label: 'Sail torn', pts: [[110, 430]], r: 34 },
      { id: 'barrel', label: 'An extra barrel', pts: [[560, 415]], r: 26 },
      { id: 'gull', label: 'A gull vanished', pts: [[150, 150]], r: 26 },
      { id: 'smoke', label: 'Chimney smoke gone', pts: [[60, 318]], r: 26 },
    ],
  },
  {
    name: 'ROUND 3 — DAWN',
    sub: 'First light. One last look before the harbor wakes.',
    skyTop: '#3d2b5c', skyMid: '#a55a7a', skyLow: '#ffb36b',
    sea: '#274b6b', seaDeep: '#16324a', starCount: 8, rain: false,
    sun: { x: 500, y: 110, r: 30 }, moon: false, lightning: false,
    diffs: [
      { id: 'sun', label: 'The sun rose early', pts: [[500, 110]], r: 30 },
      { id: 'boat2', label: 'A second sailboat', pts: [[430, 480]], r: 34 },
      { id: 'flag', label: 'Flag MISSING', pts: [[360, 136]], r: 24 },
      { id: 'buoy', label: 'Buoy drifted away', pts: [[200, 560], [262, 582]], r: 26 },
      { id: 'light', label: 'Light still ON at dawn', pts: [[300, 168]], r: 34 },
      { id: 'gull', label: 'An extra gull', pts: [[470, 120]], r: 26 },
      { id: 'window', label: 'A window went dark', pts: [[130, 355]], r: 24 },
    ],
  },
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Decorative scatter (stars, gulls, clouds) — seeded per round so both
// panels always agree on the base scene.
export function scatter(seed, count, x0, y0, x1, y1) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ x: x0 + rnd() * (x1 - x0), y: y0 + rnd() * (y1 - y0), s: 0.5 + rnd() });
  }
  return out;
}

export function newGame(seed = 1) {
  return {
    seed,
    phase: 'title', // title | play | roundEnd | won | lost | paused
    phaseFrom: 'title',
    round: 0,
    found: [],
    lives: MAX_LIVES,
    score: 0,
    combo: 0,
    bestCombo: 0,
    timeLeft: ROUND_TIME,
    muted: false,
    hintId: null,
    hintT: 0,
    floats: [], // {x, y, text, color, t}
    lastFind: null, // {label, points}
    endReason: '',
    roundBonus: 0,
    time: 0,
  };
}

export function roundDef(g) {
  return ROUNDS[g.round];
}

export function diffsOf(g) {
  return ROUNDS[g.round].diffs;
}

export function startGame(g) {
  g.phase = 'play';
  g.round = 0;
  g.found = [];
  g.lives = MAX_LIVES;
  g.score = 0;
  g.combo = 0;
  g.bestCombo = 0;
  g.timeLeft = ROUND_TIME;
  g.hintId = null;
  g.hintT = 0;
  g.floats = [];
  g.lastFind = null;
  g.endReason = '';
  g.roundBonus = 0;
}

export function nextRound(g) {
  if (g.phase !== 'roundEnd') return;
  if (g.round >= ROUNDS.length - 1) {
    g.phase = 'won';
    return;
  }
  g.round += 1;
  g.found = [];
  g.timeLeft = ROUND_TIME;
  g.hintId = null;
  g.hintT = 0;
  g.floats = [];
  g.phase = 'play';
}

export function restartRound(g) {
  g.found = [];
  g.lives = MAX_LIVES;
  g.combo = 0;
  g.timeLeft = ROUND_TIME;
  g.hintId = null;
  g.hintT = 0;
  g.floats = [];
  g.phase = 'play';
}

export function togglePause(g) {
  if (g.phase === 'play') { g.phaseFrom = 'play'; g.phase = 'paused'; }
  else if (g.phase === 'paused') g.phase = 'play';
}

export function toggleMute(g) {
  g.muted = !g.muted;
  return g.muted;
}

// Map a canvas click to a panel-local point, or null when outside panels.
export function panelPoint(x, y) {
  for (const p of [PANEL_LEFT, PANEL_RIGHT]) {
    if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) {
      return { panel: p === PANEL_LEFT ? 'left' : 'right', lx: x - p.x, ly: y - p.y, px: p.x, py: p.y };
    }
  }
  return null;
}

export function clickAt(g, x, y) {
  if (g.phase !== 'play') return { ok: false, why: 'not-playing' };
  const pp = panelPoint(x, y);
  if (!pp) return { ok: false, why: 'outside' };
  const diffs = diffsOf(g);
  for (const d of diffs) {
    if (g.found.includes(d.id)) continue;
    for (const [dx, dy] of d.pts) {
      const dist = Math.hypot(pp.lx - dx, pp.ly - dy);
      if (dist <= d.r) {
        g.found.push(d.id);
        g.combo += 1;
        if (g.combo > g.bestCombo) g.bestCombo = g.combo;
        const mult = 1 + Math.min(g.combo - 1, 4) * 0.5;
        const pts = Math.round(100 * mult);
        g.score += pts;
        g.lastFind = { label: d.label, points: pts, combo: g.combo };
        g.floats.push({ x: pp.lx + pp.px, y: pp.ly + pp.py - 30, text: '+' + pts, color: '#ffd76a', t: 0 });
        g.floats.push({ x: pp.lx + pp.px, y: pp.ly + pp.py + 34, text: 'FOUND!', color: '#7dff9e', t: 0 });
        if (g.found.length >= DIFFS_PER_ROUND) {
          g.roundBonus = Math.round(g.timeLeft) * 10 + g.lives * 50;
          g.score += g.roundBonus;
          g.phase = 'roundEnd';
        }
        return { ok: true, found: d.id, points: pts, combo: g.combo };
      }
    }
  }
  // Wrong click: lose a life, break the combo.
  g.lives -= 1;
  g.combo = 0;
  g.floats.push({ x, y: y - 24, text: 'NOT THERE', color: '#ff7a6b', t: 0 });
  if (g.lives <= 0) {
    g.phase = 'lost';
    g.endReason = 'lives';
  }
  return { ok: false, why: 'miss', lives: g.lives };
}

export function useHint(g) {
  if (g.phase !== 'play') return null;
  const remaining = diffsOf(g).filter((d) => !g.found.includes(d.id));
  if (!remaining.length) return null;
  const d = remaining[Math.floor(mulberry32(g.seed * 7919 + g.round * 131 + g.found.length)() * remaining.length)];
  g.hintId = d.id;
  g.hintT = 1.6;
  g.score = Math.max(0, g.score - 50);
  return d;
}

export function step(g, dt) {
  g.time += dt;
  for (const f of g.floats) f.t += dt;
  g.floats = g.floats.filter((f) => f.t < 1.4);
  if (g.hintT > 0) {
    g.hintT -= dt;
    if (g.hintT <= 0) g.hintId = null;
  }
  if (g.phase !== 'play') return;
  g.timeLeft -= dt;
  if (g.timeLeft <= 0) {
    g.timeLeft = 0;
    g.phase = 'lost';
    g.endReason = 'time';
  }
}

export function foundCount(g) {
  return g.found.length;
}

export function isFound(g, id) {
  return g.found.includes(id);
}
