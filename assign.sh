#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f "MAINTAINER.txt" ]]; then
  echo "[error] MAINTAINER.txt not found in repository root"
  exit 1
fi
MAINTAINER=$(tr -d '[:space:]' < MAINTAINER.txt)

if [[ -z "$MAINTAINER" ]]; then
  echo "[error] MAINTAINER.txt is empty"
  exit 1
fi

echo "Maintainer: $MAINTAINER"

if [[ "$EVENT_NAME" == "pull_request" || "$EVENT_NAME" == "pull_request_target" ]]; then
  if [[ "$LABEL_ACTION" == "labeled" && "$LABEL_APPLIED" == "$LABEL_NAME" ]]; then
    echo "Label event: assigning PR #$PR_NUMBER to $MAINTAINER"
    gh pr edit "$PR_NUMBER" --add-assignee "$MAINTAINER"
    echo "✓ Assigned PR #$PR_NUMBER to $MAINTAINER"
  else
    echo "Skipping: label action '$LABEL_ACTION' or label '$LABEL_APPLIED' doesn't match"
  fi
  exit 0
fi

if [[ "$EVENT_NAME" == "push" ]]; then
  echo "Push event: reassigning all labeled PRs to $MAINTAINER"

  PREVIOUS_MAINTAINER=$(git show HEAD~1:MAINTAINER.txt 2>/dev/null | tr -d '[:space:]' || true)

  if [[ -n "$PREVIOUS_MAINTAINER" && "$PREVIOUS_MAINTAINER" != "$MAINTAINER" ]]; then
    echo "Maintainer changed: $PREVIOUS_MAINTAINER → $MAINTAINER"
  fi

  PR_NUMBERS=$(gh pr list --label "$LABEL_NAME" --state open --json number --jq '.[].number')

  if [[ -z "$PR_NUMBERS" ]]; then
    echo "No open PRs found with label '$LABEL_NAME'"
    exit 0
  fi

  while IFS= read -r pr_num; do
    echo "Reassigning PR #$pr_num to $MAINTAINER"
    if [[ -n "$PREVIOUS_MAINTAINER" && "$PREVIOUS_MAINTAINER" != "$MAINTAINER" ]]; then
      gh pr edit "$pr_num" --remove-assignee "$PREVIOUS_MAINTAINER" 2>/dev/null || true
    fi
    gh pr edit "$pr_num" --add-assignee "$MAINTAINER"
  done <<< "$PR_NUMBERS"

  COUNT=$(echo "$PR_NUMBERS" | wc -l | tr -d ' ')
  echo "✓ Reassigned $COUNT PR(s) to $MAINTAINER"
  exit 0
fi

echo "[warning] Unhandled event type: $EVENT_NAME"
