# PLAN: Workbench-CD (production deployment)

Take `benchfinity.com` live on `k8s-prod` via a private raw-Kustomize CD repo
(`BenchFinity/Workbench-CD`) modeled on `voyage-cd`, onboarded into
`KofTwentyTwo/k8s-app-of-apps`. Web tier live, full data plane live, QQQ backend
parked. Decision: [ADR 0002](adr/0002-production-deployment-architecture.md).
Refs #29 (create repo), #30 (deploy).

## Values

| Thing               | Value                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CD repo             | `BenchFinity/Workbench-CD` (private)                                                                                                                      |
| Cluster / Argo dest | `https://k8s-prod-vip.galaxy.lan:6443` (Argo CD on `k8s-infra`)                                                                                           |
| App / namespace     | app `benchfinity`; namespace `benchfinity-prod` (proxy in `benchfinity-proxy`)                                                                            |
| Web image           | `ghcr.io/benchfinity/workbench:0.1.0` (public, no pull secret)                                                                                            |
| Hosts               | `benchfinity.com`, `www.benchfinity.com`                                                                                                                  |
| TLS                 | cert-manager `Certificate`, ClusterIssuer `letsencrypt-production`                                                                                        |
| Postgres            | Zalando CR `benchfinity-postgres`, v17, 3 instances + pooler; db `benchfinity`; users `benchfinity-dba` (super), `benchfinity` (login); `local-path` 10Gi |
| Object store        | MinIO StatefulSet (1 node), `local-path`; secret `benchfinity-minio-secrets`                                                                              |
| Backups             | B2 bucket `k8s-prod-backups`, prefix **`benchfinity-prod/`** (postgres + minio)                                                                           |
| NAS (proxy)         | `10.120.149.4`                                                                                                                                            |
| Proxy SNIs          | `dsm,calendar,chat,contacts,drive,file,mail.benchfinity.com`                                                                                              |
| API (parked)        | `benchfinity-api`, `replicas: 0`, image TBD (#1), port 8000, `/qqq-api/health`                                                                            |

## Workbench-CD repo layout

```
base/
  benchfinity-web-{deployment,service,ingress,certificate,pdb}.yaml   # LIVE
  benchfinity-api-{deployment,service,configmap,serviceaccount}.yaml  # PARKED replicas:0
  benchfinity-postgres.yaml                       # Zalando postgresql CR
  benchfinity-redis-sentinel-{configmap,statefulset,service}.yaml
  benchfinity-minio-{statefulset,service}.yaml    # no ingress (internal; no consumer yet)
  postgres-b2-backup-cronjob.yaml                 # -> k8s-prod-backups/benchfinity-prod/postgres/
  minio-b2-backup-cronjob.yaml                    # -> k8s-prod-backups/benchfinity-prod/minio/<bucket>/
  kustomization.yaml
overlays/production/kustomization.yaml            # ns benchfinity-prod, images newTag 0.1.0, api CORS
proxy/  nas-{service,endpoints(10.120.149.4),ingressroutetcp,ingress-http}.yaml
.github/workflows/validate.yml                    # GH Actions CI
README.md  CLAUDE.md  .gitleaks.toml
```

The api HPA + PDB are deferred until the api goes live (an HPA would scale a
parked `replicas:0` deployment onto a placeholder image).

## app-of-apps additions (KofTwentyTwo/k8s-app-of-apps)

```
apps/benchfinity/base/{application.yaml,infra-application.yaml,kustomization.yaml}  # OVERRIDE templates
apps/benchfinity/overlays/production/{kustomization.yaml,proxy-application.yaml}    # benchfinity-prod + benchfinity-proxy
shared/benchfinity-project.yaml            # AppProject: srcRepos Workbench-CD + app-of-apps; dests benchfinity-prod, benchfinity-proxy, in-cluster; CRD whitelist Namespace + ClusterIssuer
shared/repo-creds-workbench-cd.yaml        # sealed SSH deploy key (argocd ns on k8s-infra)
infra/benchfinity/overlays/production/{benchfinity-minio-secrets-sealed.yaml,b2-backup-credentials-sealed.yaml,kustomization.yaml}
envs/production/kustomization.yaml         # += apps/benchfinity/overlays/production/
```

The `application.yaml` sources `git@github.com:BenchFinity/Workbench-CD.git`
`path: overlays/production`; `infra-application.yaml` (sync-wave `-1`) sources
the app-of-apps `infra/benchfinity/overlays/production`.

## Secrets (all sealed in-cluster via kubeseal)

| Secret (ns)                                      | Keys                       | Source                                                                             |
| ------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------- |
| `benchfinity-minio-secrets` (`benchfinity-prod`) | `MINIO_ROOT_USER/PASSWORD` | generated, sealed                                                                  |
| `b2-backup-credentials` (`benchfinity-prod`)     | `B2_KEY_ID/B2_APP_KEY`     | reuse fleet key, sealed; writes prefix `benchfinity-prod/`                         |
| `repo-creds-workbench-cd` (`argocd`@`k8s-infra`) | `sshPrivateKey,url,type`   | generated ed25519; public half = repo deploy key                                   |
| postgres user creds                              | —                          | operator-generated (`*.benchfinity-postgres.credentials.postgresql.acid.zalan.do`) |

1Password vault `benchfinity-prod` is the canonical plaintext record.

## CI (GitHub Actions, `.github/workflows/validate.yml`)

On PR and push to `main`: `kustomize build overlays/production` and
`kustomize build proxy`; `kubeconform -strict -ignore-missing-schemas`
(blocking); `gitleaks detect` (blocking); `kube-linter` + `yamllint` (advisory).
Mirrors the fleet's Munitor checks. The app-of-apps changes are validated by
that repo's existing CircleCI/Munitor.

## Sequence

1. **Prereq (workbench):** PR `develop` to `main` to cut `v0.1.0` and publish
   `ghcr.io/benchfinity/workbench:0.1.0`.
2. Create private `BenchFinity/Workbench-CD`; scaffold
   `base/`+`overlays/production`+`proxy/`+CI; pin `:0.1.0`.
3. Seal `benchfinity-minio-secrets` (generate), `repo-creds-workbench-cd`
   (generate keypair + add deploy key), `b2-backup-credentials` (fleet key).
4. PR the app-of-apps additions (apps/shared/infra/envs).
5. Merge both; Argo CD materializes `benchfinity-prod` + `benchfinity-proxy`.
   Verify HTTPS load + STL/3MF export at `benchfinity.com`; verify the Synology
   subdomains route through the proxy.
6. Correct stale workbench docs (`DEPLOY.md`: image is public; supersede the
   example `deploy/argocd/application.yaml`).

## Open / deferred

- `benchfinity-api` image + ConfigMap finalize — Phase A, #1.
- dev/staging environments — add when the backend needs them.
- Export-artifact storage (#3): MinIO is up; confirm the backend targets it
  versus an external S3 before relying on it.

```

```
