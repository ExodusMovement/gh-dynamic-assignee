import { ownersForFile, parseCodeowners } from './codeowners';
import type { GitHubClient } from './github';

export type Selection = 'load-balance' | 'all';

export interface Logger {
  info(message: string): void;
  warning(message: string): void;
}

export interface RouteContext {
  org: string;
  repo: string;
  pr: number;
  teamMembers: string[];
  selection: Selection;
}

const unique = (items: string[]): string[] => [...new Set(items)];

export async function resolveCandidates(
  client: GitHubClient,
  ctx: RouteContext,
  log: Logger,
): Promise<string[]> {
  const { org, repo, pr, teamMembers } = ctx;

  const files = await client.listPrFiles(org, repo, pr);
  if (files.length === 0) return [];

  const codeowners = await client.getCodeowners(org, repo);
  if (codeowners === null) return [];

  const rules = parseCodeowners(codeowners);
  const tokens = unique(files.flatMap((file) => ownersForFile(file, rules)));

  const expanded: string[] = [];
  for (const token of tokens) {
    const name = token.replace(/^@/, '');
    if (name.includes('/')) {
      const [teamOrg, teamSlug] = name.split('/');
      try {
        expanded.push(...(await client.listTeamMembers(teamOrg, teamSlug)));
      } catch (error) {
        log.warning(`Could not read owner team ${name}: ${(error as Error).message}`);
      }
    } else {
      expanded.push(name);
    }
  }

  const members = new Set(teamMembers);
  return unique(expanded).filter((login) => members.has(login));
}

export async function selectAssignees(
  client: GitHubClient,
  ctx: RouteContext,
  candidates: string[],
): Promise<string[]> {
  if (ctx.selection === 'all') return candidates;

  let best = candidates[0];
  let bestLoad = Infinity;
  for (const login of candidates) {
    const load = await client.countOpenAssignedPrs(ctx.org, ctx.repo, login);
    if (load < bestLoad) {
      best = login;
      bestLoad = load;
    }
  }
  return [best];
}

export async function routePr(client: GitHubClient, ctx: RouteContext, log: Logger): Promise<string[]> {
  let candidates = await resolveCandidates(client, ctx, log);
  if (candidates.length === 0) {
    log.info('No team member owns the changed files; falling back to the whole team');
    candidates = ctx.teamMembers;
  }

  const assignees = await selectAssignees(client, ctx, candidates);
  await client.addAssignees(ctx.org, ctx.repo, ctx.pr, assignees);
  log.info(`Assigned PR #${ctx.pr} to ${assignees.join(', ')}`);
  return assignees;
}
