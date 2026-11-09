import type { MetadataRoute } from 'next';
import { ALL_BOOKS } from '@/lib/classics';
import { SITE_URL } from '@/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '',
    '/chart',
    '/heming',
    '/knowledge',
    '/library',
    '/privacy',
    '/terms',
    ...ALL_BOOKS.flatMap((b) => [
      `/library/${b.slug}`,
      ...b.chapters.map((_, i) => `/library/${b.slug}/${i}`),
    ]),
  ].map((path) => ({ url: `${SITE_URL}${path}` }));
}
