# Project Branch Model

## Branch Structure

- `master`
- `snapshots/*` (including `feature/*`, `fix/*`, etc.)
- `releases/latest`
- `releases/v*`

## Branch Descriptions

### Main Branch

The `master` branch is our blessed branch, has the latest code and documentation.

### Working Branches

`snapshots/*`, `feature/*`, `fix/*`, and other similar branches are used as working branches for ongoing development.

### Release Branches

- `releases/v*`: Specific version release branches
- `releases/latest`: Always points to the latest release branch

## Workflow

1. Development occurs in working branches (`snapshots/*`, `feature/*`, `fix/*`, etc.).

2. Periodic pull requests are created from working branches to `master`, allowing team members to review changes and update corresponding documents.

3. After `master` is updated, working branches are rebased onto `master` to continue development.

4. For public releases:
   - Version number is bumped
   - Changes are merged into `releases/v*` branches

5. Cloudflare tracks all `releases/*` branches, building and hosting documentation for each version.

6. The `releases/latest` branch is updated to reference the most recent release, ensuring the latest documentation is always available.

