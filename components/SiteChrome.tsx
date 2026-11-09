'use client';
import Link from 'next/link';
import { useTheme } from './ThemeProvider';

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  return (
    <header className="site-header">
      <a className="site-skip" href="#main-content">
        Chuyển đến nội dung
      </a>
      <div className="site-header-inner">
        <Link className="site-brand" href="/">
          <span className="site-brand-mark" aria-hidden="true">
            ✦
          </span>
          <span>
            Tử Vi Việt<small>Khám phá lá số</small>
          </span>
        </Link>
        <nav aria-label="Điều hướng chính">
          <Link href="/chart">Lập lá số</Link>
          <Link href="/heming">Đối chiếu</Link>
          <Link href="/knowledge">Kiến thức</Link>
          <Link href="/library">Thư viện</Link>
          <button
            type="button"
            className="site-theme"
            aria-label={
              theme === 'dark'
                ? 'Chuyển sang giao diện sáng'
                : 'Chuyển sang giao diện tối'
            }
            onClick={toggle}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </nav>
      </div>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Tử Vi Việt</strong>
        <p>Một góc tìm hiểu Tử Vi bằng tiếng Việt.</p>
      </div>
      <nav aria-label="Thông tin website">
        <Link href="/privacy">Quyền riêng tư</Link>
        <Link href="/terms">Điều khoản</Link>
        <a href="https://github.com/binhhieutu/ziwei-doushu">Mã nguồn · MIT</a>
        <a href="https://github.com/Renhuai123/ziwei-doushu">Dự án gốc</a>
      </nav>
    </footer>
  );
}
