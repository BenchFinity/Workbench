# PLAN: CD / Deployment Artifacts

## Goal

Give Benchfinity reproducible deployment paths: a local docker-compose stack, a
Helm chart for Kubernetes, an Argo CD Application example, and a CI job that
publishes the chart. Ship the frontend now; leave the future backend, Postgres,
and MinIO as disabled placeholders.

## Approach

- The frontend image is already built and pushed by `.github/workflows/ci.yml`
  to `ghcr.io/benchfinity/workbench`. These artifacts consume that image; no
  application source under `src/` changes.
- Local dev uses Compose profiles: default `docker compose up` runs only the
  frontend; `--profile full` adds backend + Postgres + MinIO.
- Kubernetes uses the Helm chart. The chart configures connections to
  cluster-provided Postgres/MinIO rather than bundling them as subcharts.
- Argo CD syncs the chart from the repo at `develop` (example manifest).
- CI gains a `helm` job that lints/templates on every push and publishes the
  chart to GHCR OCI on develop/main/tags.
- The repo (and GHCR image/chart) are private, so `imagePullSecrets` is
  supported in the chart and `docker login ghcr.io` is documented for compose.

## Files Added

- `compose.yaml`, `.env.example` - local stack and env template.
- `docker/security-headers.inc` - shared nginx security headers; `docker/nginx.conf`
  includes it in the server block and locations.
- `deploy/helm/benchfinity/` - Chart.yaml, values.yaml, and templates
  (serviceaccount, frontend deployment/service/HPA, backend deployment/service,
  ingress, NOTES, helpers).
- `deploy/argocd/application.yaml` - example Argo CD Application.
- `docs/DEPLOY.md` - deployment guide.
- `.github/workflows/ci.yml` - appended `helm` lint/template/publish job.
- `.prettierignore` - excludes Helm templates (Go template syntax is not YAML).

## Frontend-now / Backend-future Model

- Frontend: enabled by default, static SPA served by nginx on 8080.
- Backend: QQQ/Java REST API, `backend.enabled: false`, image TBD (#1).
- Postgres: required by the backend, external to the chart (cluster-provided).
- MinIO: optional object storage, external to the chart, `objectStore.enabled: false`.

## Open Questions

- Backend image and repository: confirmed by #1.
- Postgres delivery: vendor as a subchart/operator vs. continue assuming an
  external, cluster-provided instance.
- Public release: when the repo goes public, decide whether to make the GHCR
  image and chart public and drop the imagePullSecret requirement.
