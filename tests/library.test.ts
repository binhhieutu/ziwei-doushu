import { describe, expect, it } from 'vitest';
import { normalizeLibraryQuery } from '../lib/i18n/library';
describe('normalizeLibraryQuery', () => {
  it('accepts a trimmed query and limits its length', () => {
    expect(normalizeLibraryQuery('  紫微  ')).toBe('紫微');
    expect(normalizeLibraryQuery('x'.repeat(200))).toHaveLength(160);
  });
  it('rejects non-string values including repeated query parameters', () => {
    expect(normalizeLibraryQuery(['紫微', '天机'])).toBe('');
    expect(normalizeLibraryQuery(undefined)).toBe('');
  });
});
