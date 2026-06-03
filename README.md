# GH Dynamic Assignee

A GitHub Action that, when a label is applied to a pull request, assigns it to the relevant
member(s) of a team — derived from your `CODEOWNERS` file.

## How it works

When the trigger label is added to a PR, the action:

1. Reads the PR's changed files and resolves their owners from `CODEOWNERS` (last matching pattern wins).
2. Expands any team owners (`@org/team`) to their members.
3. Intersects those owners with the configured `team` — only members of that team are eligible.
4. Assigns the PR:
   - `load-balance` (default): the eligible member with the fewest open assigned PRs.
   - `all`: every eligible member.
5. If no eligible member owns the changed files, it falls back to load-balancing across the whole team.

## Usage

```yaml
name: Assign PRs

on:
  pull_request:
    types: [labeled]

permissions:
  contents: read
  pull-requests: write

jobs:
  assign:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/create-github-app-token@v3
        id: app-token
        with:
          app-id: ${{ vars.APP_ID }}
          private-key: ${{ secrets.APP_PRIVATE_KEY }}
          permission-members: read
          permission-contents: read
          permission-pull-requests: write
      - uses: octo-org/gh-dynamic-assignee@v3
        with:
          team: octo-org/maintainers
          github_token: ${{ steps.app-token.outputs.token }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `team` | Yes | — | Team to route within, as `org/team-slug` or `team-slug` (org defaults to the repo owner) |
| `github_token` | Yes | — | Token with the permissions below |
| `label_name` | No | `Ready to Merge` | Label that triggers assignment |
| `selection` | No | `load-balance` | `load-balance` or `all` |

## Token permissions

Listing a (closed) team's members requires more than the default `GITHUB_TOKEN`. Use a token —
typically a GitHub App token — with:

- Organization **Members: read**
- Repository **Pull requests: write**
- Repository **Contents: read** (to read `CODEOWNERS`)

## Development

```bash
npm ci
npm run typecheck
npm test
npm run build   # bundles src/ into dist/index.js (committed)
```

CI verifies that `dist/` is in sync with the source.
