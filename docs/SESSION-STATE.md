# Session State

**Last Updated:** 2026-06-03

## Current Status

**The full Benchfinity fleet is live on `k8s-prod`:**
- **`https://workshop.benchfinity.com`** — V1 grid generator (Workbench-CD), valid LE cert, HTTP→HTTPS 308.
- **`https://www.benchfinity.com`** (+ apex `benchfinity.com` 301→www) — marketing site (Website-CD, Next.js), valid LE cert, HTTP→HTTPS 301.
- DSM domains (`dsm/calendar/chat/contacts/drive/file/mail`) via Synology TLS-passthrough.

All six benchfinity ArgoCD apps `Synced`/`Healthy` (`benchfinity-prod`,
`benchfinity-platform`, `benchfinity-platform-infra`, `benchfinity-proxy`,
`benchfinity-website-prod`, `benchfinity-website-infra`). CI green on all repos
(Workbench-CD, Platform-CD, Website-CD, Website via GitHub Actions; app-of-apps
via CircleCI/Munitor). See **Production-readiness gaps** below for what's still
missing for a hardened prod system (off-site backups, logging/metrics,
NetworkPolicy, etc.).

## Architecture (decided this session — see `docs/adr/0002-...md` + `docs/PLAN-workbench-cd.md`)

Decentralized, fleet-consistent, modeled on `voyage-cd`, onboarded into
`KofTwentyTwo/k8s-app-of-apps`. Each app owns its own Traefik route; Traefik
itself is shared cluster infra. The published Helm chart (`deploy/helm/`) is the
**external self-hoster artifact only** — production is raw Kustomize.

