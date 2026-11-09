import Link from 'next/link';
import { ALL_BOOKS } from '@/lib/classics';
import LibrarySearch from './LibrarySearch';
export const metadata = {
  title: 'Thư viện nguyên văn',
  description: 'Tra cứu tư liệu Tử Vi nguyên văn chữ Hán.',
  alternates: { canonical: '/library' },
};
export default function LibraryPage() {
  return (
    <div className="site-page">
      <p className="site-eyebrow">TƯ LIỆU THAM KHẢO</p>
      <h1>Thư viện nguyên văn</h1>
      <p className="site-lead">
        Các sách và nội dung dưới đây được giữ theo dữ liệu nguồn bằng chữ Hán,
        chưa phải bản dịch tiếng Việt. Đây là các đoạn được chọn trong dữ liệu
        của dự án gốc, không phải toàn bộ sách. Nhan đề, tác giả và thông tin
        nguồn cũng được giữ nguyên. Xem{' '}
        <a href="https://github.com/Renhuai123/ziwei-doushu">dự án gốc</a> để
        đối chiếu nguồn và giấy phép.
      </p>
      <LibrarySearch />
      <div className="site-guide">
        {ALL_BOOKS.map((book) => (
          <article key={book.slug}>
            <p className="site-eyebrow">NGUYÊN VĂN CHỮ HÁN</p>
            <h2>
              <Link href={`/library/${book.slug}`}>{book.title}</Link>
            </h2>
            <p lang="zh">
              {book.dynasty} · {book.author}
            </p>
            <p>{book.chapters.length} chương</p>
            <Link href={`/library/${book.slug}`}>Xem mục lục →</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
