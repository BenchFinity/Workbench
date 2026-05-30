# Session State

**Last Updated:** 2026-05-30

## Current Status

V1 grid generator complete; repo public and hardened. This session **rebuilt the
product vision and roadmap** (see `docs/PRODUCT-VISION.md` and `docs/ROADMAP.md`)
and restructured GitHub to match. The next concrete step is **Increment 0**:
deploy the existing V1 grid generator live to `benchfinity.com`.

## What Was Done This Session

- **CI/CD verified.** Merged the Node-24 action bumps (#24 setup-helm 4→5, #25
  login-action 3→4, #26 codeql-action 3→4, #27 checkout 4→6); `develop` CI green;
  Node 20 deprecation cleared. Flipped the GHCR packages (the `workbench` image
  and `charts/benchfinity`) to **public** so the published artifacts are actually
  consumable.
- **Product discovery (with James).** Confirmed the real product — not the old
  `WORKBENCH-VNEXT.md` sketch. Benchfinity is an open-source platform to design
  and print a whole **workshop organization system in one place**: grids (fit to
  measured drawers) → a **pluggable family of bins** → stand-alone boxes →
  composed into **reusable systems**. Anonymous = generate/preview/export single
  parts; account = save/reuse/systems. Captured in `docs/PRODUCT-VISION.md`.
- **Roadmap rebuilt** (`docs/ROADMAP.md`): platform-first, continuous-delivery.
  Increment 0 (launch V1 grid live) → Phase A (QQQ + Postgres + auth/RBAC + app
  shell) → Phase B (wrap the pure core per #5, container reuse, export history,
  tests) → Phase C (bin plugin engine + bin types + stand-alone boxes; anonymous,
  client-side, runs in parallel) → Phase D (composition + visual layout).
- **GitHub restructured.** Remapped #1–#8 onto the new phases (milestones +
  `phase:A/B` labels); created 8 new issues #29–#36 (Increment 0, auth decision,
  Phase C bins, Phase D); retired the `Workbench VNext` milestone; created
  `Increment 0` + `Phase A/B/C/D` milestones; remapped the project board `Phase`
  field; deleted `phase:1–5` labels; added `deployment` + `plugin` labels.

## Active Branches

| Branch                               | Status                                                          |
| ------------------------------------ | --------------------------------------------------------------- |
| `develop`                            | default; CI green; action bumps + public packages landed        |
| `feature/product-vision-and-roadmap` | PRODUCT-VISION + ROADMAP + this refresh; PR open into `develop` |
| `main`                               | protected; behind `develop` (gitflow); unreleased               |

## Pending Work / Next Steps

- [ ] Merge the planning-docs PR into `develop`.
- [ ] **Sync the product vision/roadmap with the company operating system (`../brand/`).**
- [ ] **Increment 0 (#29, #30):** create the `Benchfinity-CD` GitOps repo (ArgoCD +
      Kustomize, templated on `Kof22/Website-CD`) wrapping the OCI chart; deploy the V1
      grid generator live at `benchfinity.com` on the **dedicated static IP** (need the
      IP from James), Traefik + cert-manager `letsencrypt-prod`; then close the CD loop.
- [ ] Phase A backlog (#1, #2, #4, #31) when starting the QQQ spine.

## Key Reference

- **Product owner is James** — do not invent scope; product/roadmap live here, the
  company OS (marketing/brand/community/etc.) lives in `../brand/` and defers to us
  on product.
- **Deploy:** Talos `k8s-prod`; ArgoCD + a dedicated `-cd` GitOps repo per app
  (template: `/Users/james.maes/Git.Local/Kof22/Website-CD`); Traefik;
  cert-manager `letsencrypt-prod` (Ready); dedicated static IP; PUBLIC image
  `ghcr.io/benchfinity/workbench` + chart `oci://ghcr.io/benchfinity/charts/benchfinity`.
  Postgres-on-k8s is a solved pattern here (postgres-operator) for the future QQQ backend.
- **Milestones / issues:** Increment 0 (#29, #30); Phase A (#1, #2, #4, #31);
  Phase B (#3, #5, #6, #7, #8); Phase C (#32, #33, #34); Phase D (#35, #36).
- **Gates:** `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` (34-test baseline). Do NOT use the Bambu Studio CLI (crashes this machine); validate 3MF via tests + manual GUI import.
- **Hard constraint (#5):** the V1 geometry/validation/export core stays pure — wrap, never rewrite; persist `PlateInput` + derived `PlateLayout`, recompute meshes on load.
