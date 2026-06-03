export interface CodeownersRule {
  pattern: string;
  re: RegExp;
  owners: string[];
}

// Sentinels protect inserted regex fragments from the subsequent `*` substitution.
const GLOBSTAR_SLASH = String.fromCharCode(1);
const SLASH_GLOBSTAR = String.fromCharCode(2);
const GLOBSTAR = String.fromCharCode(3);

export function patternToRegExp(pattern: string): RegExp {
  let p = pattern.trim();

  let anchored = false;
  if (p.startsWith('/')) {
    anchored = true;
    p = p.slice(1);
  }

  let dir = false;
  if (p.endsWith('/')) {
    dir = true;
    p = p.slice(0, -1);
  }

  if (p.includes('/')) anchored = true;

  const lastSegment = p.slice(p.lastIndexOf('/') + 1);

  const body = p
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replaceAll('**/', GLOBSTAR_SLASH)
    .replaceAll('/**', SLASH_GLOBSTAR)
    .replaceAll('**', GLOBSTAR)
    .replaceAll('*', '[^/]*')
    .replaceAll(GLOBSTAR_SLASH, '(?:.*/)?')
    .replaceAll(SLASH_GLOBSTAR, '/.*')
    .replaceAll(GLOBSTAR, '.*');

  const prefix = anchored ? '^' : '^(?:.*/)?';

  let suffix: string;
  if (dir) suffix = '/.*$';
  else if (lastSegment.includes('*')) suffix = '$';
  else suffix = '(?:/.*)?$';

  return new RegExp(prefix + body + suffix);
}

export function parseCodeowners(text: string): CodeownersRule[] {
  const rules: CodeownersRule[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (line === '') continue;
    const [pattern, ...owners] = line.split(/\s+/);
    rules.push({ pattern, re: patternToRegExp(pattern), owners });
  }
  return rules;
}

export function ownersForFile(file: string, rules: CodeownersRule[]): string[] {
  let owners: string[] = [];
  for (const rule of rules) {
    if (rule.re.test(file)) owners = rule.owners;
  }
  return owners;
}
