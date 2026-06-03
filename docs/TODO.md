# TODO

Product vision: `docs/PRODUCT-VISION.md`. Roadmap: `docs/ROADMAP.md`. Deploy
design: `docs/adr/0002-production-deployment-architecture.md` +
`docs/PLAN-workbench-cd.md`. Living tracker: GitHub Issues + the Benchfinity
Roadmap project.

## Done

- [x] V1 Gridfinity grid generator: STL / split-ZIP / 3MF export, 3D preview, presets, tests.
- [x] Repository Foundation (#9): public repo, container CI, distroless images, security gates, AGPL, branch protection, Helm/compose/ArgoCD + chart publishing.
- [x] Product vision + roadmap; company-OS sync (`product/` + `software/` showcases live).
- [x] **Increment 0 — Launch (#29, #30):** deployed the V1 grid generator to `k8s-prod` at `workshop.benchfinity.com` via a 3-repo GitOps split (`Workbench-CD` app + `Platform-CD` shared data plane + `k8s-app-of-apps` onboarding). `v0.1.0` cut; ArgoCD Synced/Healthy; DNS zone rebuilt + imported.

## Increment 0 — finish-up (small)

- [x] **App live:** `https://workshop.benchfinity.com` (valid LE cert, HTTP→HTTPS; DSM domains restored; ArgoCD Healthy). Root cause of the go-live delay was the network edge — see `docs/SESSION-STATE.md`. Browser smoke test of generate → 3D → STL/3MF/ZIP still worth doing.
- [x] **Website live:** `https://www.benchfinity.com` (apex 301→www) via `Website-CD` + app-of-apps onboarding (#32); Dockerfile hardened nonroot (#3); cert issued; `benchfinity-website-prod` Healthy.
- [x] **Docs:** `app-of-apps/docs/networking-dns-tls.md` + README (PR #33), `Website-CD/README` (PR #2), `Website/docs/DEPLOYMENT.md` (PR #4); SESSION-STATE + TODO current.

### Production-readiness gaps (audit 2026-06-03 — see SESSION-STATE)
- [ ] **B2 backups** [should-have→blocker w/ data]: both `benchfinity-platform` CronJobs fail nightly; seal `b2-backup-credentials` + verify a run + test restore.
- [ ] **Centralized logging** [should-have]: no log-shipper on `k8s-prod` (stdout not aggregated).
- [ ] **App metrics/monitoring** [should-have]: Prometheus CRDs exist but no ServiceMonitors/dashboards/alerts for benchfinity apps.
- [ ] **NetworkPolicy** [should-have]: no segmentation in any benchfinity namespace.
- [ ] **HPA** [nice-to-have]: fixed 2 replicas; `metrics-server` present if we want autoscaling.
- [ ] **`benchfinity-api` CORS** [before un-park #1]: prod overlay targets `benchfinity.com` not `workshop.benchfinity.com`.
- [ ] **Pull-secret rotation**: website `ghcr-pull-secret` holds the `gh` token; rotate to a dedicated `read:packages` PAT.
- [ ] **PostHog (self-hosted)**: add to `Platform-CD`; website bakes `NEXT_PUBLIC_POSTHOG_*` at build time.
- [ ] **Docs refresh**: ADR 0002 / PLAN / ROADMAP still describe the single-repo shape.

## Phase A — QQQ Spine

- [ ] #1 Confirm QQQ backend repo/app shape; publish `benchfinity-api` image, un-park the api tier, finalize cross-namespace DB credential.
- [ ] #2 Persistence model: System → ContainerType → ContainerInstance → Inserts.
- [ ] #31 Auth/account provider; #4 signed-in Workbench app shell.

## Phase B — Grid Persisted & Reusable

- [ ] #5 Preserve V1 generator as first Workbench item type (wrap, never rewrite).
- [ ] #6 Persist baseplate design inputs; #3 export artifact storage (MinIO is up in Platform-CD — confirm vs external S3); #7 export history; #8 raise the 34-test baseline.

## Phase C — Bin Plugin Engine

- [ ] #32 Bin plugin engine; #33 first bin types; #34 stand-alone boxes.

## Phase D — Composition & Visual Layout

- [ ] #35 Composition (systems/types/instances); #36 visual layout/placement.
