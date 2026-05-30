# Session State

**Last Updated:** 2026-05-30

## Current Status

Product vision + roadmap rebuilt and merged; the company-OS sync is operational; **DNS + TLS
for `benchfinity.com` are now live** (registrar delegation fixed this session). **Next session:
Increment 0 — take the V1 grid generator live at `benchfinity.com`** (plan below; now needs only
a go-ahead — the static IP and DNS are already resolved). Workbench `develop` is clean and CI-green.

## What Was Done This Session

- **CI/CD:** merged the Node-24 action bumps (#24 setup-helm, #25 login-action, #26
  codeql-action, #27 checkout); `develop` CI green; GHCR packages (image + chart) made public.
- **Product discovery** (with James) → `docs/PRODUCT-VISION.md`: an open-source platform to
  design+print a whole workshop organization system in one place — grids (fit to measured
  drawers) → a pluggable family of bins → stand-alone boxes → composed into reusable systems.
  Anonymous = generate/preview/export single parts; account = save/reuse/systems. Supersedes
  the old `WORKBENCH-VNEXT.md` sketch.
- **Roadmap rebuilt** (`docs/ROADMAP.md`): platform-first, continuous-delivery, two-track.
  Inc 0 launch → Phase A QQQ spine → B grid persisted/reusable → C bin plugin engine → D
  composition/layout. Preserves the pure core (#5). PR #37 merged.
- **GitHub restructured** to Increment 0 / Phase A–D: remapped #1–#8, created #29–#36, retired
  the `Workbench VNext` milestone, created phase milestones, remapped the project board `Phase`
  field, swapped phase labels.
- **Company-OS sync (Mechanism A):** `scripts/company-os/generate.mjs` renders brand-voiced,
  honest-state `product/review.html` + `software/review.html` into the company OS (`../brand` =
  `BenchFinity/company`). PR #38 merged. CI `.github/workflows/company-os-sync.yml` (token-guarded)
  auto-PRs the company repo on change. Company#6 merged → pages live on `company:develop`.
  Verified end-to-end (secret `COMPANY_OS_TOKEN` set; sync run authenticated, clean no-op).
- **DNS + TLS:** `benchfinity.com` registrar NS were wedged on Route 53 (the vanity
  `ns*-benchfinity.mmltholdings.com` host objects are stuck "linked" at the registry). Fixed by
  delegating to in-bailiwick **`ns1`/`ns2.benchfinity.com` + glue → `50.122.5.149`** (no MMLT hop);
  DNS is now served by the **Synology** zone (apex + `www → k8s → 50.122.5.149` already set), not
  Route 53. `dsm.benchfinity.com` re-issued with a trusted Let's Encrypt cert (covers
  calendar/chat/contacts/drive/mail too). AWS account `744245396565`, profile `kingsrook_root_admin`.

## Active Branches

| Branch              | Status                                            |
| ------------------- | ------------------------------------------------- |
| workbench `develop` | default; CI green; #37 + #38 merged; clean        |
| workbench `main`    | protected; behind develop                         |
| company `develop`   | pages live (`product/` + `software/` review.html) |

## Pending Work

- [ ] **NEXT — Increment 0 go-live** (#29 create `Benchfinity-CD`, #30 deploy). Plan below.
- [ ] #16 HELD: npm-dev group (TS 5→6, Vite 6→8, plugin-react 4→6) fails `validate` (TS2882);
      needs a dedicated migration, not an auto-merge.
- [ ] Phase A backlog when the QQQ spine starts: #1, #2, #4, #31.
- [ ] (Optional) verify the rotated `COMPANY_OS_TOKEN` if it was re-set after the wrap.

## Increment 0 — next-session plan

**Static IP is known: `50.122.5.149`** (benchfinity.com apex + `www` already resolve there via the
Synology DNS). **Only input needed: a go-ahead** to create public repo `BenchFinity/benchfinity-cd`

- wire ArgoCD on `k8s-prod`.

1. Create `BenchFinity/benchfinity-cd` (Kustomize `base/` + `overlays/production/`), templated on
   `/Users/james.maes/Git.Local/Kof22/Website-CD`; **wrap the OCI chart**
   `oci://ghcr.io/benchfinity/charts/benchfinity` via an ArgoCD Application with inline Helm
   values. Image is **public** → no `imagePullSecret`.
2. ArgoCD Application → namespace `benchfinity`, automated prune+self-heal, `CreateNamespace`;
   pin an immutable `:<version>-SNAPSHOT.<sha>` tag for the first launch.
3. Traefik ingress for `benchfinity.com` + `cert-manager.io/cluster-issuer: letsencrypt-prod` + TLS
   - HTTP→HTTPS redirect, on front-door IP **`50.122.5.149`**. NOTE: that IP currently fronts the
     shared cluster (kof22 etc.) — confirm the benchfinity host routes through Traefik there.
4. **DNS is already done** (`benchfinity.com` → `50.122.5.149` via Synology). Just verify the
   anonymous HTTPS load + STL/3MF export once the ingress + cert are up. Fix stale `docs/DEPLOY.md`
   (image is public; no pull secret).

## Key Reference

- **Product** = here (`docs/PRODUCT-VISION.md`, `docs/ROADMAP.md`); **company/marketing** =
  `../brand` (`BenchFinity/company`), which defers to us on product.
- **Deploy:** Talos `k8s-prod`, Traefik, cert-manager `letsencrypt-prod` (Ready), ArgoCD,
  postgres-operator. Image `ghcr.io/benchfinity/workbench` + chart `…/charts/benchfinity` (both public).
- **DNS:** `benchfinity.com` is delegated to `ns1`/`ns2.benchfinity.com` (glue → `50.122.5.149`) and
  served by the **Synology** zone — NOT Route 53; edit records in Synology DNS. Registrar/account is
  `744245396565` via `aws --profile kingsrook_root_admin` (`aws sso login --profile kingsrook_root_admin`
  first). Optional cleanup: zone NS still says `ns.benchfinity.com` (lame-delegation; harmless).
- **Company-OS sync:** edit `scripts/company-os/generate.mjs` → push `develop` → workflow PRs
  `BenchFinity/company`. Secret `COMPANY_OS_TOKEN` (fine-grained PAT: company Contents + PRs R/W).
- **Gates:** `lint && format:check (runs on .md too) && typecheck && test (34 baseline) && build`.
  Solo merges: `gh pr merge --squash --admin`. Don't use the Bambu Studio CLI.
