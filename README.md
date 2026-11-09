# Tử Vi Việt

Website lập lá số Tử Vi bằng tiếng Việt, chuyển đổi lịch Việt Nam UTC+7 và luận giải AI qua 9Router hoặc endpoint tương thích OpenAI.

Fork từ [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu), nền mã `7922285d947b36610e7e31c232d8f1e2a0d0871d`. [README gốc tiếng Trung](README.zh-CN.md) và [tiếng Anh](README.en.md) được giữ để tham khảo; mô tả backend và giao diện trong bản gốc không phản ánh các phần bổ sung của fork này.

## Chức năng

- Lập và xem bàn 12 cung, tên sao/cung, can chi, độ sáng và tứ hóa bằng tiếng Việt; chọn cung để xem chi tiết.
- Xem Nguyên cục, Đại hạn hoặc Lưu niên. Đây là các lớp tứ hóa trên bàn số gốc, không phải mô hình di chuyển toàn bộ sao theo thời gian.
- Nhập ngày dương lịch 1900–2050 theo giờ UTC+7; lịch âm Việt Nam đi vào cả phép an sao và dữ kiện hiển thị. Có lựa chọn giờ mặt trời trung bình/biểu kiến, kinh độ và quy ước đổi ngày lúc 23 giờ.
- Khi chưa biết giờ sinh, phải chọn giờ giả định; lá số và lời nhắc AI ghi rõ trạng thái tạm tính.
- AI theo chủ đề, cung đang chọn và kỳ đang xem; hỏi tiếp, hủy, thử lại. Hai người có thể xem từng lá số trước khi chủ động yêu cầu đối chiếu.
- Trang kiến thức có giải thích tiếng Việt cho sao/cung cơ bản. Thư viện có dẫn đường tiếng Việt; **cổ văn vẫn là nguyên văn chữ Hán**, có nhãn rõ ràng.

## Chạy trên máy

Dùng Node.js **22.12 trở lên trong nhánh 22**, hoặc **24**. Khuyến nghị Node 24; Node 23 không nằm trong miền hỗ trợ.

```sh
npm ci
npm run dev -- --port 3018
```

