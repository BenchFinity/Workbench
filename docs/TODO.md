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

- [ ] Confirm backend repo/app shape for QQQ/Postgres.
- [ ] Define account, user, membership, project, workbench item, baseplate design, printer profile, and export artifact tables.
- [ ] Decide artifact storage for generated STL, ZIP, and 3MF files.
- [ ] Build the signed-in app shell with account/project navigation.
- [ ] Preserve the V1 generator as the first workbench item type.
- [ ] Persist baseplate design inputs and derived layout metadata.
- [ ] Add export history with download actions.
- [ ] Add backend and frontend tests for account scoping, project CRUD, design save/load, and export metadata.
