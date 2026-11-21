// TIDEWATCH sounds — tiny WebAudio bleeps, no external files. All calls
// are safe before any user gesture: a suspended context is simply skipped.

let ctx = null;

function ac() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

function blip(freq, dur, type, vol, when = 0) {
  const c = ac();
  if (!c || c.state !== 'running') return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(c.currentTime + when);
    o.stop(c.currentTime + when + dur + 0.02);
  } catch {
    // Audio is decoration; never break the game for it.
  }
}

export function sfxFound(muted) {
  if (muted) return;
  blip(660, 0.12, 'sine', 0.18);
  blip(990, 0.18, 'sine', 0.18, 0.08);
}

export function sfxMiss(muted) {
  if (muted) return;
  blip(140, 0.25, 'sawtooth', 0.12);
}

export function sfxWin(muted) {
  if (muted) return;
  [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.22, 'triangle', 0.16, i * 0.11));
}

export function sfxLose(muted) {
  if (muted) return;
  [392, 330, 262].forEach((f, i) => blip(f, 0.3, 'triangle', 0.14, i * 0.16));
}

export function sfxClick(muted) {
  if (muted) return;
  blip(440, 0.05, 'square', 0.05);
}

export function unlockAudio() {
  const c = ac();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}
