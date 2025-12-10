# Hướng dẫn Setup Auto-Update cho Zola Desktop

## Tổng quan

App đã được cấu hình để tự động cập nhật. Mỗi khi bạn build và publish phiên bản mới, người dùng sẽ tự động nhận được thông báo và cập nhật.

## Cách hoạt động

1. **Tự động kiểm tra**: App tự động kiểm tra cập nhật mỗi 4 giờ
2. **Tự động tải**: Khi có bản cập nhật, app tự động tải xuống
3. **Tự động cài đặt**: Khi người dùng đóng app, bản cập nhật sẽ được cài đặt tự động
4. **Thông báo**: Người dùng nhận được thông báo khi có bản cập nhật mới

## Setup GitHub Releases (Khuyên dùng - Miễn phí)

### Bước 1: Tạo GitHub Repository

1. Tạo repository mới trên GitHub (nếu chưa có)
2. Lưu lại tên repository và username của bạn

### Bước 2: Cấu hình package.json

Mở `apps/electron/package.json` và cập nhật phần `publish` trong `build`:

```json
"publish": {
  "provider": "github",
  "owner": "YOUR_GITHUB_USERNAME",  // Thay bằng username GitHub của bạn
  "repo": "YOUR_REPO_NAME"           // Thay bằng tên repository
}
```

Ví dụ:
```json
"publish": {
  "provider": "github",
  "owner": "yourusername",
  "repo": "zola-desktop"
}
```

### Bước 3: Tạo GitHub Personal Access Token

1. Vào GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Đặt tên token (ví dụ: "Zola Desktop Auto-Update")
4. Chọn scope: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Lưu token lại** (chỉ hiển thị 1 lần!)

### Bước 4: Set Environment Variable

**Windows PowerShell:**
```powershell
$env:GH_TOKEN="your_github_token_here"
```

**Windows CMD:**
```cmd
set GH_TOKEN=your_github_token_here
```

**Hoặc tạo file `.env` trong thư mục project:**
```
GH_TOKEN=your_github_token_here
```

### Bước 5: Build và Publish

```bash
cd apps/electron
pnpm build:electron
```

Lệnh này sẽ:
1. Build app
2. Tự động upload lên GitHub Releases
3. Tạo release với version từ `package.json`

## Cách sử dụng Auto-Update

### Cho người dùng:

1. **Lần đầu tiên**: Gửi file installer/portable như bình thường
2. **Các lần sau**: Chỉ cần publish lên GitHub, app sẽ tự động cập nhật!

### Cho developer:

1. **Cập nhật version** trong `apps/electron/package.json`:
   ```json
   "version": "0.0.1"  // Tăng version mỗi lần update
   ```

2. **Build và publish**:
   ```bash
   cd apps/electron
   pnpm build:electron
   ```

3. **Xong!** Người dùng sẽ tự động nhận được cập nhật

## Các tùy chọn khác

### Option 1: Server riêng (Nếu không dùng GitHub)

Nếu bạn có server riêng, có thể cấu hình:

```json
"publish": {
  "provider": "generic",
  "url": "https://your-server.com/updates"
}
```

### Option 2: Tắt auto-update cho một số build

Nếu muốn build mà không publish:

```bash
pnpm build:electron -- --publish never
```

## Kiểm tra Auto-Update

### Test trong development:

Auto-update sẽ tự động tắt trong development mode. Để test:

1. Build production version:
   ```bash
   pnpm build:electron
   ```

2. Chạy file đã build và kiểm tra console logs

### Manual check update:

Có thể thêm button trong UI để check update thủ công (code đã có sẵn trong IPC handlers).

## Troubleshooting

### Lỗi: "Cannot find module 'electron-updater'"
- Chạy: `pnpm install` trong `apps/electron/main`

### Lỗi: "GH_TOKEN not set"
- Đảm bảo đã set environment variable `GH_TOKEN`

### Lỗi: "Repository not found"
- Kiểm tra lại `owner` và `repo` trong `package.json`
- Đảm bảo token có quyền truy cập repository

### App không tự động cập nhật
- Kiểm tra internet connection
- Kiểm tra console logs để xem lỗi
- Đảm bảo version mới cao hơn version hiện tại

## Lưu ý

- **Version phải tăng**: Mỗi lần publish, version trong `package.json` phải cao hơn version trước
- **GitHub Releases**: File sẽ được upload lên GitHub Releases, cần có quyền write
- **File size**: GitHub có giới hạn 100MB/file, nếu file lớn hơn cần dùng GitHub Releases với file lớn hơn hoặc server riêng

