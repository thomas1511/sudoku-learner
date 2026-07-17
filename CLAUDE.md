# CLAUDE.md

Guidance for working in this repository.

## What this is

**Sudoku Lab** — a Dutch single-page app for learning Sudoku solving techniques.
Two modes:

- **Techniektraining** (lesson): pick a technique, solve a generated puzzle by
  hand, and step through a guided coach that explains every move (observe / why /
  action / next).
- **Snelste zet** (fast): a recognition quiz — given a position, name the fastest
  next technique, then progressively reveal the answer, a tip and the marked
  pattern.

It was refactored from a single 497 KB `sudoku_lab_snelste_zet.html` into a
Vite-built, module-separated SPA. Behaviour is intentionally identical to that
original; the split is structural only.

## Commands

```bash
npm install      # install dev dependencies (Vite only)
npm run dev      # dev server with HMR
npm run build    # optimized production build -> dist/
npm run preview  # serve the production build locally
```

There is no test runner or linter configured yet.

## Architecture

Separation of concerns is the organising principle. Dependencies flow **down**:
`data → core → state/selectors → ui → actions → app`. UI never imports actions
except through one deliberate, documented runtime cycle (see below).

```
src/
  main.js          Entry: imports styles + calls init()
  app.js           Bootstrap/wiring: builds controls, binds every DOM handler
  state.js         The single mutable `state` object + localStorage persistence
  selectors.js     Derived read-only views over state (board, candidates, ...)
  actions.js       All state mutations + mode orchestration; calls renderAll()
  data/
    cases.js       BASE_CASES — technique training puzzles (embedded data)
    traces.js      BASE_TRACES — precomputed solve traces (the large ~410 KB dataset)
    techniques.js  TECH_LABELS + TECH_INFO — names and teaching copy
  core/            Pure logic, no DOM, no shared state:
    geometry.js    ROWS/COLS/BOXES/UNITS/PEERS + coordinate/label helpers
    rng.js         Seedable PRNG (reproducible puzzle variants)
    variant.js     Transform a base case into an isomorphic randomised puzzle
    solver.js      Trace/candidate state maths (replay a solve move-by-move)
    describe.js    Generates the Dutch coaching copy for a move
  ui/              DOM rendering:
    grid.js        renderGrid — the 9x9 board (pure view; selection via callback)
    panels.js      Lesson info / coach / fast / dock text panels
    render.js      renderAll — the single repaint entry point
    toast.js       Transient status messages
  styles/          CSS split by concern, imported in cascade order:
    base, layout, board, components, responsive, dark
    (dark.css follows the OS setting via prefers-color-scheme; it redefines
     the :root theme variables and overrides the few hard-coded colours)
public/
  manifest.webmanifest, icon.svg, sw.js   PWA assets (installable + offline)
```

### Key conventions

- **State**: all mutable app state lives in the exported `state` object in
  `state.js`. Mutate it as `state.x = ...` (never reassign module-level `let`),
  so changes are visible across modules. Call `persist()` after changes that
  should survive a reload.
- **Rendering**: after any state change, call `renderAll()` (from `ui/render.js`).
  There is no reactive framework; repaint is explicit.
- **render.js ↔ actions.js cycle**: `renderAll` needs `selectCell` and `actions`
  need `renderAll`. This is a deliberate ESM runtime cycle — safe because neither
  is called during module evaluation. Keep it that way; don't call actions or
  renderAll at import time.
- **Pure core**: everything in `core/` is DOM-free and state-free — safe to unit
  test and reason about in isolation. Keep new solving logic here.
- **Data is generated, not hand-authored**: `BASE_CASES`/`BASE_TRACES` are large
  precomputed blobs. Don't edit them by hand.

## Deployment

Automatic via GitHub Actions (`.github/workflows/deploy.yml`) on every push:
default branch → production, other branches/PRs → preview. Requires repository
secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`. `netlify.toml` covers SPA
routing, asset caching and the service-worker no-cache header.
