# Workbench VNext Requirements

## Goal
Turn the v1 single-purpose browser generator into a QQQ-backed Workbench where signed-in users can manage accounts, projects, generated baseplates, export history, and reusable printer/settings profiles.

## Product Shape
VNext should preserve the fast v1 generation flow, but add persistence and navigation around it.

- Users belong to an account.
- Accounts contain projects.
- Projects contain workbench items, starting with Gridfinity baseplate designs.
- Designs store the full generator input model, derived layout, export metadata, and preview state.
- Exports become versioned artifacts that can be downloaded again without regenerating.
- Local-only generation remains useful for quick trials, but save/export history requires sign-in.

## Account And Project Model

### Account
Represents the billing/security boundary, even if billing is deferred.

- `id`
- `name`
- `slug`
- `createdAt`
- `updatedAt`
- default units and printer profile

### User
Represents a person who can sign in.

- `id`
- `email`
- `displayName`
- `createdAt`
- `updatedAt`
- last active account

### Account Membership
Joins users to accounts.

- `accountId`
- `userId`
- `role`: `owner`, `admin`, `member`, `viewer`
- `createdAt`
- invite state if invitation flow is included in MVP

### Project
Organizes related generated designs.

- `id`
- `accountId`
- `name`
- `slug`
- `description`
- `createdByUserId`
- `createdAt`
- `updatedAt`
- archived flag

### Workbench Item
Generic project-scoped thing. VNext starts with baseplates, but the model should not block future generators.

- `id`
- `accountId`
- `projectId`
- `type`: initially `gridfinityBaseplate`
- `name`
- `status`: `draft`, `ready`, `archived`
- `createdByUserId`
- `updatedByUserId`
- `createdAt`
- `updatedAt`

### Baseplate Design
Typed payload for the existing generator state.

- `workbenchItemId`
- requested finished width/depth and unit
- cell pitch and Gridfinity profile
- envelope mode
- magnet and lightweight settings
- selected printer profile or custom bed dimensions
- split plan and connector settings
- derived dimensions, tile count, warnings, and validation state
- preview camera/view options if worth preserving

### Export Artifact
Versioned generated output.

- `id`
- `workbenchItemId`
- `exportType`: `stl`, `zip`, `3mf`
- `version`
- `filename`
- `contentType`
- `sizeBytes`
- `storageKey`
- generation input hash
- generation summary
- `createdByUserId`
- `createdAt`

## QQQ And Postgres Backend Concepts

Use QQQ for CRUD metadata, process actions, permissions, and admin-style screens. Use Postgres as the durable source of truth.

### QQQ Tables
- `account`
- `user`
- `account_membership`
- `project`
- `workbench_item`
- `baseplate_design`
- `printer_profile`
- `export_artifact`

### QQQ Processes
- `create_project`
- `duplicate_project`
- `archive_project`
- `save_baseplate_design`
- `duplicate_baseplate_design`
- `generate_export_artifact`
- `delete_export_artifact`
- `set_default_printer_profile`

### Postgres Notes
- Use UUID primary keys.
- Scope all project, item, design, profile, and artifact queries by `account_id`.
- Store generator inputs as structured columns for important filters plus a JSONB payload for versioned design settings.
- Store derived layout JSONB so the UI can load quickly before recomputing geometry.
- Add optimistic concurrency with `updated_at` or an integer revision on mutable workbench records.
- Keep artifact binary storage outside Postgres unless files are small enough for early MVP convenience. Persist metadata in Postgres either way.

### Security Rules
- Account membership controls all access.
- Owners/admins can manage account settings and members.
- Members can create and edit projects and workbench items.
- Viewers can read and download exports.
- Artifact download URLs should be short-lived if object storage is used.

## UI Navigation

### App Shell
- Left sidebar for account switcher, project list, and primary navigation.
- Top bar for current project/item name, save status, export action, and user menu.
- Main region for the active workbench.
- Right panel for settings, validation, dimensions, and export history.

