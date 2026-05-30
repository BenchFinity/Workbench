# Company-OS sync

Generates the **company operating system** (`BenchFinity/company`, local `../brand/`) division
showcases for the two divisions whose data Workbench owns:

- `product/review.html` — product vision, the workspace-system model, and the roadmap.
- `software/review.html` — stack, architecture, modules, and status.

## Why this exists

The company OS holds `product/` and `software/`, but the underlying data lives here in Workbench.
Rather than hand-maintain copies in two repos (which drift), Workbench stays the **single source of
truth** and this generator emits the two review pages into the OS. The OS never edits them by hand.

## Rules baked in

- **Honest-state.** What ships today is present tense (`Ships today`); everything else is a labeled
  `Roadmap` tag. Today that means: the Gridfinity-compatible **grid generator** + exports + the
  deploy pipeline ship; bins, accounts, systems, the QQQ backend, and visual layout are roadmap.
- **Brand-compliant** (see `../brand/CLAUDE.md`, `../brand/brand/positioning.md`): never "AI"
  (parametric/deterministic), no monetization/pricing framing, never "_a_ Gridfinity generator"
  (it is _the_ platform that unifies Gridfinity generation), "workspace system" register.
- **Matches the convention**: same `--bf-*` tokens, IBM Plex Sans/Mono, the 3×3 mark, and the shared
  CSS vocabulary as `../brand/brand/review.html` and `../brand/marketing/review.html`.

## Run

```bash
node scripts/company-os/generate.mjs                 # writes into ../brand
COMPANY_OS_DIR=/path/to/company node scripts/company-os/generate.mjs
GENERATED_STAMP="v0.2 · 2026-06-10" node scripts/company-os/generate.mjs   # CI passes the date
```

Edit the content in `generate.mjs` (the `productPage` / `softwarePage` blocks); re-run to regenerate.

## Not generated

`../brand/index.html` is hand-maintained in the company OS (it spans every division). Its `product/`
and `software/` cards are updated by hand to link these showcases — only the two `review.html` pages
are generated here.

## Sync to the company OS (CI — to wire)

A GitHub Action runs this generator on changes and opens a PR into `BenchFinity/company` with the
regenerated pages. It needs a cross-repo token (PAT or GitHub App) with write access to the company
repo, stored as a secret. Until that's wired, regenerate locally and commit in the company repo.
