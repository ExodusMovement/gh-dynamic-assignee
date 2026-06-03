import { readFileSync } from 'node:fs';

import * as core from '@actions/core';

import { createGitHubClient } from './github';
import { routePr } from './route';

interface PullRequestEvent {
  action?: string;
  label?: { name?: string };
  pull_request?: { number?: number };
}

async function run(): Promise<void> {
  const token = core.getInput('github_token', { required: true });
  const team = core.getInput('team', { required: true });
  const labelName = core.getInput('label_name') || 'Ready to Merge';
  const selection = core.getInput('selection') || 'load-balance';
  if (selection !== 'load-balance' && selection !== 'all') {
    throw new Error(`Invalid selection '${selection}'; expected 'load-balance' or 'all'`);
  }

  const eventName = process.env.GITHUB_EVENT_NAME;
  if (eventName !== 'pull_request' && eventName !== 'pull_request_target') {
    core.info(`Unsupported event '${eventName}'; nothing to do`);
    return;
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH is not set');
  const event = JSON.parse(readFileSync(eventPath, 'utf8')) as PullRequestEvent;

  if (event.action !== 'labeled' || event.label?.name !== labelName) {
    core.info(`Skipping: '${event.action}'/'${event.label?.name}' does not match label '${labelName}'`);
    return;
  }

  const pr = event.pull_request?.number;
  if (!pr) throw new Error('Event payload has no pull_request.number');

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) throw new Error('GITHUB_REPOSITORY is not set');
  const [org, repo] = repository.split('/');

  const [teamOrg, teamSlug] = team.includes('/') ? team.split('/') : [org, team];

  const client = createGitHubClient(token);
  const teamMembers = await client.listTeamMembers(teamOrg, teamSlug);
  if (teamMembers.length === 0) {
    throw new Error(`Team ${teamOrg}/${teamSlug} has no readable members — token needs org Members:read`);
  }

  await routePr(client, { org, repo, pr, teamMembers, selection }, core);
}

run().catch((error) => core.setFailed((error as Error).message));
