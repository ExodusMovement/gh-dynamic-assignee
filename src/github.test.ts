import { describe, expect, it } from 'vitest';

import { parseNextLink } from './github';

describe('parseNextLink', () => {
  it('returns null when header is absent', () => {
    expect(parseNextLink(null)).toBeNull();
  });

  it('extracts the next link from a multi-rel header', () => {
    const header =
      '<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=5>; rel="last"';
    expect(parseNextLink(header)).toBe('https://api.github.com/x?page=2');
  });

  it('returns null when there is no next rel', () => {
    expect(parseNextLink('<https://api.github.com/x?page=1>; rel="prev"')).toBeNull();
  });
});
