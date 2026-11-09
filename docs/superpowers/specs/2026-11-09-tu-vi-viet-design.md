# Thiết kế đề xuất: Tử Vi Việt và AI qua 9Router

Trạng thái: đã được người dùng duyệt ngày 09/11/2026: “Duyệt, cứ triển khai và tự quyết chi tiết”.

## Mục đích và yêu cầu đã chốt

Người dùng yêu cầu fork, clone và sửa ziwei-doushu thành website xem Tử Vi bằng tiếng Việt, bổ sung AI luận giải. Người dùng đã chọn **9Router hoặc endpoint có sẵn**. Fork đã tạo tại https://github.com/binhhieutu/ziwei-doushu, clone `I:/codex_work_space/ziwei-doushu`, nhánh `codex/viet-hoa-ai`, upstream ban đầu `7922285d947b36610e7e31c232d8f1e2a0d0871d`.

Tên làm việc do người triển khai đề xuất: **Tử Vi Việt**. Bản giao là ứng dụng chạy cục bộ có kiểm thử, cấu hình AI ở máy chủ và tài liệu tiếng Việt; việc triển khai website công khai là công việc riêng khi được yêu cầu.

## Các hướng đã cân nhắc

1. **Chỉ dịch giao diện trên quy ước lịch/giờ gốc:** phạm vi nhỏ hơn, tái sử dụng nhiều nhất; người dùng vẫn phải hiểu đầu vào theo lịch Trung Quốc và kinh tuyến mặc định 120°. Không được gọi đây là lịch âm Việt Nam.
2. **Giữ engine, thêm hồ sơ Việt Nam và AI — đề xuất:** giữ thuật toán an sao, các khóa chữ Hán và kiểm thử upstream; thêm adapter lịch/giờ, từ điển hiển thị và API AI. Công việc nhiều hơn ở các ngày ranh giới nhưng phù hợp người nhập ngày giờ sinh ở Việt Nam.
3. **Viết lại engine:** không chọn vì làm mất lợi ích từ regression và bảng sao gốc, tăng phạm vi xác minh mà không cần thiết cho yêu cầu này.

Người dùng đã duyệt hướng 2 và giao người triển khai tự quyết các chi tiết kỹ thuật. Các quyết định không có trong yêu cầu được ghi là đề xuất của người triển khai.

## Hành vi sản phẩm

- Trang chủ, điều hướng, biểu mẫu, thông báo, metadata và các trang hướng dẫn bằng tiếng Việt. Giữ URL hiện có: `/chart`, `/heming`, `/knowledge`, `/library`, `/privacy`, `/terms`.
- Trang **Lập lá số** nhận tên tùy chọn, ngày/tháng/năm dương lịch, giờ/phút và giới tính dùng trong quy tắc an sao. Năm được giới hạn trong miền mà adapter và engine đã được kiểm thử, trước mắt 1900–2050.
- Mặc định đầu vào mới theo giờ dân sự UTC+7. Người dùng có thể chọn hiệu chỉnh giờ mặt trời trong phần nâng cao; màn hình và dữ liệu lập lá số dùng cùng một phép tính. Các địa điểm gợi ý gồm thành phố Việt Nam, kèm nhập kinh độ tùy chọn; không dùng danh sách địa giới hành chính chưa được xác minh làm điều kiện bắt buộc.
- Trường hợp không biết giờ: yêu cầu chọn một giờ giả định để xem lá số tạm tính và đánh dấu trạng thái đó trong bản luận giải; không âm thầm coi đó là giờ sinh đã xác nhận.
- Cho biết quy ước đổi ngày ở giờ Tý. Dữ liệu cũ và lời gọi engine không khai báo hồ sơ Việt Nam giữ nguyên hành vi upstream. Không áp dụng UTC+7 ngầm lên URL cũ.
- Bàn 12 cung có tên sao, cung, thiên can, địa chi, độ sáng, ngũ hành và tứ hóa bằng Hán Việt. Khóa dữ liệu chữ Hán giữ nguyên trong thuật toán và lookup; không dùng thay thế DOM hoặc sửa identifier toàn cục.
- Chỉ có một trạng thái điều khiển Nguyên cục / Đại hạn / Lưu niên; bỏ hai bộ điều khiển độc lập hiện tại. Mobile có bố cục đọc được tên tiếng Việt dài, focus bàn phím và trạng thái tải/lỗi rõ.
- **AI luận giải** theo chủ đề và hỏi tiếp bằng tiếng Việt, dựa trên dữ kiện cấu trúc của lá số được kiểm tra ở máy chủ. Chọn cung chỉ xem cung; không tự gọi AI khi mount hoặc đổi lựa chọn. Có hủy và thử lại. Phản hồi render dạng text/markup giới hạn an toàn.
- **Đối chiếu hai lá số:** nhập và xem được lá số của hai người trước khi yêu cầu AI; diễn giải điểm tương đồng, khác biệt, giao tiếp và cách tương tác. Không tạo chỉ số phần trăm hợp nhau khi không có thuật toán tương ứng.
- **Kiến thức:** giải thích tiếng Việt có biên soạn riêng cho các sao/cung cơ bản. **Thư viện:** Việt hóa phần dẫn đường, mục lục và tìm kiếm; văn bản gốc được ghi rõ “Nguyên văn chữ Hán”. Không nhận là đã dịch toàn văn kho dữ liệu.
- Giữ MIT và attribution của code, giữ giấy phép riêng của dữ liệu/nguyên tác. Không đưa trích đoạn khóa học có điều kiện sử dụng riêng vào prompt AI mặc định.

