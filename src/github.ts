export interface GitHubClient {
  listTeamMembers(org: string, teamSlug: string): Promise<string[]>;
  listPrFiles(owner: string, repo: string, pr: number): Promise<string[]>;
  getCodeowners(owner: string, repo: string): Promise<string | null>;
  addAssignees(owner: string, repo: string, pr: number, logins: string[]): Promise<void>;
  countOpenAssignedPrs(owner: string, repo: string, login: string): Promise<number>;
}

const CODEOWNERS_PATHS = ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS'];

export function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  for (const part of linkHeader.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/);
    if (match) return match[1];
  }
  return null;
}

export function createGitHubClient(token: string, apiBase = 'https://api.github.com'): GitHubClient {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'gh-dynamic-assignee',
  };

  async function request(url: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(url, { ...init, headers: { ...headers, ...init?.headers } });
    if (!res.ok) {
      throw new Error(`GitHub API ${res.status} ${init?.method ?? 'GET'} ${url}: ${await res.text()}`);
    }
    return res;
  }

  async function paginate<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    let next: string | null = `${apiBase}${path}`;
    while (next) {
      const res = await request(next);
      items.push(...((await res.json()) as T[]));
      next = parseNextLink(res.headers.get('link'));
    }
    return items;
  }

  return {
    async listTeamMembers(org, teamSlug) {
      const members = await paginate<{ login: string }>(
        `/orgs/${org}/teams/${teamSlug}/members?per_page=100`,
      );
      return members.map((m) => m.login);
    },

    async listPrFiles(owner, repo, pr) {
      const files = await paginate<{ filename: string }>(
        `/repos/${owner}/${repo}/pulls/${pr}/files?per_page=100`,
      );
      return files.map((f) => f.filename);
    },

    async getCodeowners(owner, repo) {
      for (const path of CODEOWNERS_PATHS) {
        const res = await fetch(`${apiBase}/repos/${owner}/${repo}/contents/${path}`, { headers });
        if (res.status === 404) continue;
        if (!res.ok) {
          throw new Error(`GitHub API ${res.status} GET contents/${path}: ${await res.text()}`);
        }
        const body = (await res.json()) as { content: string; encoding: string };
        return Buffer.from(body.content, body.encoding as BufferEncoding).toString('utf8');
      }
      return null;
    },

    async addAssignees(owner, repo, pr, logins) {
      await request(`${apiBase}/repos/${owner}/${repo}/issues/${pr}/assignees`, {
        method: 'POST',
        body: JSON.stringify({ assignees: logins }),
      });
    },

    async countOpenAssignedPrs(owner, repo, login) {
      const query = `repo:${owner}/${repo} type:pr state:open assignee:${login}`;
      const res = await request(`${apiBase}/search/issues?q=${encodeURIComponent(query)}&per_page=1`);
      const body = (await res.json()) as { total_count: number };
      return body.total_count;
    },
  };
}
