// TIDEWATCH browser glue — canvas setup, input, the animation loop, and
// ?shot=N&seed=S staging for frozen, deterministic screenshots.
//
//   ?shot=1  title screen
//   ?shot=2  round 1 mid-play: 3 found marked, 4 unfound, counter visible
//   ?shot=3  round 2 mid-play: 5 found, combo x2.0, timer low
//   ?shot=4  win screen with final score + PLAY AGAIN
// When a shot is staged the sim is frozen and window.__shotReady is set
// once the frame is drawn, so a screenshot runner can wait on it.

import {
  W, H, newGame, startGame, nextRound, restartRound, togglePause,
  toggleMute, clickAt, useHint, step,
} from './sim.js';
import {
  drawGame, drawTitle,
} from './render.js';
import {
  sfxFound, sfxMiss, sfxWin, sfxLose, sfxClick, unlockAudio,
} from './audio.js';

const params = new URLSearchParams(location.search);
const shot = Number(params.get('shot') || 0);
const seed = Number(params.get('seed') || 1);

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const g = newGame(seed);

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (g.phase === 'title') drawTitle(ctx, g);
  else drawGame(ctx, g);
}

// --- screenshot staging: fixed scenes, frozen sim, seeded rng ---
function stageTitle() {
  g.phase = 'title';
}

function stagePlay() {
  startGame(g);
  g.round = 0;
  // Mark the first 3 differences of round 1 (light, gull, sail).
  for (const id of ['light', 'gull', 'sail']) {
    g.found.push(id);
    g.combo = 3;
    g.bestCombo = 3;
  }
  g.score = 100 + 150 + 200;
  g.timeLeft = 61;
  g.floats = [{ x: 766, y: 480, text: '+200', color: '#ffd76a', t: 0.2 }];
}

function stageAction() {
  startGame(g);
  g.round = 1;
  for (const id of ['moon', 'bolt', 'lampwin', 'sail', 'barrel']) {
    g.found.push(id);
  }
  g.combo = 5;
  g.bestCombo = 5;
  g.score = 1250;
  g.timeLeft = 12;
  g.lives = 2;
  g.floats = [{ x: 1176, y: 250, text: '+300', color: '#ffd76a', t: 0.2 }];
}

function stageEnd() {
  startGame(g);
  g.round = 2;
  g.found = ['sun', 'boat2', 'flag', 'buoy', 'light', 'gull', 'window'];
  g.score = 3420;
  g.bestCombo = 7;
  g.combo = 7;
  g.phase = 'won';
}

if (shot === 1) stageTitle();
else if (shot === 2) stagePlay();
else if (shot === 3) stageAction();
else if (shot === 4) stageEnd();

if (shot > 0) {
  draw();
  window.__shotReady = true;
} else {
  // --- live game ---
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const prevPhase = g.phase;
    step(g, dt);
    if (prevPhase === 'play' && g.phase === 'won') sfxWin(g.muted);
    if (prevPhase === 'play' && g.phase === 'lost') sfxLose(g.muted);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  canvas.addEventListener('click', (e) => {
    unlockAudio();
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    if (g.phase === 'title') {
      // PLAY button.
      if (x >= 490 && x <= 790 && y >= 510 && y <= 582) {
        sfxClick(g.muted);
        startGame(g);
      }
      return;
    }
    if (g.phase === 'roundEnd') {
      sfxClick(g.muted);
      nextRound(g);
      return;
    }
    if (g.phase === 'won' || g.phase === 'lost') {
      sfxClick(g.muted);
      startGame(g);
      return;
    }
    const res = clickAt(g, x, y);
    if (res.ok) sfxFound(g.muted);
    else if (res.why === 'miss') sfxMiss(g.muted);
  });

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'h') {
      if (useHint(g)) sfxClick(g.muted);
    } else if (k === 'r') {
      if (g.phase === 'play' || g.phase === 'paused') restartRound(g);
    } else if (k === 'm') {
      toggleMute(g);
    } else if (k === 'escape') {
      togglePause(g);
    } else if (k === 'enter' || k === ' ') {
      if (g.phase === 'title') startGame(g);
      else if (g.phase === 'roundEnd') nextRound(g);
      else if (g.phase === 'won' || g.phase === 'lost') startGame(g);
    }
  });
}
