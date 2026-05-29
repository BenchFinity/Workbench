# Contributing to Benchfinity

Benchfinity is a TypeScript, React, and Vite app for generating Gridfinity-compatible workbench baseplates. Contributions should keep the existing V1 generator stable while moving the Workbench roadmap forward through GitHub Issues.

## Development Setup

Prerequisites:

- Node.js 22 or newer
- npm
- Git

Commands:

```bash
npm install
npm run test
npm run build
npm audit
```

Use `npm run dev` for local browser verification.

## Workflow

- Work from an issue when possible.
- Branch from `develop` using `feature/{issue-number}-{short-description}`.
- Keep pull requests focused and small enough to review.
- Use conventional commit subjects.
- Do not use the Bambu Studio CLI for automated validation on this project. Validate 3MF behavior through tests, package inspection, and manual GUI import when needed.

## Quality Bar

- Keep `npm run test`, `npm run build`, and `npm audit` green.
- Preserve existing STL, ZIP, 3MF, geometry, and preview behavior unless the issue explicitly changes it.
- Add focused tests for geometry, export, validation, and persistence behavior when touched.
- Keep `src/App.tsx` centered on top-level state and orchestration. Use `src/components`, `src/geometry`, and `src/export` for focused implementation.

## Legal

By contributing, you agree that your contribution is your original work, that you have the right to submit it, and that it can be distributed under this repository's license.
