export function normalizeLibraryQuery(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, 160) : '';
}
