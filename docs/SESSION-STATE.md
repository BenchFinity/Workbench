# Session State

**Last Updated:** 2026-05-29

## Current Status

V1 generator complete and the repo is public and hardened end-to-end (distroless images, HIGH+ CI/CD security gates, branch protection, AGPL-3.0). Everything is merged to `develop`; no work in progress. Ready to start Workbench VNext (#1).

## What Was Done This Session

- Brownfield review + cleanup (#18): ESLint/Prettier, tsconfig app/node split, CI lint/format/typecheck gates, dedup, UPPER_SNAKE consts, versioned `BaseplateDesign` + `applyPrinterToInput`, why-comments, project `CLAUDE.md`.
- CD (#19): Helm chart (`deploy/helm/benchfinity`), `compose.yaml` (frontend + `full` profile for backend/postgres/minio), ArgoCD example, CI publishes chart to `oci://ghcr.io/benchfinity/charts`.
- License (#20): Apache-2.0 -> AGPL-3.0-only + DCO; CodeQL workflow.
- Dependabot merged: #11-#15 (CI actions), #17 (prod: lucide 1.x, three 0.184).
- Security gates (#21): `npm audit --audit-level=high`, `dependency-review` (high), Trivy `image-scan` (fixable HIGH/CRITICAL) gating the docker publish.
- Distroless runtime (#22): frontend -> `cgr.dev/chainguard/nginx` (25MB, 0 CVEs, no shell, nonroot, digest-pinned). ADR `docs/adr/0001-distroless-base-images.md`.
- Build toolchain + Dependabot docker (#23): build stages -> `cgr.dev/chainguard/node:latest-dev` (glibc); Dependabot `docker` ecosystem keeps base digests patched.
- Repo became PUBLIC; enabled secret scanning + push protection + Dependabot security; org team `@BenchFinity/maintainers` owns via CODEOWNERS.

## Active Branches

| Branch    | Status                                          |
| --------- | ----------------------------------------------- |
| `develop` | default; everything above merged; CI green      |
| `main`    | protected; behind develop (gitflow); unreleased |

## Pending Work

- [ ] Triage open Dependabot PRs (routine CI action bumps): #24 setup-helm 4->5, #25 login-action 3->4, #26 codeql-action 3->4, #27 checkout 4->6. Note: `codeql.yml` / helm job still reference some `@v4` actions.
- [ ] #16 (HELD): npm-dev group = TS 5->6, Vite 6->8, plugin-react 4->6. Fails `validate` (TS2882: CSS side-effect import under TS 6). Needs a dedicated migration (add `vite/client` types, review Vite 8 config + plugin-react 6) - NOT an auto-merge.
- [ ] VNext #1: confirm QQQ/Postgres backend repo + app shape -> makes the chart/compose `backend` placeholder a real `chainguard/jre` service; then #2 persistence model.

## Key Reference

- Repo: `BenchFinity/Workbench` (PUBLIC). Default branch `develop`. Site: https://www.benchfinity.com
- Required checks on develop+main: `validate`, `image-scan`, `dependency-review`. Branch protection: 1 review + CODEOWNERS + signed commits + linear history + no force-push. Solo merges: `gh pr merge --squash --admin` (self-approval is blocked; admin bypasses only the review).
- Artifacts: image `ghcr.io/benchfinity/workbench:develop`; chart `oci://ghcr.io/benchfinity/charts/benchfinity`.
- Base-image standard: Chainguard/Wolfi distroless, glibc (ADR 0001) - frontend nginx now; future Node -> chainguard/node, Java/QQQ -> chainguard/jre. Security gates block HIGH+; Trivy uses `ignore-unfixed`.
- Pre-handoff verify: `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build` (34 tests green). Do NOT use the Bambu Studio CLI (crashes this machine); validate 3MF via tests + manual GUI import.
- `docs/AGENT-HANDOFF.md` and `docs/WORKBENCH-VNEXT.md` remain the product/next-phase source of truth.
