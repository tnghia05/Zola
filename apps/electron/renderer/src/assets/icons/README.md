# Icons Directory

Thư mục này chứa các SVG icons được export từ Figma.

## Cách thêm icon mới:

1. **Export từ Figma:**
   - Chọn icon trong Figma
   - Panel bên phải → Export → SVG
   - Lưu file vào thư mục này

2. **Đặt tên file:**
   - Dùng tên mô tả: `comment.svg`, `like.svg`, `share.svg`
   - Tránh tên chung chung: `icon.svg`, `icon1.svg`

3. **Import trong component:**
   ```tsx
   import iconName from '../assets/icons/icon-name.svg';
   <img src={iconName} alt="Icon" />
   ```

## Icons hiện có:

- (Sẽ được cập nhật khi có icons)

