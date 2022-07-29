# GH Dynamic Assignee

This GH action inspects the `MAINTAINER.txt` file, expecting a single GitHub
user handle. It makes sure that all PRs in the archive with the label `Ready to Merge` are assigned to the maintainer in the aforementioned file.

This GH Action reacts to two different events:

1. Label assignment to a PR,
2. Push to `master` branch.

For the first type of event, if the `Ready to Merge` label is assigned, the
`MAINTAINER.txt` file is read (if it exists) and the contained Github User ID is
assigned to the PR (and the other assignments cleared).

For type 2, when the `master` branch is merged to, and the `MAINTAINER.txt` file has been changed, all open PRs with the label `Ready to Merge` are assigned to the maintainer in the aforementioned file and other assignments cleared.

## How to setup up

Create a workflow file in your project under `.github/workflows/gh-dynamic-assignee.yml`. The file should look
like this:

```yaml
name: GH Dynamic Assignee
on:
  pull_request:
    types:
      - labeled
  push:
    branches:
      - master
concurrency: ci-${{ github.repository }}
jobs:
  dynamic-assignee:
    runs-on: ubuntu-latest
    steps:
      - name: GH Dynamic Assignee
        uses: ExodusMovement/gh-dynamic-assignee@v0.0.1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          label_name: 'Ready to Merge'
```

Obviously, make sure you use the latest version of the GH Dynamic Assignee
GH Action.
