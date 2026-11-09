import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getChapter } from '@/lib/classics';
export function generateStaticParams() {
  return ALL_BOOKS.flatMap((b) =>
    b.chapters.map((_, i) => ({ book: b.slug, chapter: String(i) })),
  );
}
async function chapterFor(params: Promise<{ book: string; chapter: string }>) {
  const p = await params;
  return /^\d+$/.test(p.chapter) ? getChapter(p.book, Number(p.chapter)) : null;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const r = await chapterFor(params);
  return r
    ? {
        title: `${r.chapter.title} · ${r.book.title}`,
        alternates: { canonical: `/library/${r.book.slug}/${r.chapterIdx}` },
      }
    : {};
}
export default async function ChapterPage({
  params,
}: {
  params: Promise<{ book: string; chapter: string }>;
}) {
  const result = await chapterFor(params);
  if (!result) notFound();
  const { book, chapter, chapterIdx } = result;
  return (
    <article className="site-page site-prose">
      <Link href={`/library/${book.slug}`}>← Mục lục</Link>
      <p className="site-eyebrow">
        NGUYÊN VĂN CHỮ HÁN · CHƯƠNG {chapterIdx + 1}
      </p>
      <h1 lang="zh">{chapter.title}</h1>
      <p lang="zh">
        {book.title} · {book.author}
      </p>
      {chapter.paragraphs.map((p) => (
        <section id={p.id} key={p.id} className="site-paragraph">
          <p lang="zh">{p.text}</p>
          {p.translation && (
            <>
              <strong>Bản diễn giải tiếng Trung trong nguồn</strong>
              <p lang="zh">{p.translation}</p>
            </>
          )}
          {p.niNote && (
            <>
              <strong>Chú thích tiếng Trung trong nguồn</strong>
              <p lang="zh">{p.niNote}</p>
            </>
          )}
        </section>
      ))}
      <nav className="site-text-links" aria-label="Chuyển chương">
        {chapterIdx > 0 && (
          <Link href={`/library/${book.slug}/${chapterIdx - 1}`}>
            ← Chương trước
          </Link>
        )}
        {chapterIdx + 1 < book.chapters.length && (
          <Link href={`/library/${book.slug}/${chapterIdx + 1}`}>
            Chương sau →
          </Link>
        )}
      </nav>
    </article>
  );
}