### Primary Routes
- `/accounts`
- `/a/{accountSlug}/projects`
- `/a/{accountSlug}/p/{projectSlug}`
- `/a/{accountSlug}/p/{projectSlug}/items/{itemId}`
- `/a/{accountSlug}/settings`

### Project View
- Search and filter project items.
- Create new baseplate design.
- Duplicate, rename, archive, and open items.
- Show last modified time, printable size, tile count, and latest export type.

### Workbench Layout
- Center: 3D preview, using the existing mesh pipeline.
- Left or top control strip: core dimensions, printer preset, envelope mode, and profile.
- Right inspector: validation, derived dimensions, tile breakdown, connector settings, and export history.
- Bottom status area: warnings, unsaved changes, and generation progress.
- Export action should prefer 3MF, with STL and ZIP available based on split state.

## Entities

- Account: security and workspace boundary. MVP.
- User: signed-in person. MVP.
- Membership: account roles. MVP.
- Project: container for workbench items. MVP.
- Workbench Item: generic project item wrapper. MVP.
- Baseplate Design: Gridfinity generator state. MVP.
- Printer Profile: reusable bed/default settings. MVP.
- Export Artifact: downloadable generated file metadata. MVP.
- Activity Event: audit/history trail. Later.
- Billing Plan: commercial packaging. Later.
- Team Invite: user invitation workflow. Maybe.

## Phased Implementation

### Phase 1: Persistence Foundation
- Add QQQ/Postgres app skeleton.
- Define account, user, membership, project, workbench item, baseplate design, printer profile, and export artifact tables.
- Implement account-scoped security filters.
- Add seed/dev account and user support.
- Keep artifact generation client-side if that shortens the first slice.

### Phase 2: Project Workbench
- Add signed-in app shell.
- Add project list and project detail views.
- Add create, rename, duplicate, and archive flows.
- Save and load baseplate designs from the backend.
- Preserve the existing v1 generator behavior inside a workbench item.

### Phase 3: Export History
- Persist export metadata.
- Attach generated artifacts to a workbench item.
- Add export history panel with download links.
- Add input hash/version labeling so users can tell whether an export matches the current design.

### Phase 4: Server-Side Generation
- Move export generation to backend process if browser generation becomes too slow or artifact persistence requires trusted generation.
- Add job status, progress, retries, and failure messages.
- Store artifacts in object storage with Postgres metadata.

### Phase 5: Team And Operations
- Add invitation flow and membership management.
- Add account settings.
- Add activity events.
- Add operational dashboards for failed generation jobs and storage growth.

## Open Questions
- What identity provider should VNext use: QQQ-native auth, external OAuth, or a simple early access login?
- Should the first MVP allow multiple accounts per user, or start with exactly one account per user?
- Are exports generated in the browser and uploaded, or generated on the backend from saved design input?
- Where should artifacts live in MVP: Postgres byte storage, local filesystem, S3-compatible object storage, or browser download only?
- Should printer profiles be account-scoped, user-scoped, project-scoped, or a mix of system presets plus account overrides?
- Is collaboration real-time, last-write-wins, or locked to a single editor for MVP?
- What design payload versioning scheme is needed for compatibility as the geometry model changes?
- Should Workbench support anonymous drafts that can later be claimed by a signed-in account?

## MVP Acceptance Criteria
- A signed-in user can open the app, select an account, and create a project.
- A user can create a Gridfinity baseplate workbench item inside a project.
- The workbench loads the existing v1 controls, preview, validation, and export behavior.
- Saving persists generator inputs and derived design metadata to Postgres.
- Reloading the item restores the saved design and preview-relevant state.
- Project detail shows saved workbench items with name, type, modified date, size, tile count, and latest export status.
- A user can rename, duplicate, and archive a project item.
- A user can generate an export and see it in export history with filename, type, created time, and download action.
- Account membership prevents users from reading or writing projects outside their account.
- MVP includes basic tests for account scoping, project/item CRUD, design save/load, and export artifact metadata.
