// TIDEWATCH renderer — draws everything on one canvas. A single scene
// function draws a panel; the left panel gets no differences, the right
// panel gets the round's differences applied, so every difference is real
// and findable. Palette: dark night-blue + warm gold.

import {
  W, H, PANEL_LEFT, PANEL_RIGHT, ROUNDS, scatter,
} from './sim.js';

const GOLD = '#ffd76a';
const GOLD_DIM = '#c9a13b';
const INK = '#0a1424';
const CREAM = '#f4ead2';
const RED = '#e4574a';
const TEAL = '#3fb8a6';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function gull(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y);
  ctx.quadraticCurveTo(x - 3 * s, y - 6 * s, x, y);
  ctx.quadraticCurveTo(x + 3 * s, y - 6 * s, x + 9 * s, y);
  ctx.stroke();
}

// Draw one harbor scene inside panel rect (px,py,pw,ph). `diffs` is a Set
// of difference ids applied to THIS panel (empty for the left panel).
export function drawScene(ctx, px, py, pw, ph, round, diffs) {
  const S = pw / 608; // scale: scene designed at 608x652
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.translate(px, py);
  ctx.scale(S, S);

  const sky = ctx.createLinearGradient(0, 0, 0, 380);
  sky.addColorStop(0, round.skyTop);
  sky.addColorStop(0.55, round.skyMid);
  sky.addColorStop(1, round.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 608, 380);

  // Stars (seeded, same both panels).
  const stars = scatter(round.seedStar, round.starCount, 10, 8, 598, 240);
  ctx.fillStyle = '#fff6d8';
  for (const st of stars) {
    ctx.globalAlpha = 0.35 + 0.65 * st.s;
    ctx.beginPath();
    ctx.arc(st.x, st.y, 1.1 * st.s + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon (round 2: missing on the right panel).
  if (round.moon && !diffs.has('moon')) {
    ctx.fillStyle = '#fdf3c9';
    ctx.beginPath();
    ctx.arc(90, 90, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d9a0';
    ctx.beginPath();
    ctx.arc(82, 84, 6, 0, Math.PI * 2);
    ctx.arc(98, 98, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sun (round 3: only on the right panel).
  if (round.sun && diffs.has('sun')) {
    ctx.fillStyle = '#ffdf8a';
    ctx.beginPath();
    ctx.arc(500, 110, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffdf8a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(500 + Math.cos(a) * 38, 110 + Math.sin(a) * 38);
      ctx.lineTo(500 + Math.cos(a) * 50, 110 + Math.sin(a) * 50);
      ctx.stroke();
    }
  }

  // Lightning (round 2: only on the right panel).
  if (diffs.has('bolt')) {
    ctx.strokeStyle = '#ffe98a';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(520, 120);
    ctx.lineTo(505, 170);
    ctx.lineTo(522, 175);
    ctx.lineTo(500, 235);
    ctx.lineTo(516, 240);
    ctx.lineTo(498, 290);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,233,138,0.35)';
    ctx.lineWidth = 12;
    ctx.stroke();
  }

  // Clouds.
  const clouds = scatter(round.seedCloud, 3, 30, 40, 560, 200);
  ctx.fillStyle = 'rgba(244,234,210,0.16)';
  for (const c of clouds) {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 70 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
    ctx.ellipse(c.x + 30 * c.s, c.y - 8, 44 * c.s, 12 * c.s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Harbor houses on the left shore.
  const houses = [
    { x: 18, y: 330, w: 64, h: 52, win: [95, 355], smoke: [60, 318] },
    { x: 92, y: 322, w: 56, h: 60, win: [130, 355], smoke: null },
    { x: 158, y: 334, w: 48, h: 48, win: null, smoke: null },
  ];
  for (const hs of houses) {
    ctx.fillStyle = '#1d2438';
    ctx.fillRect(hs.x, hs.y, hs.w, hs.h);
    ctx.fillStyle = '#2c3550';
    ctx.beginPath();
    ctx.moveTo(hs.x - 4, hs.y);
    ctx.lineTo(hs.x + hs.w / 2, hs.y - 20);
    ctx.lineTo(hs.x + hs.w + 4, hs.y);
    ctx.closePath();
    ctx.fill();
  }
  // Chimney smoke (round 2: gone on the right panel).
  if (!(round.name.includes('STORM') && diffs.has('smoke'))) {
    ctx.fillStyle = 'rgba(220,220,220,0.35)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(60 + i * 6, 318 - i * 12, 7 + i * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Windows: lit gold or dark. Round 1: window at (95,355) lights up on
  // the right. Round 3: window at (130,355) goes dark on the right.
  const lit95 = diffs.has('window') && round.name.includes('DUSK');
  const dark130 = diffs.has('window') && round.name.includes('DAWN');
  ctx.fillStyle = lit95 ? '#ffd76a' : '#0e1526';
  ctx.fillRect(88, 348, 14, 14);
  ctx.fillStyle = dark130 ? '#0e1526' : '#ffd76a';
  ctx.fillRect(123, 348, 14, 14);
  ctx.fillStyle = '#0e1526';
  ctx.fillRect(168, 352, 12, 12);

  // Sea.
  const sea = ctx.createLinearGradient(0, 380, 0, 652);
  sea.addColorStop(0, round.sea);
  sea.addColorStop(1, round.seaDeep);
  ctx.fillStyle = sea;
  ctx.fillRect(0, 380, 608, 272);
  // Moon/sun glitter on the water.
  ctx.fillStyle = 'rgba(253,243,201,0.18)';
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(78 + i * 4, 392 + i * 26, 26 - i * 2, 3);
  }
  // Wave lines.
  ctx.strokeStyle = 'rgba(244,234,210,0.20)';
  ctx.lineWidth = 2;
  const waves = scatter(round.seedWave, 9, 10, 400, 598, 640);
  for (const wv of waves) {
    ctx.beginPath();
    ctx.moveTo(wv.x - 22 * wv.s, wv.y);
    ctx.quadraticCurveTo(wv.x, wv.y - 5, wv.x + 22 * wv.s, wv.y);
    ctx.stroke();
  }
  // Rain (round 2).
  if (round.rain) {
    ctx.strokeStyle = 'rgba(180,200,230,0.35)';
    ctx.lineWidth = 1.5;
    const rain = scatter(round.seedRain, 40, 0, 0, 608, 652);
    for (const r of rain) {
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 6, r.y + 16);
      ctx.stroke();
    }
  }

  // Pier on the right edge with crates + barrel.
  ctx.fillStyle = '#4a3520';
  ctx.fillRect(512, 420, 96, 12);
  ctx.fillStyle = '#3a2a18';
  for (const px2 of [524, 556, 588]) ctx.fillRect(px2, 432, 8, 34);
  ctx.fillStyle = '#6b4a26';
  ctx.fillRect(522, 396, 24, 24);
  ctx.fillRect(548, 402, 20, 18);
  if (diffs.has('barrel')) {
    ctx.fillStyle = '#8a5a2a';
    ctx.beginPath();
    ctx.ellipse(560, 408, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a3a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(549, 404);
    ctx.lineTo(571, 404);
    ctx.moveTo(549, 412);
    ctx.lineTo(571, 412);
    ctx.stroke();
  }

  // Rocky point + lighthouse (the giant central subject).
  ctx.fillStyle = '#232c42';
  ctx.beginPath();
  ctx.moveTo(210, 652);
  ctx.lineTo(240, 520);
  ctx.lineTo(280, 470);
  ctx.lineTo(330, 470);
  ctx.lineTo(370, 520);
  ctx.lineTo(400, 652);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2e3a56';
  ctx.beginPath();
  ctx.moveTo(250, 540);
  ctx.lineTo(268, 500);
  ctx.lineTo(300, 486);
  ctx.lineTo(330, 500);
  ctx.lineTo(352, 540);
  ctx.closePath();
  ctx.fill();

  // Tower: striped, with gallery + lamp room.
  ctx.fillStyle = '#f4ead2';
  ctx.fillRect(272, 190, 64, 300);
  ctx.fillStyle = '#c9403a';
  ctx.fillRect(272, 240, 64, 34);
  ctx.fillRect(272, 330, 64, 34);
  ctx.fillRect(272, 420, 64, 34);
  ctx.fillStyle = '#1d2438';
  ctx.fillRect(262, 176, 84, 16); // gallery floor
  ctx.fillRect(278, 148, 52, 30); // lamp room
  // Lamp-room window dark in round 2 (tower window diff).
  const lampDark = diffs.has('lampwin');
  ctx.fillStyle = lampDark ? '#0e1526' : '#ffe98a';
  ctx.fillRect(284, 152, 40, 22);
  ctx.fillStyle = '#1d2438';
  ctx.beginPath();
  ctx.moveTo(278, 148);
  ctx.lineTo(304, 132);
  ctx.lineTo(330, 148);
  ctx.closePath();
  ctx.fill();
  // Flag on top: red base; white on right in round 1, missing in round 3.
  const flagGone = diffs.has('flag') && round.name.includes('DAWN');
  const flagWhite = diffs.has('flag') && round.name.includes('DUSK');
  ctx.strokeStyle = '#1d2438';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(304, 132);
  ctx.lineTo(304, 104);
  ctx.stroke();
  if (!flagGone) {
    ctx.fillStyle = flagWhite ? '#f4ead2' : '#c9403a';
    ctx.beginPath();
    ctx.moveTo(304, 104);
    ctx.lineTo(348, 112);
    ctx.lineTo(304, 122);
    ctx.closePath();
    ctx.fill();
  }
  // Tower door + small window.
  ctx.fillStyle = '#1d2438';
  ctx.fillRect(296, 452, 16, 38);
  ctx.fillStyle = lampDark ? '#0e1526' : '#ffd76a';
  ctx.fillRect(296, 300, 16, 18);

  // Light beam: ON in base. Round 1: OFF on the right. Round 3: still ON
  // on the right at dawn (base dawn scene has it off).
  const beamOn = round.name.includes('DAWN') ? diffs.has('light') : !diffs.has('light');
  if (beamOn) {
    const beam = ctx.createLinearGradient(304, 163, 130, 163);
    beam.addColorStop(0, 'rgba(255,233,138,0.75)');
    beam.addColorStop(1, 'rgba(255,233,138,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(284, 152);
    ctx.lineTo(130, 118);
    ctx.lineTo(130, 198);
    ctx.lineTo(284, 174);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(304, 163, 10, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#8a8a7a';
    ctx.beginPath();
    ctx.arc(304, 163, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sailboat (left side of the water).
  const sailTorn = diffs.has('sail') && round.name.includes('STORM');
  const sailTeal = diffs.has('sail') && round.name.includes('DUSK');
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.moveTo(70, 470);
  ctx.lineTo(150, 470);
  ctx.lineTo(140, 486);
  ctx.lineTo(80, 486);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(110, 470);
  ctx.lineTo(110, 392);
  ctx.stroke();
  ctx.fillStyle = sailTeal ? TEAL : '#f4ead2';
  ctx.beginPath();
  if (sailTorn) {
    ctx.moveTo(110, 396);
    ctx.lineTo(150, 466);
    ctx.lineTo(128, 448);
    ctx.lineTo(138, 466);
    ctx.lineTo(110, 466);
    ctx.closePath();
  } else {
    ctx.moveTo(110, 396);
    ctx.lineTo(150, 466);
    ctx.lineTo(110, 466);
    ctx.closePath();
  }
  ctx.fill();

  // Second sailboat (round 3: only on the right panel).
  if (diffs.has('boat2')) {
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.moveTo(400, 500);
    ctx.lineTo(460, 500);
    ctx.lineTo(452, 512);
    ctx.lineTo(408, 512);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3a2a18';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(430, 500);
    ctx.lineTo(430, 442);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(430, 444);
    ctx.lineTo(462, 498);
    ctx.lineTo(430, 498);
    ctx.closePath();
    ctx.fill();
  }

  // Rowboat (round 1: missing on the right panel).
  if (!diffs.has('rowboat')) {
    ctx.fillStyle = '#7a4a26';
    ctx.beginPath();
    ctx.ellipse(470, 520, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(458, 512, 24, 4);
  }

  // Buoy: red base; yellow on right in round 1; drifted in round 3.
  const buoyX = diffs.has('buoy') && round.name.includes('DAWN') ? 262 : 200;
  const buoyY = diffs.has('buoy') && round.name.includes('DAWN') ? 582 : 560;
  const buoyYellow = diffs.has('buoy') && round.name.includes('DUSK');
  ctx.fillStyle = buoyYellow ? '#f2c230' : '#c9403a';
  ctx.beginPath();
  ctx.moveTo(buoyX, buoyY - 14);
  ctx.lineTo(buoyX + 12, buoyY + 6);
  ctx.lineTo(buoyX - 12, buoyY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f4ead2';
  ctx.fillRect(buoyX - 3, buoyY - 24, 6, 12);

  // Gulls: seeded base flock kept low and left, clear of the diff points
  // (extra gull at 470,120; vanishing gull at 150,150).
  const baseGulls = scatter(round.seedGull, 4, 60, 200, 400, 270);
  ctx.fillStyle = '#f4ead2';
  for (const gl of baseGulls) gull(ctx, gl.x, gl.y, gl.s, '#f4ead2');
  // Round 1 & 3: extra gull at (470,120) on the right.
  if (diffs.has('gull') && !round.name.includes('STORM')) gull(ctx, 470, 120, 1.1, '#ffd76a');
  // Round 2: the gull at (150,150) vanishes on the right — draw it gold
  // on the left panel only, i.e. when the diff is NOT applied.
  if (round.name.includes('STORM') && !diffs.has('gull')) gull(ctx, 150, 150, 1.0, '#f4ead2');

  // Hint pulse: a gold ring around the hinted difference.
  if (round.hintId) {
    const d = round.diffs.find((x) => x.id === round.hintId);
    if (d) {
      const [hx, hy] = d.pts[0];
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(hx, hy, d.r + 8 + 4 * Math.sin(round.hintPulse || 0), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Found markers: gold rings + check on the found differences.
  for (const id of round.foundIds || []) {
    const d = round.diffs.find((x) => x.id === id);
    if (!d) continue;
    for (const [fx, fy] of d.pts) {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(fx, fy, d.r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#7dff9e';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fx - 10, fy);
      ctx.lineTo(fx - 2, fy + 9);
      ctx.lineTo(fx + 12, fy - 9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function bar(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
}

function text(ctx, s, x, y, size, color, weight = 700, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function heart(ctx, cx, cy, s, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.2, cy, cx - s * 0.7, cy - s, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s, cx + s * 1.2, cy, cx, cy + s * 0.9);
  ctx.closePath();
  ctx.fill();
}

export function drawHUD(ctx, g) {
  const round = ROUNDS[g.round];
  // Top bar.
  ctx.fillStyle = '#0a1424';
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = GOLD_DIM;
  ctx.fillRect(0, 64, W, 3);
  text(ctx, 'TIDEWATCH', 20, 22, 26, GOLD, 800);
  text(ctx, round.name, 20, 48, 14, CREAM, 600);
  const mm = Math.floor(Math.max(0, g.timeLeft) / 60);
  const ss = Math.floor(Math.max(0, g.timeLeft) % 60);
  const timeStr = `${mm}:${String(ss).padStart(2, '0')}`;
  const timeColor = g.timeLeft <= 15 ? '#ff7a6b' : CREAM;
  text(ctx, '⏱ ' + timeStr, 640, 26, 26, timeColor, 800, 'center');
  text(ctx, round.sub, 640, 52, 12, '#8a94a8', 600, 'center');
  text(ctx, 'SCORE ' + g.score, 900, 22, 20, CREAM, 800);
  text(ctx, 'COMBO ×' + (1 + Math.min(Math.max(g.combo - 1, 0), 4) * 0.5).toFixed(1), 900, 48, 14, g.combo >= 2 ? GOLD : '#8a94a8', 700);
  // Lives as hearts.
  for (let i = 0; i < 3; i++) {
    heart(ctx, 1080 + i * 32, 26, 11, i < g.lives ? '#ff5a6b' : '#33405c');
  }
  text(ctx, 'LIVES', 1112, 52, 11, '#8a94a8', 600, 'center');
  // Found counter — the big one.
  const found = g.found.length;
  bar(ctx, 1160, 10, 104, 44, found >= 7 ? '#1d5c33' : '#16233d');
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1160, 10, 104, 44, 8);
  ctx.stroke();
  text(ctx, `FOUND ${found}/7`, 1212, 32, 20, GOLD, 800, 'center');

  // Panel labels.
  bar(ctx, PANEL_LEFT.x, 68, 130, 22, '#16233d');
  text(ctx, '◉ ORIGINAL', PANEL_LEFT.x + 10, 79, 13, CREAM, 700);
  bar(ctx, PANEL_RIGHT.x, 68, 130, 22, '#16233d');
  text(ctx, '◉ CHANGED?', PANEL_RIGHT.x + 10, 79, 13, GOLD, 700);

  // Panel frames.
  for (const p of [PANEL_LEFT, PANEL_RIGHT]) {
    ctx.strokeStyle = '#33405c';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x - 1, p.y - 1, p.w + 2, p.h + 2);
  }

  // Bottom bar.
  ctx.fillStyle = '#0a1424';
  ctx.fillRect(0, 744, W, 56);
  ctx.fillStyle = GOLD_DIM;
  ctx.fillRect(0, 744, W, 2);
  text(ctx, 'CLICK a difference to mark it  ·  H hint (−50)  ·  R restart round  ·  M mute  ·  ESC pause', 20, 772, 15, CREAM, 600);
  // Round dots.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < g.round ? '#7dff9e' : i === g.round ? GOLD : '#33405c';
    ctx.beginPath();
    ctx.arc(1180 + i * 26, 772, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'ROUND ' + (g.round + 1) + '/3', 1120, 772, 13, '#8a94a8', 600, 'right');
}

// Floating score text — drawn last so the scenes never cover it.
export function drawFloats(ctx, g) {
  for (const f of g.floats) {
    const a = Math.max(0, 1 - f.t / 1.4);
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y - f.t * 34, 22, f.color, 800, 'center');
    ctx.globalAlpha = 1;
  }
}

export function drawTitle(ctx, g) {
  // Dusk harbor backdrop: reuse round-1 scene full-bleed behind the title.
  const round = {
    ...ROUNDS[0], seedStar: 11, seedCloud: 12, seedWave: 13,
    seedGull: 14, seedRain: 15, diffs: [], foundIds: [], hintId: null,
  };
  drawScene(ctx, 0, 0, W, H, round, new Set());
  ctx.fillStyle = 'rgba(6,12,26,0.55)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'TIDEWATCH', 640, 240, 96, GOLD, 800, 'center');
  text(ctx, '— The Lighthouse Keeper\'s Eye —', 640, 310, 26, CREAM, 600, 'center');
  text(ctx, 'SPOT 7 DIFFERENCES BEFORE THE STORM', 640, 380, 24, '#fff6d8', 800, 'center');
  text(ctx, 'Two harbors. One is lying. Click every change — 3 rounds, 90 seconds each,', 640, 430, 18, CREAM, 600, 'center');
  text(ctx, '3 lives. Wrong clicks cost a heart. Streaks build your combo.', 640, 458, 18, CREAM, 600, 'center');
  // PLAY button.
  bar(ctx, 490, 510, 300, 72, GOLD);
  text(ctx, '▶  PLAY', 640, 546, 34, INK, 800, 'center');
  text(ctx, 'H hint · R restart · M mute · ESC pause · click = mark', 640, 630, 15, '#c9d2e0', 600, 'center');
  text(ctx, 'A TIDEWATCH ORIGINAL — drawn live, no two harbors alike', 640, 760, 13, '#8a94a8', 600, 'center');
}

function overlay(ctx, title, titleColor, lines, button) {
  ctx.fillStyle = 'rgba(6,12,26,0.72)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, title, 640, 300, 64, titleColor, 800, 'center');
  let y = 380;
  for (const ln of lines) {
    text(ctx, ln, 640, y, 22, CREAM, 600, 'center');
    y += 36;
  }
  if (button) {
    bar(ctx, 490, y + 20, 300, 64, GOLD);
    text(ctx, button, 640, y + 52, 28, INK, 800, 'center');
  }
}

export function drawRoundEnd(ctx, g) {
  const round = ROUNDS[g.round];
  overlay(ctx, 'ROUND CLEAR!', '#7dff9e', [
    `${round.name} — all 7 differences found.`,
    `Time bonus + lives bonus: +${g.roundBonus}  ·  Score: ${g.score}`,
    g.round >= 2 ? 'The harbor is almost safe…' : 'The storm grows closer. Next round:',
  ], g.round >= 2 ? 'FINISH ▶' : 'NEXT ROUND ▶');
}

export function drawWon(ctx, g) {
  overlay(ctx, '⚓ THE HARBOR IS SAFE', GOLD, [
    `All 3 rounds cleared — every change spotted, the light kept.`,
    `FINAL SCORE ${g.score}  ·  BEST COMBO ×${(1 + Math.min(Math.max(g.bestCombo - 1, 0), 4) * 0.5).toFixed(1)} (${g.bestCombo} streak)`,
    'The keeper trims the lamp. Dawn breaks over a harbor that never lied twice.',
  ], '↻  PLAY AGAIN');
}

export function drawLost(ctx, g) {
  const why = g.endReason === 'time'
    ? 'The 90 seconds ran out — the storm rolled in unseen.'
    : 'Three wrong marks — the keeper lost the light.';
  overlay(ctx, 'THE STORM TOOK THE LIGHT', '#ff7a6b', [
    why,
    `You found ${g.found.length}/7 in ${ROUNDS[g.round].name}  ·  Score: ${g.score}`,
    'The harbor keeps its secrets… this time.',
  ], '↻  TRY AGAIN');
}

export function drawPaused(ctx, g) {
  overlay(ctx, 'PAUSED', CREAM, [
    'The harbor waits. The storm does not.',
    'ESC resume  ·  R restart round  ·  M mute',
  ], null);
}

export function drawGame(ctx, g) {
  const round = ROUNDS[g.round];
  const seedBase = 100 + g.round * 17 + g.seed;
  const view = {
    ...round,
    seedStar: seedBase + 1, seedCloud: seedBase + 2, seedWave: seedBase + 3,
    seedGull: seedBase + 4, seedRain: seedBase + 5,
    diffs: round.diffs,
    foundIds: g.found,
    hintId: g.hintId,
    hintPulse: g.time * 6,
  };
  drawHUD(ctx, g);
  drawScene(ctx, PANEL_LEFT.x, PANEL_LEFT.y, PANEL_LEFT.w, PANEL_LEFT.h, view, new Set());
  const rightDiffs = new Set(round.diffs.map((d) => d.id));
  drawScene(ctx, PANEL_RIGHT.x, PANEL_RIGHT.y, PANEL_RIGHT.w, PANEL_RIGHT.h, view, rightDiffs);
  drawFloats(ctx, g);
  if (g.phase === 'roundEnd') drawRoundEnd(ctx, g);
  else if (g.phase === 'won') drawWon(ctx, g);
  else if (g.phase === 'lost') drawLost(ctx, g);
  else if (g.phase === 'paused') drawPaused(ctx, g);
}
