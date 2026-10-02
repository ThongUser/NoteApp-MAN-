# NoteApp-MAN

Ứng dụng ghi chú cá nhân gồm ghi chú theo danh mục, ghi chú riêng tư có mật khẩu, thống kê và cài đặt hồ sơ.

## Yêu cầu hệ thống

- Node.js phiên bản 20.19 trở lên hoặc 22.12 trở lên (theo yêu cầu của Vite 8).
- npm (được cài cùng Node.js).

## Chạy Backend

Mở terminal tại thư mục gốc của dự án và chạy:

```bash
cd backend
npm install
node server.js
```

Backend chạy tại: http://localhost:5000

## Chạy Frontend

Mở một terminal khác tại thư mục gốc của dự án và chạy:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại: http://localhost:5173

## Lưu ý

Ứng dụng lưu ghi chú và hồ sơ trong các file JSON tại `backend/data/`. Hãy sao lưu thư mục này định kỳ; xóa các file trong đó có thể làm mất dữ liệu.

Mật khẩu riêng tư khởi tạo được lưu trong `backend/data/profile.json`. Hãy đổi mật khẩu này trong phần Cài đặt trước khi sử dụng dữ liệu thật hoặc chia sẻ dự án.

