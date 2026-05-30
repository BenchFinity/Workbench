# ADR 0002: Production deployment via a raw-Kustomize CD repo onboarded into the app-of-apps

- Status: Accepted
- Date: 2026-05-30

## Context

Increment 0 takes the V1 generator live at `benchfinity.com`, and the platform
will grow into the voyage shape (QQQ backend, Postgres, Redis, object storage).
A self-hosted fleet already exists: Argo CD runs on `k8s-infra` and reconciles
into `k8s-prod` (`https://k8s-prod-vip.galaxy.lan:6443`), governed by
`KofTwentyTwo/k8s-app-of-apps`. Every workload there (kof22-website, voyage,
bigcapital, marketing-website) ships its manifests in a private per-app
`<app>-cd` repo as **raw Kustomize** (`base/` + `overlays/{env}/` + `proxy/`),
onboarded via two Argo CD Applications: the workload and a sync-wave `-1`
sealed-secrets Application. There is no Helm in any CD repo; an upstream chart
(authentik) is `helm template`d and committed as static YAML.

`voyage-cd` is the direct analog: a QQQ/Java backend with Postgres (Zalando
operator), Redis-sentinel, MinIO, B2 backup CronJobs, and a Synology
TLS-passthrough proxy, all raw Kustomize. Benchfinity additionally already
publishes a Helm chart and image to GHCR, both public.

## Decision

- Production runs through a new private repo **`BenchFinity/Workbench-CD`**,
  raw Kustomize modeled on `voyage-cd`, onboarded into `k8s-app-of-apps`
  (`apps/`, `shared/` AppProject + sealed repo-creds, `infra/` sealed secrets,
  `envs/production`).
- The published workbench **Helm chart stays as the external self-hoster
  artifact**, not our production source of truth. "Fully Helm" applies to how
  the app is packaged, not to the CD repo.
- **Scaffold the full voyage-shaped stack and run the data plane live now**
  (Postgres/Redis/MinIO/backups). The `benchfinity-api` (QQQ) tier is scaffolded
  but parked at `replicas: 0` until its image exists (#1). Only the static web
  tier serves traffic at launch.
- **Production only** to start (namespace `benchfinity-prod`).
- Edge is a plain k8s `Ingress` + Traefik annotations + a cert-manager
  `Certificate` on ClusterIssuer `letsencrypt-production`, matching voyage.
  Synology services route through a `proxy/` Traefik TLS-passthrough to the
  benchfinity NAS (`10.120.149.4`) for `dsm,calendar,chat,contacts,drive,file,mail.benchfinity.com`.
- The image is **pinned to the immutable release tag `0.1.0`**, produced by
  cutting workbench `develop` to `main`. The image is public, so no pull secret.
- Secrets use Bitnami **sealed-secrets** (MinIO root, B2 backup key, Argo CD repo
  deploy key). Postgres user credentials are operator-generated, not sealed.
- CI for `Workbench-CD` is **GitHub Actions** (`kustomize build` +
  `kubeconform` + `gitleaks`, with `kube-linter`/`yamllint` advisory), since the
  BenchFinity org is GitHub-native. The app-of-apps additions ride that repo's
  existing CircleCI/Munitor pipeline unchanged.

## Rationale

- Fleet consistency: every workload is raw-Kustomize-in-a-CD-repo, onboarded the
  same way, and voyage proves the exact full-stack shape benchfinity needs.
- The chart keeps a real audience (external self-hosters) without becoming a
  second production source of truth.
- Running the data plane early de-risks the stateful pieces (operator, storage,
  backups, sealing) before the QQQ backend lands.
- Reusing the fleet B2 key under a `benchfinity-prod/` prefix isolates data
  without minting new credentials; every consumer of that bucket must prefix.

## Consequences

- `Workbench-CD` is the first GitHub-Actions-validated CD repo in an otherwise
  CircleCI/Munitor fleet — a deliberate, documented one-off.
- A standing Postgres/Redis/MinIO footprint exists with no consumer until #1;
  backup jobs run against an empty database initially.
- `benchfinity-api` is inert (`replicas: 0`) until #1 supplies an image and the
  ConfigMap wiring is finalized.
- Synology subdomains only resolve end-to-end once both the `proxy/` and the NAS
  box are reachable.
- `docs/DEPLOY.md` and the example `deploy/argocd/application.yaml` describe the
  image as private and the chart as the deploy path; both are now stale and are
  corrected as part of the rollout.
