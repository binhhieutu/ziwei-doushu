import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ALL_BOOKS, getBookBySlug } from '@/lib/classics';
export function generateStaticParams() {
  return ALL_BOOKS.map((b) => ({ book: b.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book: slug } = await params;
  const b = getBookBySlug(slug);
  return b
    ? {
        title: `${b.title} · Thư viện`,
        alternates: { canonical: `/library/${b.slug}` },
      }
    : {};
}
export default async function BookPage({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book: slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) notFound();
  return (
    <div className="site-page">
      <Link href="/library">← Thư viện</Link>
      <p className="site-eyebrow">NGUYÊN VĂN CHỮ HÁN</p>
      <h1 lang="zh">{book.title}</h1>
      <p lang="zh">
        {book.dynasty} · {book.author}
      </p>
      <p lang="zh">{book.intro}</p>
      <h2>Mục lục</h2>
      <ol className="site-chapters">
        {book.chapters.map((chapter, i) => (
          <li key={i}>
            <Link href={`/library/${book.slug}/${i}`}>
              <span>Chương {i + 1}</span> <span lang="zh">{chapter.title}</span>{' '}
              →
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