## Lịch và khả năng tương thích

Giờ UTC+7 và lịch âm Việt Nam là hai vấn đề riêng. Không chỉ thay kinh tuyến 120 thành 105 rồi đổi nhãn lịch. Adapter lịch Việt Nam cần xử lý ngày/tháng/năm âm, tháng nhuận, độ dài tháng và đổi hai chiều, có đối chiếu độc lập ở ngày Tết/ngày sóc mà lịch UTC+7 khác UTC+8.

Nếu dùng thư viện, lựa chọn cụ thể do người triển khai quyết định sau khi kiểm tra nguồn, API, giấy phép và fixture; không sao chép thuật toán không rõ quyền sử dụng. Dữ liệu âm lịch Việt Nam phải đi vào cả quyết định an sao lẫn metadata, không chỉ phần hiển thị. Kiểm tra `astro.byLunar` sau khi cài để tránh việc thư viện âm thầm đổi về ngày dân sự Trung Quốc và làm sai dữ kiện ngày sinh. Giữ riêng ngày/giờ người dùng nhập và dữ kiện đã hiệu chỉnh. Không khẳng định mô hình UTC+7 hiện đại mô tả mọi thay đổi múi giờ lịch sử.

## AI, cấu hình và dữ liệu

- Gọi endpoint tương thích OpenAI của 9Router từ backend. URL, model, khóa và giới hạn nằm trong biến môi trường server; endpoint/model không được lấy từ request của khách.
- Cấu hình local nằm trong `.env.local` bị Git ignore. Không ghi khóa vào source, log, client bundle hoặc báo cáo. Chỉ đọc lại cấu hình 9Router đã có trong phạm vi cần thiết; không đổi tài khoản, khóa hay provider của gateway.
- Backend kiểm tra schema, kích thước body, số lượng/độ dài hội thoại; kiểm tra hoặc dựng lại dữ kiện lá số thay vì tin toàn bộ chart gửi từ trình duyệt. Prompt hệ thống do server quyết định, dữ liệu người dùng nằm ở vai trò dữ liệu.
- Có giới hạn tổng số request theo cửa sổ, concurrency, thời gian, token và dung lượng stream cho một tiến trình; kiểm thử các giới hạn. Nếu triển khai nhiều instance, phải thay bộ đếm cục bộ bằng cơ chế dùng chung trước khi coi đó là giới hạn toàn hệ thống.
- Không lưu dữ liệu sinh hoặc hội thoại vào database trong bản này. Không tự tải analytics của website gốc. Trước lần gọi AI, giao diện cho biết thông tin lá số sẽ được gửi tới dịch vụ AI khi người dùng chọn luận giải.
- Prompt không chẩn đoán bệnh, khẳng định sự kiện chắc chắn, hoặc thay thế quyết định chuyên môn; phân biệt diễn giải truyền thống với dữ kiện của lá số. Không tự thêm khả năng dùng tool hay truy cập tài khoản khác cho model.

