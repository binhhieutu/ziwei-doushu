import { PALACE_GUIDE, STAR_GUIDE } from '@/lib/i18n/vi';
export const metadata = {
  title: 'Kiến thức Tử Vi',
  description: 'Giới thiệu 14 chính tinh và 12 cung bằng tiếng Việt.',
  alternates: { canonical: '/knowledge' },
};
export default function KnowledgePage() {
  return (
    <div className="site-page">
      <p className="site-eyebrow">SỔ TAY TỬ VI</p>
      <h1>Kiến thức căn bản</h1>
      <p className="site-lead">
        Những mô tả dưới đây là phần giới thiệu được biên soạn cho Tử Vi Việt.
        Mỗi sao và cung cần được đọc trong bối cảnh toàn bộ lá số.
      </p>
      <section>
        <h2>Mười bốn chính tinh</h2>
        <div className="site-jump">
          {STAR_GUIDE.map((x) => (
            <a key={x.id} href={`#sao-${x.id}`}>
              {x.name}
            </a>
          ))}
        </div>
        <div className="site-guide">
          {STAR_GUIDE.map((x) => (
            <article id={`sao-${x.id}`} key={x.id}>
              <h3>{x.name}</h3>
              <p>{x.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2>Mười hai cung</h2>
        <div className="site-jump">
          {PALACE_GUIDE.map((x) => (
            <a key={x.id} href={`#cung-${x.id}`}>
              {x.name}
            </a>
          ))}
        </div>
        <div className="site-guide">
          {PALACE_GUIDE.map((x) => (
            <article id={`cung-${x.id}`} key={x.id}>
              <h3>{x.name}</h3>
              <p>{x.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
