import { describe, expect, it } from 'vitest';

import type { GitHubClient } from './github';
import { routePr, type RouteContext, type Selection } from './route';

interface FakeConfig {
  files?: string[];
  codeowners?: string | null;
  teams?: Record<string, string[]>;
  loads?: Record<string, number>;
}

function makeClient(cfg: FakeConfig) {
  const assigned: string[][] = [];
  const client: GitHubClient = {
    async listTeamMembers(org, slug) {
      const key = `${org}/${slug}`;
      const teams = cfg.teams ?? {};
      if (!(key in teams)) throw new Error(`unknown team ${key}`);
      return teams[key];
    },
    async listPrFiles() {
      return cfg.files ?? [];
    },
    async getCodeowners() {
      return cfg.codeowners ?? null;
    },
    async addAssignees(_org, _repo, _pr, logins) {
      assigned.push(logins);
    },
    async countOpenAssignedPrs(_org, _repo, login) {
      return cfg.loads?.[login] ?? 0;
    },
  };
  return { client, assigned };
}

const noopLog = { info: () => {}, warning: () => {} };

function ctx(teamMembers: string[], selection: Selection = 'load-balance'): RouteContext {
  return { org: 'acme', repo: 'app', pr: 7, teamMembers, selection };
}

describe('routePr', () => {
  it('assigns the single team-member owner', async () => {
    const { client, assigned } = makeClient({
      files: ['app/widgets/index.js'],
      codeowners: 'app/widgets/ @octocat',
    });
    await routePr(client, ctx(['octocat']), noopLog);
    expect(assigned).toEqual([['octocat']]);
  });

  it('falls back to the whole team when the owner is not a team member', async () => {
    const { client, assigned } = makeClient({
      files: ['app/widgets/index.js'],
      codeowners: 'app/widgets/ @stranger',
      loads: { alice: 3, bob: 0 },
    });
    await routePr(client, ctx(['alice', 'bob']), noopLog);
    expect(assigned).toEqual([['bob']]);
  });

  it('expands an owner team and keeps only configured-team members', async () => {
    const { client, assigned } = makeClient({
      files: ['app/index.js'],
      codeowners: 'app/ @acme/frontend',
      teams: { 'acme/frontend': ['carol', 'octocat'] },
    });
    await routePr(client, ctx(['octocat']), noopLog);
    expect(assigned).toEqual([['octocat']]);
  });

  it('load-balances across multiple team-member owners', async () => {
    const { client, assigned } = makeClient({
      files: ['a/x.js', 'b/y.js'],
      codeowners: ['a/ @alice', 'b/ @bob'].join('\n'),
      loads: { alice: 5, bob: 1 },
    });
    await routePr(client, ctx(['alice', 'bob']), noopLog);
    expect(assigned).toEqual([['bob']]);
  });

  it('assigns all candidates when selection is "all"', async () => {
    const { client, assigned } = makeClient({
      files: ['a/x.js', 'b/y.js'],
      codeowners: ['a/ @alice', 'b/ @bob'].join('\n'),
    });
    await routePr(client, ctx(['alice', 'bob'], 'all'), noopLog);
    expect(assigned).toEqual([['alice', 'bob']]);
  });

  it('falls back when no CODEOWNERS rule matches', async () => {
    const { client, assigned } = makeClient({
      files: ['app/x.js'],
      codeowners: 'other/ @alice',
      loads: { alice: 0, bob: 2 },
    });
    await routePr(client, ctx(['alice', 'bob']), noopLog);
    expect(assigned).toEqual([['alice']]);
  });

  it('falls back when the PR has no changed files', async () => {
    const { client, assigned } = makeClient({
      files: [],
      loads: { alice: 1, bob: 0 },
    });
    await routePr(client, ctx(['alice', 'bob']), noopLog);
    expect(assigned).toEqual([['bob']]);
  });
});
