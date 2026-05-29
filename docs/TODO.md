# TODO

## Gridfinity Baseplate Generator

- [x] Choose canonical v1 Gridfinity baseplate geometry: Tracefinity-compatible standard Gridfinity.
- [x] Decide default sizing behavior: exact requested envelope with centered grid and equal perimeter padding.
- [x] Decide v1 split connector: edge-open underside connector notches with separate printed spline keys.
- [x] Decide Tracefinity preset magnet behavior: on by default, configurable off.
- [x] Scaffold the TypeScript web app.
- [x] Implement centered padded envelope sizing and unit conversion.
- [x] Implement bed-fit validation and split layout.
- [x] Render a 3D preview from generated tile mesh data.
- [x] Export single-plate STL.
- [x] Export split-plate ZIP with manifest.
- [x] Add printer bed presets with Custom manual entry.
- [x] Add project name input for export filenames and bundle metadata.
- [x] Add settings dialog for saved defaults in local storage.
- [x] Add open-bottom lightweight print mode.
- [x] Export 3MF for direct Bambu Studio import.
- [x] Add tests for sizing, splitting, manifests, and preview/export smoke paths.

## Benchfinity Workbench Next Phase

The Workbench backlog now lives in GitHub Issues under the `Workbench VNext` milestone and the `Benchfinity Roadmap` GitHub Project.

- [ ] #1 Confirm Workbench backend repo and app shape.
- [ ] #2 Define Workbench persistence model.
- [ ] #3 Decide export artifact storage.
- [ ] #4 Build signed-in Workbench app shell.
- [ ] #5 Preserve V1 generator as first Workbench item type.
- [ ] #6 Persist baseplate design inputs and derived metadata.
- [ ] #7 Add export history and download actions.
- [ ] #8 Add Workbench backend and frontend test coverage.

## Repository Foundation

- [x] #9 Prepare public repo, container CI, and releases. Done, plus: AGPL-3.0 + DCO; Helm/compose/ArgoCD + chart publishing; HIGH+ security gates (npm audit, dependency-review, Trivy image-scan, CodeQL); distroless Chainguard images (build + runtime); branch protection (review + CODEOWNERS + signed + linear); Dependabot npm/actions/docker.

## Open Pull Requests (triage next session)

- [ ] #16 HELD: npm-dev group (TS 5->6, Vite 6->8, plugin-react 4->6) fails `validate`; needs a dedicated migration, not an auto-merge.
- [ ] #24-#27: routine CI action bumps (setup-helm, docker/login, codeql-action, checkout).
