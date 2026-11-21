# TIDEWATCH — The Lighthouse Keeper's Eye

[![Bounty](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![Rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/atomicbyte2-ai/spot-diff-20261121-cand-a/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![Reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/atomicbyte2-ai/spot-diff-20261121-cand-a/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

A spot-the-difference game for the make.fun bounty
**best-spot-the-difference-game-20261121-0451** ($50, top 10 share $5 each).

A lighthouse keeper compares two dusk-harbor scenes side by side to spot
what changed before the storm hits. Three rounds — **DUSK → STORM → DAWN**
— each with 7 real differences drawn by one seeded procedural renderer, so
every difference is guaranteed findable: a light gone out, an extra gull,
a sail that changed colour, a missing rowboat, a lit window, a drifting
buoy, a vanished moon, lightning, and more.

## How to play

- **Click** a difference (on either panel) to mark it with a gold ring.
- **FOUND n/7** counter, 3 lives, 90 seconds per round.
- Wrong clicks cost a life and break your combo; streaks multiply points.
- **H** hint (−50 pts), **R** restart round, **M** mute, **ESC** pause.
- Find all 7 to clear the round; clear all 3 rounds to keep the harbor safe.

## Run it

```sh
# Play locally (Node 22, no dependencies, no network):
node serve.ts
# then open http://localhost:8080

# Build the entry dossier the grader reads:
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

All art is drawn procedurally on canvas — no external images, sounds, or
network requests. Sounds are tiny WebAudio bleeps. Screenshots are staged
deterministically with `?shot=1..4&seed=1`.

## Layout

- `game/` — the playable game (`index.html`, `src/sim.js`, `src/render.js`,
  `src/audio.js`, `src/main.js`)
- `main.ts` — copies `game/` + `screenshots/` to the output dir and writes
  `dossier.json` via the vendored make.fun library
- `vendor/makefun-game.ts` — the make.fun dossier library, copied unchanged
  from the bounty starter kit
- `screenshots/` — title, mid-play, action, and win-screen captures
- `tests/bot-test.mjs` — smoke test: a careful bot must win 5/5, a random
  bot must lose 5/5 (`node tests/bot-test.mjs`)
