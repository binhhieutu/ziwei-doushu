export const metadata = {
  title: 'Điều khoản sử dụng',
  alternates: { canonical: '/terms' },
};
export default function Terms() {
  return (
    <article className="site-page site-prose">
      <p className="site-eyebrow">THÔNG TIN</p>
      <h1>Điều khoản sử dụng</h1>
      <h2>Mục đích tham khảo</h2>
      <p>
        Tử Vi và nội dung AI được cung cấp để tìm hiểu và chiêm nghiệm. Các diễn
        giải không phải dự đoán chắc chắn hay tư vấn y tế, pháp lý hoặc tài
        chính. Hãy dùng thông tin chuyên môn và hoàn cảnh thực tế khi quyết
        định.
      </p>
      <h2>Mã nguồn và tài liệu</h2>
      <p>
        Mã nguồn của dự án được phát hành theo giấy phép MIT; xem{' '}
        <a href="https://github.com/binhhieutu/ziwei-doushu">
          kho mã nguồn và giấy phép
        </a>
        . Dự án được phát triển từ{' '}
        <a href="https://github.com/Renhuai123/ziwei-doushu">
          ziwei-doushu của Renhuai123
        </a>
        . Thư viện có dữ liệu nguyên văn và chú thích từ nguồn riêng: quyền đối
        với tác phẩm và dữ liệu không mặc nhiên giống giấy phép mã nguồn. Vui
        lòng kiểm tra nguồn và điều kiện sử dụng tương ứng trước khi tái sử
        dụng.
      </p>
    </article>
  );
}
