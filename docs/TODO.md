# TODO

Product vision: `docs/PRODUCT-VISION.md`. Authoritative roadmap: `docs/ROADMAP.md`.
Living tracker: GitHub Issues + the **Benchfinity Roadmap** project (milestones
`Increment 0` / `Phase A` / `B` / `C` / `D`). This file is a convenience mirror.

## Done

- [x] V1 Gridfinity **grid** generator: centered/padded envelope sizing, bed-fit + split, 3D preview, STL / split-ZIP / 3MF export, printer presets, settings, tests.
- [x] Repository Foundation (#9): public repo, container CI, distroless Chainguard images, HIGH+ security gates, AGPL-3.0 + DCO, branch protection, Dependabot, Helm/compose/ArgoCD + chart publishing.
- [x] CI hardening: Node-24 action bumps (#24–#27); GHCR packages public; `develop` CI green.
- [x] Product vision + roadmap rebuilt; GitHub restructured to Increment 0 / Phase A–D.
- [x] Company-OS sync: `scripts/company-os/` generator + token-guarded CI workflow; `product/` + `software/` showcases live on `BenchFinity/company`.

## Increment 0 — Launch (ship the V1 grid generator live) — NEXT

- [ ] #29 Create `Benchfinity-CD` GitOps repo (ArgoCD + Kustomize, wraps the OCI chart).
- [ ] #30 Deploy V1 grid generator to production (`benchfinity.com`, dedicated static IP, Traefik + cert-manager `letsencrypt-prod`).

## Phase A — QQQ Spine (the platform-first showcase)

- [ ] #1 Confirm QQQ backend repo, app shape, and local dev run.
- [ ] #2 Define persistence model: System → ContainerType → ContainerInstance → Inserts.
- [ ] #31 Decide auth/account provider (Authentik vs embedded).
- [ ] #4 Build signed-in Workbench app shell.

## Phase B — Grid Persisted & Reusable

- [ ] #5 Preserve V1 generator as first Workbench item type (wrap, never rewrite — issue #5 constraint).
- [ ] #6 Persist baseplate design inputs and derived metadata.
- [ ] #3 Decide export artifact storage.
- [ ] #7 Add export history and download actions.
- [ ] #8 Add backend + frontend test coverage (raise the 34-test baseline).

## Phase C — Bin Plugin Engine (anonymous, client-side, runs parallel to A→B)

- [ ] #32 Bin plugin engine (typed generator framework + Gridfinity footprint contract).
- [ ] #33 First bin types: open bin, storage box, tool-traced.
- [ ] #34 Stand-alone boxes (Modibox-style, non-grid-bound).

## Phase D — Composition & Visual Layout (rich logged-in end-state)

- [ ] #35 Composition: systems, container types, and instances.
- [ ] #36 Visual layout and placement of bins on grids.
