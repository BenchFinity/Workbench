# ADR 0001: Distroless Chainguard/Wolfi base images for all service images

- Status: Accepted
- Date: 2026-05-29

## Context

Our container runtime images previously used Alpine-based bases (for the
frontend, `nginxinc/nginx-unprivileged:1.27-alpine`) and patched OS-package CVEs
at build time with `apk --no-cache upgrade`. That approach has drawbacks:

- The pinned base lags upstream OS-package fixes, so image scans block on known
  CVEs until we manually re-patch.
- `apk upgrade` runs as root during build, adds a layer, and makes the image
  non-reproducible (you get whatever the mirror serves that day).
- Alpine ships a full shell and package manager, enlarging the attack surface.
- Alpine uses musl libc. Several of our future workloads — Node native addons
  and the JVM (the QQQ/Java backend) — are happier on glibc.

## Decision

Standardize on Chainguard/Wolfi distroless images for all service runtime
images:

- Frontend (now): `cgr.dev/chainguard/nginx`
- Future Node services: `cgr.dev/chainguard/node`
- Future Java/QQQ backend: `cgr.dev/chainguard/jre`

Multi-stage builds keep toolchain-heavy stages (e.g. `node:22-alpine` for the
frontend build) out of the final image; only the distroless runtime ships.

## Rationale

- Smallest practical runtime: no shell, no package manager, no extra tooling.
- glibc-based, so it works for Node native addons and the JVM (unlike musl).
- Minimal attack surface: nothing to drop into, nothing to exploit via a shell
  or package manager.
- Daily-rebuilt by Chainguard with near-zero CVEs, so scans stay green without
  build-time `apk upgrade` hacks. The frontend image currently scans with 0
  CVEs (Trivy, all severities).

## Consequences

- No in-container debugging shell. Use ephemeral debug containers, orchestrator
  logs, and HTTP probes instead.
- No container `HEALTHCHECK` (no `wget`/shell). Health is delegated to
  orchestrator probes: the Helm chart uses `httpGet`; the compose frontend
  service has no healthcheck.
- Bases are pinned by digest (e.g.
  `cgr.dev/chainguard/nginx:latest@sha256:...`) for reproducibility. Refresh via
  Dependabot/Renovate or a manual
  `docker buildx imagetools inspect cgr.dev/chainguard/nginx:latest`.

This supersedes the Alpine + `apk --no-cache upgrade` approach.