## Cấu trúc thay đổi dự kiến

- Từ điển và nội dung Việt: `lib/i18n/`, các component hiển thị sao/cung và nội dung kiến thức.
- Lịch/đầu vào: module adapter mới cạnh `lib/ziwei/`, mở rộng type/engine bằng tùy chọn có mặc định tương thích, cùng `BirthForm` và helper chia sẻ.
- API và streaming: module server riêng, route `/api/interpret` và `/api/heming`, client đọc stream dùng chung.
- Trang công khai: layout, trang chủ, chart/heming, shell library/knowledge và privacy/terms. Các dữ liệu gốc dài giữ nguyên.
- Package/CI/docs: cập nhật Next lên phiên bản có bản vá các advisory đã rà soát, pin action/restrict permissions, README tiếng Việt và cấu hình mẫu.

## Tiêu chí nghiệm thu

1. Lập lá số và xem chi tiết cung hoàn toàn bằng tiếng Việt trong luồng chính, không cần khóa AI để tính lá số.
2. Fixture kiểm tra UTC+7, ranh giới giờ Tý, tháng nhuận, ngày không tồn tại, ngày lịch Việt/Trung khác nhau; regression upstream vẫn qua khi dùng mặc định cũ.
3. Unit, integration và E2E có ý nghĩa cho tính lịch, nhãn hiển thị, API validation, hội thoại, streaming, timeout/cancel/rate-limit; đạt ít nhất 80% coverage trên mã logic mới/thay đổi có thể thực thi và ghi rõ phạm vi coverage.
4. Typecheck, regression, build production và dependency audit được chạy; không bỏ qua lỗi chưa được giải thích.
5. Kiểm tra desktop và mobile: nhập sinh → lá số → chọn cung → AI bằng response giả lập, hai lá số, retry/cancel và cấu hình thiếu. Chỉ gọi gateway thật khi có endpoint/model sẵn và dùng tối thiểu dữ liệu giả.
6. Có review correctness và security sau khi checks liên quan xanh. Không commit khóa hoặc dữ liệu sinh thật. Không push code hoặc deploy ngoài phạm vi người dùng đã yêu cầu.

## Việc giao cho người triển khai tự quyết

Tổ chức module cụ thể, dữ liệu gợi ý địa điểm, thư viện lịch được kiểm tra, model có sẵn trên gateway, bố cục chi tiết trong phong cách lá số hiện tại, câu chữ Việt và danh mục kiểm thử. Nếu phát hiện engine không thể tiếp nhận lịch Việt đúng mà không cần thay đổi lớn hơn, báo chính xác phần hạn chế trước khi công bố khả năng đó.

## Bằng chứng khảo sát bổ sung

- 9Router cục bộ đang lắng nghe tại `127.0.0.1:20128`; GET `/v1/models` xác thực bằng khóa hiện có trả 32 model. Việc liệt kê này chưa chứng minh model suy luận được. Không thay đổi cấu hình gateway hoặc gọi sinh nội dung trong giai đoạn thiết kế.
- Registry công bố `@nghiavuive/lunar_date_vi@2.0.1`, giấy phép ISC và integrity; đây là một ứng viên cần đọc API/source và kiểm tra fixture, chưa phải dependency đã được chọn/cài.
- Fixture độc lập bắt buộc: ngày 17/02/2007 là mùng 1 Tết tại Việt Nam. [Chương trình Tết của Đài Tiếng nói Việt Nam được Nhân Dân đăng](https://nhandan.vn/chuong-trinh-tet-cua-dai-tieng-noi-viet-nam-post404808.html) ghi rõ “Ngày 1 Tết (Thứ bảy, ngày 17-2-2007)”. Ngày này dùng để kiểm tra adapter lịch Việt thay vì lấy kết quả của thư viện Trung Quốc làm oracle.
- Kiểm tra khả năng triển khai độc lập kết luận không còn câu hỏi thiết kế quan trọng chưa được xử lý; người dùng đã duyệt hướng đề xuất.