Mở [http://127.0.0.1:3018](http://127.0.0.1:3018). Không cần khóa AI để lập lá số. Bản production:

```sh
npm run build
npm start -- --port 3018
```

## Cấu hình AI

Sao chép `.env.example` thành `.env.local`, điền **khóa có sẵn** và model đang hoạt động trên gateway:

```dotenv
AI_BASE_URL=http://127.0.0.1:20128/v1
AI_API_KEY=your-existing-router-key
AI_MODEL=your-available-model-id
AI_MAX_TOKENS=2048
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3018
```

`AI_BASE_URL` là URL gốc có `/v1`, không bao gồm `/chat/completions`. Gateway phải cung cấp streaming chat completions tương thích OpenAI. Khởi động lại ứng dụng sau khi đổi cấu hình. Nếu thiếu cấu hình, API trả thông báo tiếng Việt, việc tính lá số vẫn hoạt động.

URL, model và khóa chỉ được đọc ở máy chủ. Không dùng tiền tố `NEXT_PUBLIC_` cho khóa; không commit `.env.local`. Giao diện chỉ gửi yêu cầu AI khi người dùng bấm nút. `NEXT_PUBLIC_SITE_URL` cũng xác định Origin trình duyệt được chấp nhận; phải trùng giao thức, tên máy và cổng trên thanh địa chỉ, kể cả khi ứng dụng chạy sau reverse proxy.

## API và quyền riêng tư

- `POST /api/interpret`: `{ birth, topic?, palaceBranch?, view?, messages? }`.
- `POST /api/heming`: `{ birthA, birthB, question?, messages? }`.
- `birth` gồm ngày/giờ dương lịch, giới tính, chế độ giờ và quy ước giờ Tý; xem [kiểu đầu vào](lib/vietnam/types.ts).
- `view` là `{ mode: 'natal' }`, `{ mode: 'year', year: 2027 }` hoặc `{ mode: 'decade', decadeIndex: 0 }`. Máy chủ tự tính lại lá số và tứ hóa, không nhận bảng sao/model/prompt hệ thống từ trình duyệt.
- Phản hồi thành công là SSE: `data: {"delta":{"text":"..."}}`, kết thúc bằng `data: [DONE]`. Lỗi trước stream có JSON `{ error, code }`; lỗi trong stream dùng `event: error`.

Ứng dụng không có cơ sở dữ liệu lưu thông tin sinh hay hội thoại. Tên và nơi sinh được loại khỏi dữ kiện lá số gửi tới provider; câu hỏi do người dùng tự gõ vẫn được gửi. Gateway/provider có chính sách lưu dữ liệu riêng. Fork đã bỏ telemetry của ứng dụng gốc.

Giới hạn mỗi tiến trình: 20 yêu cầu/phút, 2 yêu cầu đồng thời, 45 giây/yêu cầu, tối đa 2.048 token đầu ra, body 32 KiB và lịch sử 12 tin/16.000 ký tự. Trước khi mở dịch vụ công khai cần bổ sung kiểm soát truy cập và bộ đếm dùng chung nếu chạy nhiều instance. Giới hạn cục bộ hiện tại không đại diện cho hạn mức tài khoản hay toàn cụm.

## Quy ước lịch và phạm vi xác minh

- Adapter dùng `@nghiavuive/lunar_date_vi` 2.0.1 (ISC, bảng lịch được upstream ghi nguồn Hồ Ngọc Đức). UTC+7 cố định là quy ước hiện đại, chưa tái hiện các múi giờ lịch sử của Việt Nam.
- Fixture quan trọng: 17/02/2007 là mùng 1 Tết Việt Nam, trong khi lịch Trung Quốc bắt đầu Tết vào 18/02; có kiểm tra tháng nhuận và ngày 30 không tương ứng với tháng Trung Quốc.
- Giữ lịch âm gốc cho metadata, tách quy tắc an sao tháng nhuận: ngày 1–15 dùng tháng hiện tại, phần sau dùng tháng tiếp theo. Hiệu chỉnh giờ mặt trời biểu kiến là phép xấp xỉ; đây không phải dịch vụ thiên văn độ chính xác cao.
- Engine vẫn giữ khóa chữ Hán và hành vi mặc định upstream khi không chọn hồ sơ Việt Nam. Các công thức an sao Việt Nam được đối chiếu với upstream khi lịch trùng nhau; kiểm tra tương thích không chứng minh độ chính xác dự đoán của Tử Vi.
- Nội dung luận giải là diễn giải truyền thống có bất định, phục vụ tham khảo văn hóa; không thay thế chẩn đoán hoặc quyết định chuyên môn.

## Kiểm tra

```sh
npm run typecheck
npm run test:regression
npm run test:coverage
npm audit --audit-level=moderate
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright mặc định dùng Chrome đã cài trên máy. Khi dùng Chromium do Playwright tải (như CI), đặt `PLAYWRIGHT_CHANNEL=chromium`. E2E tự chạy bản production trên cổng 3018 và mô phỏng AI để không tiêu hao quota. Có thể đặt `PLAYWRIGHT_BASE_URL` để kiểm tra một server đang chạy.

Coverage đặt ngưỡng 80% cho statements, branches, functions và lines trên `lib/vietnam`, `lib/ai`, `lib/i18n`, `components/vietnam`, `ThemeProvider` và hai API route; không tuyên bố coverage 80% cho toàn bộ engine/corpus upstream. 22 regression gốc vẫn chạy; hai kiểm tra đọc cấu trúc source Heming trỏ vào bản gốc giữ ở `components/legacy/HemingPage.tsx`, còn route mới có kiểm tra hành vi riêng.

## Giấy phép và nguồn

Mã gốc giữ [MIT](LICENSE). Mẫu/bộ dữ liệu phát hành riêng có [điều khoản CC BY 4.0 và attribution](DATASET-LICENSE); fork không tải bộ dữ liệu hàng chục GB. Cổ văn theo mô tả upstream thuộc phạm vi công cộng. Trích dẫn bài giảng Ni Hải Hạ có điều khoản riêng tại [docs/tianji-ziwei/LICENSE.md](docs/tianji-ziwei/LICENSE.md), không được coi toàn bộ corpus là MIT.

Tên tiếng Việt đối chiếu locale của `iztro`; giữ [thông báo MIT](docs/licenses/iztro.txt) và [ghi chú từ điển](lib/i18n/README.md). Chi tiết thiết kế và kiểm thử nằm trong [tài liệu dự án](docs/superpowers/specs/2026-11-09-tu-vi-viet-design.md).
