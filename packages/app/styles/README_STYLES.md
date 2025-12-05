# Conversations Styles Architecture

## 📁 Cấu trúc File

```
src/styles/
├── conversations.styles.ts         # Shared styles (dùng chung)
├── conversations.mobile.styles.ts   # Mobile-specific styles
└── conversations.desktop.styles.ts  # Desktop-specific styles
```

## 🎯 Mục đích

Tách riêng styles cho mobile và desktop để:
- ✅ **Sửa mobile không ảnh hưởng desktop** và ngược lại
- ✅ **Code dễ maintain** - Mỗi platform có file riêng
- ✅ **Tránh conflicts** - Thay đổi độc lập
- ✅ **Performance tốt** - Chỉ load styles cần thiết
- ✅ **Dễ mở rộng** - Thêm features cho từng platform

## 📝 Hướng dẫn sử dụng

### 1. Sửa đổi UI cho MOBILE

**File cần sửa:** `conversations.mobile.styles.ts`

```typescript
// Ví dụ: Thay đổi header mobile
export const mobileStyles = StyleSheet.create({
  header: {
    // Sửa đổi ở đây chỉ ảnh hưởng mobile
    paddingVertical: 20,  // Tăng padding
    backgroundColor: '#0084FF',  // Đổi màu
  },
  // ... các styles khác
});
```

### 2. Sửa đổi UI cho DESKTOP

**File cần sửa:** `conversations.desktop.styles.ts`

```typescript
// Ví dụ: Thay đổi left panel desktop
export const desktopStyles = StyleSheet.create({
  leftPanel: {
    // Sửa đổi ở đây chỉ ảnh hưởng desktop
    width: 360,  // Tăng width
    backgroundColor: '#2a2a2a',  // Đổi màu nền
  },
  // ... các styles khác
});
```

### 3. Sửa đổi Shared Styles (dùng chung)

**File cần sửa:** `conversations.styles.ts`

```typescript
// Chỉ sửa file này nếu muốn thay đổi ảnh hưởng CẢ mobile VÀ desktop
export const conversationsStyles = StyleSheet.create({
  avatarImage: {
    // Sửa ở đây sẽ ảnh hưởng cả 2 platforms
    borderRadius: 30,  // Thay đổi border radius
  },
  // ... các styles dùng chung khác
});
```

## 🔍 Danh sách Styles

### Mobile Styles (conversations.mobile.styles.ts)
- `container` - Container chính
- `header` - Header mobile
- `headerTitle` - Tiêu đề "messenger"
- `headerActions` - Các nút action trong header
- `avatarButtonMobile` - Avatar button mobile
- `composeButton` - Nút tạo chat mới
- `searchContainer`, `searchInput` - Search bar
- `tabsContainer`, `tab`, `activeTab` - Filter tabs
- `conversationsList` - Danh sách conversations
- `conversationItem`, `conversationAvatar`, `conversationContent` - Conversation items
- `conversationHeader`, `conversationName`, `conversationTime` - Conversation details
- `conversationPreview` - Preview tin nhắn

### Desktop Styles (conversations.desktop.styles.ts)
- `desktopLayout` - Layout 3 cột
- `leftPanel`, `centerPanel` - Panels trái và giữa
- `desktopHeader`, `desktopHeaderTitle` - Header desktop
- `avatarButton` - Avatar button desktop
- `searchContainer`, `searchInput` - Search bar
- `tabsContainer`, `tab` - Filter tabs
- `conversationsList` - Danh sách conversations
- `conversationItem`, `selectedConversationItem` - Conversation items
- `emptyChatArea`, `emptyChatTitle` - Empty state
- `chatArea`, `chatHeader` - Chat area
- `chatAvatar`, `chatName`, `chatStatus` - Chat info
- `chatHeaderActions`, `chatActionButton` - Chat actions
- `chatInfoPanel` - Right panel (chat info)
- `chatInfoHeader`, `chatInfoName` - Chat info header
- `chatInfoActions`, `chatInfoAction` - Chat info actions
- `chatInfoContent`, `chatInfoSection` - Chat info content

### Shared Styles (conversations.styles.ts)
- `avatarImage`, `defaultAvatar` - Avatar components
- `unreadBadge` - Unread count badge
- `messageAvatar`, `messageBubble*` - Message components
- `fileChip`, `fileIcon`, `fileName` - File attachments
- `callHistoryContainer` - Call history
- `modalOverlay`, `searchModal` - Search modal
- `searchResultItem` - Search results

## 💡 Best Practices

### ✅ DO:
1. **Sửa mobile** → Chỉnh file `conversations.mobile.styles.ts`
2. **Sửa desktop** → Chỉnh file `conversations.desktop.styles.ts`
3. **Sửa cả 2** → Chỉnh file `conversations.styles.ts`
4. Test trên cả mobile và desktop sau khi sửa

### ❌ DON'T:
1. Thêm mobile-specific styles vào `conversations.desktop.styles.ts`
2. Thêm desktop-specific styles vào `conversations.mobile.styles.ts`
3. Trùng lặp styles giữa mobile và desktop (nên move vào shared)

## 🚀 Ví dụ thực tế

### Thay đổi màu header chỉ trên mobile:

```typescript
// conversations.mobile.styles.ts
export const mobileStyles = StyleSheet.create({
  header: {
    // ... các style khác giữ nguyên
    backgroundColor: '#FF6B6B', // 🔴 Đổi thành màu đỏ
  },
});
```

### Thay đổi width left panel chỉ trên desktop:

```typescript
// conversations.desktop.styles.ts
export const desktopStyles = StyleSheet.create({
  leftPanel: {
    width: 400, // 🔵 Tăng từ 320 lên 400
    // ... các style khác giữ nguyên
  },
});
```

### Thay đổi avatar border cho cả mobile và desktop:

```typescript
// conversations.styles.ts
export const conversationsStyles = StyleSheet.create({
  avatarImage: {
    // ... các style khác giữ nguyên
    borderWidth: 3, // 🟢 Thêm border cho cả 2 platforms
    borderColor: '#007AFF',
  },
});
```

## 📚 Tham khảo

- File component: `src/screens/Conversations.tsx`
- Logic chọn styles: Dựa vào `isMobile` state
- Breakpoint: `width < 768` là mobile, `>= 768` là desktop

---

**Lưu ý:** Mọi thay đổi sẽ được TypeScript kiểm tra tự động. Nếu có lỗi, IDE sẽ báo ngay.

