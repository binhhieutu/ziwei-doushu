import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="site-page">
      <p className="site-eyebrow">KHÔNG TÌM THẤY</p>
      <h1>Trang này không tồn tại</h1>
      <p>Đường dẫn có thể đã thay đổi hoặc không còn khả dụng.</p>
      <Link className="site-button" href="/">
        Về trang chủ
      </Link>
    </div>
  );
}
