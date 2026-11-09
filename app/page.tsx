import Link from 'next/link';
const palaces = [
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Thìn',
  'Dậu',
  'Mão',
  'Tuất',
  'Dần',
  'Sửu',
  'Tý',
  'Hợi',
];
export default function Home() {
  return (
    <div className="site-home">
      <section className="site-hero">
        <div className="site-hero-copy">
          <p className="site-eyebrow">TỬ VI · CHIÊM NGHIỆM · TÌM HIỂU</p>
          <h1>
            Lập lá số Tử Vi <em>bằng tiếng Việt</em>
          </h1>
          <p className="site-lead">
            Bắt đầu từ ngày giờ sinh, khám phá các cung và sao trên lá số, rồi
            tìm hiểu ý nghĩa trong bối cảnh của riêng bạn.
          </p>
          <div className="site-actions">
            <Link className="site-button" href="/chart">
              Lập lá số <span aria-hidden="true">↗</span>
            </Link>
            <Link className="site-button-secondary" href="/heming">
              Đối chiếu hai lá số →
            </Link>
          </div>
          <p className="site-note">
            Lá số được tính trong trình duyệt. AI chỉ được gọi khi bạn chọn luận
            giải.
          </p>
        </div>
        <figure className="site-chart-figure">
          <div className="site-chart" aria-label="Sơ đồ mười hai cung minh họa">
            {palaces.map((name, i) => (
              <div className={`site-chart-cell site-cell-${i}`} key={name}>
                <span>{name}</span>
                <i>✦</i>
              </div>
            ))}
            <div className="site-chart-center">
              <span>THIÊN BÀN</span>
              <strong>Tử Vi</strong>
              <small>Mười hai cung · một góc nhìn</small>
            </div>
          </div>
          <figcaption>Sơ đồ minh họa, không phải lá số cá nhân</figcaption>
        </figure>
      </section>
      <section className="site-intro">
        <div>
          <p className="site-eyebrow">BẮT ĐẦU TỪ ĐÂU?</p>
          <h2>Mỗi lá số là một cách đặt câu hỏi.</h2>
        </div>
        <div>
          <p>
            Tử Vi dùng hệ thống cung và sao để diễn đạt những chủ đề của đời
            sống. Hãy đọc như một truyền thống chiêm nghiệm, kết hợp với hoàn
            cảnh thực tế của bạn.
          </p>
          <div className="site-text-links">
            <Link href="/knowledge">Tìm hiểu các sao và cung →</Link>
            <Link href="/library">Đọc thư viện nguyên văn →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