- **`BenchFinity/Workbench-CD`** (private): stateless app. `benchfinity-web`
  (static SPA, `ghcr.io/benchfinity/workbench:0.1.0`, **public** image, no pull
  secret) + **parked** `benchfinity-api` (`replicas: 0`, QQQ image TBD #1).
  Namespace `benchfinity-prod`. Host `workshop.benchfinity.com` (Ingress +
  cert-manager Certificate `letsencrypt-production`). GitHub Actions CI.
- **`BenchFinity/Platform-CD`** (private): shared data plane — Zalando Postgres
  (`benchfinity-postgres`, db/user `benchfinity`, ns `benchfinity-platform`),
  Redis-sentinel, MinIO, B2 backup CronJobs — plus the Synology **proxy** (ns
  `benchfinity-proxy`, NAS `10.120.149.4`, SNIs dsm/calendar/chat/contacts/drive/file/mail).
  App reaches DB cross-namespace at `benchfinity-postgres-pooler.benchfinity-platform`.
- **`KofTwentyTwo/k8s-app-of-apps`** (control plane, CircleCI/Munitor): onboarded
  `benchfinity` + `benchfinity-platform` (+ `benchfinity-proxy`) Applications,
  AppProjects, sealed repo-creds (deploy keys), sealed MinIO secret.

## What was done this session

- Design (grill-me) → **ADR 0002** + **PLAN-workbench-cd.md** (workbench PR #41, merged).
- Cut **v0.1.0** (develop→main, rebase) → `:0.1.0` image + GitHub release.
- Built Workbench-CD + Platform-CD (CI green); onboarded via app-of-apps PRs
  **#28** (initial) → **#29** (split into app + platform) → **#30**
  (ignoreDifferences for StatefulSet/CronJob), all merged.
- Enabled deploy keys (org setting) + added read-only keys to both CD repos;
  sealed repo-creds (argocd@k8s-infra) and MinIO secret (benchfinity-platform).
- **ArgoCD healthy:** `benchfinity-prod` (web 2/2 on `:0.1.0`),
  `benchfinity-platform` (Postgres 3+pooler / Redis 3 / MinIO all Running),
  `benchfinity-platform-infra` Synced, `benchfinity-proxy` Synced.
- **DNS fix:** the `benchfinity.com` zone failed BIND `check-integrity` ("zone
  not loaded") because a rebuild dropped the `ns.benchfinity.com` A record while
  the NS still referenced it. Rebuilt the zone, re-imported via Synology
  **"Complete zone settings"** bundle (`zone.conf` + `zonefile/benchfinity.com`).
  Imported clean.
- **DNS verification + NS-consistency fix (this session):** confirmed
  `workshop.benchfinity.com` resolves correctly from the authoritative server,
  Google `8.8.8.8`, Cloudflare `1.1.1.1`, and locally (CNAME → `k8s` → A
  `50.122.5.149`); negative-cache cleared. Fixed a parent/child NS mismatch: the
  registry delegates to `NS1`/`NS2.benchfinity.com` but the zone served only
  `ns.benchfinity.com`. Surgical UI edit on the Synology DNS Server: in-zone `NS`
  RRset → `ns1` + `ns2`, SOA MNAME → `ns1.benchfinity.com`, serial `30` → `37`
  (the `ns`/`ns1`/`ns2` A records all already existed, so the zone still loads).
  Verified on the authoritative server and both public resolvers; `workshop`
  unaffected. Remaining DNS nicety (not a bug): `ns1`/`ns2` resolve to the same
  single IP/box, so there is no real nameserver redundancy yet.
- **Go-live debugging (this session) — every failure was at the edge, not the
  app.** The cluster, CD repos, and ArgoCD were correct throughout; the issues
  were the network path into the cluster:
  - **Edge repoint:** all benchfinity hosts pointed at front IP `50.122.5.149`,
    whose 80/443 originally went straight to the Synology NAS (served the `dsm`
    cert + a DSM login page for `workshop`). Router port-forwards repointed so
    `.149` 80/443 → cluster Traefik (`10.120.208.205`), matching the kof22/qrun
    pattern (per-tenant public IP → shared Traefik).
  - **DSM domains restored:** after the repoint, `dsm/calendar/...` timed out
    because the cluster could not reach the benchfinity NAS (`10.120.149.4`) on
    TCP 80/443 — ICMP passed and the kof22 NAS was reachable, so it was a
    gateway/VLAN firewall gap, not the NAS service (NAS served fine on the LAN).
    A gateway allow-rule (`10.120.208.0/24` → `10.120.149.4:80,443`) fixed it.
    These ride a `tls.passthrough` IngressRouteTCP to the NAS, which serves its
    own DSM-managed LE cert (cert-manager untouched).
  - **`workshop` cert issued:** cert-manager's HTTP-01 self-check was timing out
    because `benchfinity.com` had no CoreDNS split-horizon zone, so the in-cluster
    self-check chased the public IP (not hairpin-reachable; hairpin is NOT active
    on this cluster — split-horizon is the mechanism). Added a `benchfinity.com:53`
    zone to the shared CoreDNS Corefile (app-of-apps PR #31,
    `cluster-resources/kof22-website/coredns-configmap.yaml`) answering the Traefik
    VIP for the apex + `*` (covers app, www, all subdomains); deleted the stale
    ACME order → cert issued. See memory `fleet-edge-dns-nas-proxy-pattern`.
  - **HTTP→HTTPS redirect:** Workbench-CD PR #1 added a `web`-entrypoint Ingress +
    Traefik `redirect-https` Middleware (`redirectScheme`, permanent) so
    `http://workshop` 308-redirects instead of returning 404.
- **Website go-live (this session):** scaffolded `Website-CD` (Next.js standalone,
  port 3000, `www` canonical + apex 301→www + HTTP 301→HTTPS redirects,
  cert-manager cert covering apex+www, private image via sealed `ghcr-pull-secret`)
  and onboarded it into app-of-apps (PR #32: Application + infra-app + `benchfinity`
  AppProject extension + sealed `repo-creds` deploy key + sealed `ghcr-pull-secret`).
  Hardened the Website Dockerfile to run nonroot (`USER node`, PR #3 → develop) for
  restricted PodSecurity. Live at `https://www.benchfinity.com`; cert issued via the
  split-horizon zone; ArgoCD `benchfinity-website-prod` Healthy, 2/2.
  **Follow-up:** the pull secret holds the `gh` login token — rotate to a dedicated
  `read:packages` PAT and re-seal.
- **Documentation (this session):** `k8s-app-of-apps/docs/networking-dns-tls.md` +
  README inventory fix (PR #33); comprehensive `Website-CD/README` (PR #2);
  `Website/docs/DEPLOYMENT.md` (PR #4).

## Production-readiness gaps (audit 2026-06-03)

Fleet is **live and healthy**, but missing for a hardened prod system (severity in brackets):

1. **Off-site backups broken** [should-have; blocker once real data lands]. Both
   `benchfinity-platform` B2 CronJobs (`postgres-b2-backup` 04:00, `minio-b2-backup`
   05:00) **fail every night** — `b2-backup-credentials` was never sealed. No
   off-cluster copy of prod data exists. Fix: authorize the B2 key, seal into
   `infra/benchfinity-platform/overlays/production/`, verify a run + test restore.
2. **No centralized logging** [should-have]. No log-shipper DaemonSet
   (Datadog/Fluent/Vector) on `k8s-prod`; container stdout is not aggregated.
3. **No metrics/monitoring of the apps** [should-have]. Prometheus-operator CRDs
   exist cluster-wide but there are **no ServiceMonitors** for benchfinity apps, so
   nothing scrapes them; no dashboards/alerts. (`metrics-server` IS present.)
4. **No NetworkPolicy** [should-have, security]. No segmentation/default-deny in
   any benchfinity namespace.
5. **No HPA** [nice-to-have]. Fixed 2 replicas everywhere; `metrics-server` is
   available so an HPA on the web tiers is straightforward if traffic warrants.
6. **`benchfinity-api` CORS wrong host** [should-have, before un-park]. Prod
   overlay sets `CORS_ALLOWED_ORIGINS=benchfinity.com,www…` but the app host is
   `workshop.benchfinity.com`. Fix in Workbench-CD before un-parking the api (#1).
7. **No ingress security headers / rate limiting** [nice-to-have]. No Traefik
   security-header or rate-limit Middleware on the app routes.
8. **Hidden non-GitOps deps to keep documented**: the gateway/VLAN firewall
   allow-rule (`10.120.208.0/24 → 10.120.149.4:80,443`) for cluster→NAS, and the
   shared cross-tenant CoreDNS Corefile (`cluster-resources/kof22-website/`) — easy
   to clobber on a kof22 edit.

## Remaining / next steps

1. **Go-live: DONE (both sites).** `workshop.benchfinity.com` (app) and
   `www.benchfinity.com` (website, apex 301→www) both serve over HTTPS with valid
   LE certs; DSM domains work; all 6 benchfinity ArgoCD apps Healthy. Manual smoke
   test still worth doing: generate → 3D → STL/3MF/ZIP at workshop.
2. **Production-readiness gaps:** see the section above — top items are the broken
   B2 backups, no centralized logging, no app metrics/ServiceMonitors, no
   NetworkPolicy. Prioritize the B2 backup key before real data lands.
3. **PostHog** (deferred): Cloud vs self-hosted (chosen: self-hosted). Add to
   Platform-CD; the website bakes `NEXT_PUBLIC_POSTHOG_*` at build time so the CI
   needs the instance host.
4. **Pull-secret rotation:** the website `ghcr-pull-secret` holds the `gh` login
   token — rotate to a dedicated `read:packages` PAT and re-seal.
5. **Docs refresh:** ADR 0002 / PLAN-workbench-cd / ROADMAP / DEPLOY still describe
   the earlier single-repo shape — update to the app + Platform-CD split, the
   `workshop.` host, and the now-live website. (This SESSION-STATE + TODO, and the
   new `Website-CD`/`Website`/`app-of-apps` docs, are current.)
6. **Optional:** real nameserver redundancy (`ns1`/`ns2` share one IP/box).

## Key references

- Local clones: `~/Git.Local/benchfinity/{workbench,Workbench-CD,Platform-CD}`,
  `~/Git.Local/Kof22/k8s-app-of-apps`.
- Cluster: ArgoCD on `k8s-infra` → `k8s-prod` (`k8s-prod-vip.galaxy.lan:6443`).
  Shared Traefik (VIP `10.120.208.205`), cert-manager `letsencrypt-production`,
  Zalando postgres-operator, Bitnami sealed-secrets. Per-tenant public IP → router
  80/443 → Traefik VIP; benchfinity front `50.122.5.149`, NAS LAN `10.120.149.4`
  (cluster→NAS needs a gateway allow-rule: `10.120.208.0/24` → `10.120.149.4:80,443`).
- **CoreDNS split-horizon** (in-cluster name → Traefik VIP; required for
  cert-manager HTTP-01 self-checks, since the public IPs are not hairpin-reachable
  and NAT hairpin is not used) lives in the shared Corefile at app-of-apps
  `cluster-resources/kof22-website/coredns-configmap.yaml` (ArgoCD app
  `kof22-website-cluster-resources`, `targetRevision: main`). Add a per-domain zone
  for each new tenant. See memory `fleet-edge-dns-nas-proxy-pattern`.
- **SSH agent to GitHub was DOWN this session** → git on `k8s-app-of-apps` was
  switched to HTTPS (origin URL). Revert to SSH when the agent is back if desired.
- **Synology DNS import format:** "Complete zone settings" zip = `zone.conf` +
  `zonefile/<zone>`; a bare `.zone` or a wrong-structure zip is rejected/parsed raw.
  Every NS target MUST have an A record or the zone won't load.
- **Gated actions** (admin merges to main/prod, cross-app prod secret reads) are
  blocked by the auto-mode classifier — James ran those.
