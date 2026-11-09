export const metadata = {
  title: 'Quyền riêng tư',
  alternates: { canonical: '/privacy' },
};
export default function Privacy() {
  return (
    <article className="site-page site-prose">
      <p className="site-eyebrow">THÔNG TIN</p>
      <h1>Quyền riêng tư</h1>
      <h2>Lá số và thông tin bạn nhập</h2>
      <p>
        Biểu mẫu và việc tính lá số được thực hiện trong trình duyệt. Phiên bản
        này không lưu dữ liệu sinh hay hội thoại vào cơ sở dữ liệu máy chủ. Lịch
        sử trao đổi với AI chỉ nằm trong bộ nhớ của phiên đang mở.
      </p>
      <h2>Khi bạn chọn luận giải AI</h2>
      <p>
        Chỉ khi bạn chủ động yêu cầu luận giải, dữ kiện lá số và nội dung câu
        hỏi cần thiết mới được gửi tới dịch vụ AI qua 9Router. Tên và địa chỉ
        không được đưa vào dữ kiện lá số gửi trong prompt. Nội dung bạn tự nhập
        vào câu hỏi vẫn được gửi đi; hãy tránh đưa thông tin nhạy cảm vào đó.
      </p>
      <p>
        Dịch vụ và nhà cung cấp AI bên ngoài có thể áp dụng chính sách xử lý dữ
        liệu riêng. Hãy kiểm tra chính sách của nhà cung cấp được cấu hình trước
        khi sử dụng.
      </p>
      <h2>Tùy chọn giao diện</h2>
      <p>
        Trình duyệt có thể lưu lựa chọn giao diện sáng hoặc tối trên thiết bị
        của bạn.
      </p>
    </article>
  );
}
