import { describe, expect, it } from 'vitest';

import { ownersForFile, parseCodeowners, patternToRegExp } from './codeowners';

describe('patternToRegExp', () => {
  const cases: { pattern: string; matches: string[]; rejects: string[] }[] = [
    {
      pattern: 'app/widgets/',
      matches: ['app/widgets/a.js', 'app/widgets/x/y.js'],
      rejects: ['app/widgetsx', 'app/other/a.js'],
    },
    {
      pattern: 'app/widgets',
      matches: ['app/widgets', 'app/widgets/a.js'],
      rejects: ['app/widgetsx'],
    },
    {
      pattern: 'LICENSE',
      matches: ['LICENSE', 'a/b/LICENSE'],
      rejects: ['MYLICENSE'],
    },
    {
      pattern: 'app/config/*/settings.json',
      matches: ['app/config/dev/settings.json'],
      rejects: ['app/config/settings.json', 'app/config/dev/nested/settings.json'],
    },
    {
      pattern: 'app/config/*-settings.json',
      matches: ['app/config/dev-settings.json'],
      rejects: ['app/config/dev/x-settings.json'],
    },
    {
      pattern: '**/tool.config.js',
      matches: ['tool.config.js', 'a/b/tool.config.js'],
      rejects: ['tool.config.jsx'],
    },
    {
      pattern: 'packages/**/errors',
      matches: ['packages/errors', 'packages/a/errors', 'packages/a/b/errors'],
      rejects: ['packages/errorsx'],
    },
  ];

  for (const { pattern, matches, rejects } of cases) {
    const re = patternToRegExp(pattern);
    for (const file of matches) {
      it(`${pattern} matches ${file}`, () => {
        expect(re.test(file)).toBe(true);
      });
    }
    for (const file of rejects) {
      it(`${pattern} rejects ${file}`, () => {
        expect(re.test(file)).toBe(false);
      });
    }
  }
});

describe('parseCodeowners', () => {
  it('skips comments and blank lines, splits pattern from owners', () => {
    const rules = parseCodeowners(['# header', '', 'app/ @octocat', 'docs/ @acme/writers @octocat'].join('\n'));
    expect(rules).toHaveLength(2);
    expect(rules[0].pattern).toBe('app/');
    expect(rules[0].owners).toEqual(['@octocat']);
    expect(rules[1].owners).toEqual(['@acme/writers', '@octocat']);
  });
});

describe('ownersForFile (last match wins)', () => {
  const rules = parseCodeowners(
    ['app/widgets/ @acme/frontend', 'app/widgets/*/settings.json @acme/security'].join('\n'),
  );

  it('returns the later matching rule owners', () => {
    expect(ownersForFile('app/widgets/x/settings.json', rules)).toEqual(['@acme/security']);
  });

  it('returns the earlier rule when the later does not match', () => {
    expect(ownersForFile('app/widgets/x/index.js', rules)).toEqual(['@acme/frontend']);
  });

  it('returns empty when nothing matches', () => {
    expect(ownersForFile('README.md', rules)).toEqual([]);
  });
});
