# CLAUDE.md

Benchfinity (org `BenchFinity`, repo `workbench`) is a client-only Vite + React + TypeScript + Three.js app that generates Gridfinity-compatible baseplates and exports STL, split ZIP, and Bambu Studio-style 3MF files. This file is the policy layer for agents and contributors; `AGENTS.md` is the operational guide and the source of truth for required startup reads, commands, validation rules, and architecture boundaries. Read `AGENTS.md` first.

## Naming

- The product and repo brand is `Benchfinity`. The org is `BenchFinity`. `KofTwentyTwo` is a personal handle, not the brand.
- `Gridfinity` and `Tracefinity` are compatibility references, never the product name. Describe output as "Gridfinity-compatible", verified against the external Tracefinity standard.

## Workflow

- Default branch is `develop` (gitflow). Do not commit to `main` or `develop`; work on a `feature/<desc>` branch and open PRs into `develop`.
- Roadmap work is tracked in GitHub Issues under the `Workbench VNext` and `Repository Foundation` milestones (#1-#9). A ticket is optional for small personal work; when one applies, reference it in the PR and commit body (`Refs #6`, `Closes #9`).
- Conventional commits, GPG-signed. No AI attribution in commit messages or content. No emojis.

## Hard constraint (issue #5)

The V1 generator core (`src/geometry/*`, `src/validation.ts`, `src/export/*`) is pure and free of React, DOM, and storage. Preserve it as the first Workbench item type during VNext: wrap it behind the persistence layer rather than rewriting the geometry/export math. The serializable design unit is `BaseplateDesign` (`src/design.ts`, carries `schemaVersion`); persist `PlateInput` and the derived `PlateLayout`, never the Three.js meshes (recompute those on load).

## Gates

`npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test`, and `npm run build` must all pass; CI enforces them on every PR. The current test baseline is 34.
