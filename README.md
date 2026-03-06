# GH Dynamic Assignee

A lightweight GitHub Action that automatically assigns pull requests to a designated maintainer.

## How It Works

1. Create a `MAINTAINER.txt` file in your repository root containing a single GitHub username
2. Configure the action to run on PR label events and/or pushes
3. When triggered, PRs are automatically assigned to the maintainer

### Triggers

| Event | Behavior |
|-------|----------|
| `pull_request` with `labeled` action | Assigns that PR to the maintainer |
| `push` | Removes previous maintainer and assigns new maintainer on all open labeled PRs |

> [!TIP]
> On `push` events, utilize the `paths:` filter in your calling workflow to only run when `MAINTAINER.txt` changes. See the example workflow below.

## Usage

### 1. Create `MAINTAINER.txt`

Add a file named `MAINTAINER.txt` to your repository root with the maintainer's GitHub username:

```
octocat
```

### 2. Create Workflow

Create `.github/workflows/assign-maintainer.yml`:

```yaml
name: Assign PRs to Maintainer

on:
  pull_request:
    types: [labeled]
  push:
    branches: [master]
    paths: ['MAINTAINER.txt']  # Only trigger when maintainer changes

permissions:  # Required permissions for GITHUB_TOKEN
  contents: read
  pull-requests: write

jobs:
  assign:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ExodusMovement/gh-dynamic-assignee@v2
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Customize Label (Optional)

By default, the action triggers on the "Ready to Merge" label. To use a different label:

```yaml
- uses: ExodusMovement/gh-dynamic-assignee@v2
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    label_name: 'needs-review'
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github_token` | Yes | - | GitHub token with PR write permissions |
| `label_name` | No | `Ready to Merge` | Label that triggers assignment |

## Permissions

The `GITHUB_TOKEN` needs the following permissions:

```yaml
permissions:
  pull-requests: write
  contents: read
```
