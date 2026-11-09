import Link from 'next/link';
import { searchClassics, getParagraphById } from '@/lib/classics';
import { normalizeLibraryQuery } from '@/lib/i18n/library';
import LibrarySearch from '../LibrarySearch';
export const metadata = {
  title: 'Tìm trong thư viện',
  robots: { index: false, follow: true },
};
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const q = normalizeLibraryQuery((await searchParams).q);
  const hits = q ? searchClassics(q, 50) : [];
  return (
    <div className="site-page">
      <Link href="/library">← Thư viện</Link>
      <h1>Kết quả tìm kiếm</h1>
      <LibrarySearch />
      <p>
        {q ? (
          <>
            Tìm “{q}”: {hits.length} kết quả (tối đa 50).
          </>
        ) : (
          'Nhập từ khóa chữ Hán để tìm trong nguyên văn.'
        )}
      </p>
      {q && hits.length === 0 && (
        <p>Không tìm thấy kết quả trong dữ liệu hiện có.</p>
      )}
      <div className="site-guide">
        {hits.map((hit) => {
          const ctx = getParagraphById(hit.paragraphId);
          return (
            <article key={hit.paragraphId}>
              <p className="site-eyebrow">NGUYÊN VĂN CHỮ HÁN</p>
              <Link
                href={`/library/${hit.bookSlug}/${ctx?.chapterIdx ?? 0}#${hit.paragraphId}`}
              >
                <span lang="zh">
                  {hit.bookTitle} · {hit.chapterTitle}
                </span>
                <p
                  lang="zh"
                  dangerouslySetInnerHTML={{ __html: hit.snippet }}
                />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
