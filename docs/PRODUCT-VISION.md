# Benchfinity — Product Vision

> Source of truth for **what** Benchfinity is and does. Product vision and roadmap
> live in this repo and are owned here; `../brand/` owns everything else
> company-related (marketing, brand, community, content, legal, operations,
> website) and defers to this repo on product.
>
> This document supersedes the scope sketch in `docs/WORKBENCH-VNEXT.md`, which
> was an earlier draft. It was derived directly from a product discovery
> conversation with the founder plus a review of the existing V1 POC — not from
> external research (research informs positioning only, which is a `../brand/`
> concern).

## One line

An open-source online platform to design and print your **entire workshop
organization system in one place** — measure your real drawers and spaces,
generate grids that fit them, fill those grids with an ever-growing family of
specialized bins, compose it all into reusable systems, and export print-ready
files.

## The problem

The founder couldn't find a tool that made toolbox-drawer grids the way they
wanted, and refuses to bounce between four different tools to make grids, then
boxes, then tool outlines. Benchfinity is the one place that does it all —
grounded in real, measured furniture rather than abstract dimensions.

## What Benchfinity generates

The generation model is layered. Everything starts with a grid.

1. **Grids (baseplates)** — the foundation. You enter a _measured_ drawer/space;
   Benchfinity fits whole Gridfinity-compatible cells into it, centers the grid
   with even perimeter padding, and auto-splits the result to fit your printer
   bed. _This exists today in the V1 POC_ (`src/geometry`, `src/export`).
2. **Bins** — sit on grids. This is an **open-ended, ever-growing family of
   typed generators**, not a fixed feature set:
   - open bins, storage boxes,
   - **tool-traced** bins (a tool outline becomes a custom cutout),
   - **specialty** bins (e.g. HO-train storage),
   - **specialized systems** (sockets, wrenches, and more added continuously).

   New bin types are expected to be added all the time. **The growing catalog is
   the product's core value** — so a bin type is effectively a plugin: a
   self-contained generator with its own parameters, geometry, and preview, all
   emitting a Gridfinity-compatible footprint so it drops onto any grid.

3. **Stand-alone boxes** — Modibox-style modular boxes that **interoperate** with
   grids and bins but are not grid-bound. A parallel part track under the same
   compatibility contract.

## How work is organized

### Access line (anonymous vs. account)

- **No account:** generate any single part (grid or bin), see it in real-time 3D,
  and export STL/3MF. You **cannot** save, reuse, or assemble parts into a system.
- **Logged in:** save work, reuse parts and grids, compose full systems, keep an
  export history, and (as a richer end-state) visually lay out and place bins onto
  grids and have it all remembered.

### Composition hierarchy (logged-in)

```
Account
  └── System            (real furniture: "Tool Box 1", the HO-train table)
        └── Container Type    (a measured drawer/shelf + its reusable grid)
              └── Container Instance   (drawer 1…12 — same grid reused, unique contents)
                    └── Inserts        (bins/holders drawn from the Component Library)
```

### Three independent reuse axes

- **Part reuse** — a saved part design (e.g. a 2×1 scoop bin) dropped across any
  number of containers, via a **Component Library**.
- **Container/grid reuse** — define a drawer's dimensions + grid once and stamp it
  across N identical drawers (the "12 identical drawers, different contents"
  case). The grid is shared; the contents are per-instance.
- **Layout reuse** _(rich end-state)_ — saved spatial arrangements of bins on a
  grid, remembered per container instance.

## Experience and outputs

- **Real-time 3D rendering** of every part and layout (the POC-quality
  React + Three.js frontend is the bar).
- Export **STL** and **3MF** (Bambu-style), including split bundles when a part
  exceeds the printer bed.
- Built-in **catalog of known printers and bed sizes** (exists in the POC).

## Architecture and foundations

- **Frontend:** the existing React + Three.js app, held to POC quality or better.
- **Backend:** **QQQ + Postgres** for accounts, persistence, CRUD/REST, admin, and
  server-side processes — also a deliberate **showcase of QQQ + the agentic
  development process**.
- **Auth / accounts:** required for all stateful features. Provider is **open**
  (Authentik, already run elsewhere in the founder's stack, vs. a simpler embedded
  option) — to be decided at the platform layer.
- **Pure core preserved (issue #5):** the V1 geometry/validation/export core stays
  free of React, DOM, and storage. Each generator (grid, each bin type, stand-alone
  box) is a pure module wrapped behind persistence — we _wrap_, never _rewrite_ the
  math. This is also what makes the bin-plugin model and future community
  contribution possible.
- **License:** AGPL-3.0 everywhere.
- **Monetization:** fully free + GitHub Sponsors / sponsorware only. No paid tier.
  The QQQ backend is justified by the product (accounts, reuse, systems) and the
  showcase — not by revenue.
- **Delivery & ops:** built, hosted, and run solo on the existing Talos k8s cluster
  via the ArgoCD `-cd`-repo GitOps pattern on a dedicated static IP. **Continuous
  delivery — small increments shipped to production; launch then build.**
- **Definition of success:** community-canonical positioning (the metric and the
  go-to-market work live in `../brand/`).

## Scope boundaries

- **In scope (this repo):** the application — generators, persistence, accounts,
  composition/reuse, exports, the frontend, the QQQ backend, deployment.
- **Out of scope (in `../brand/`):** marketing, adoption channels, positioning,
  community, brand, content, legal, sustainability strategy.

## Open decisions (resolved later, not invented now)

- Auth/account provider (Authentik vs. simpler embedded option).
- The concrete set and ordering of bin types (the family grows continuously; the
  point is the plugin model, not a fixed list).
- When visual layout/placement of bins onto grids ships (a richer end-state, not
  the first slice).
