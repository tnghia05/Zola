"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "../../components/AppLayout";
import { FacebookNavbarWeb } from "../../components/FacebookNavbar.web";
import { LeftSidebar } from "../../components/LeftSidebar.web";
import {
  getCurrentUserId,
  getUserById,
  updateUserProfile,
  updateUserAvatar,
  changePassword,
} from "../../api";
import "../../styles/feed.css";
import "../../styles/settings.css";

type SettingsSection = "personal" | "security" | "privacy" | "notifications";

interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SettingsSection>("personal");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userId = await getCurrentUserId();
        if (userId) {
          const user = await getUserById(userId);
          setCurrentUser({
            _id: user._id,
            name: user.name || user.email || "User",
            email: user.email || "",
            username: user.username,
            avatar: user.avatar,
          });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const header = (
    <FacebookNavbarWeb
      currentUser={currentUser ? { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar } : null}
    />
  );

  const leftSidebar = (
    <LeftSidebar
      currentUser={currentUser ? { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar } : null}
      activeRoute="/settings"
    />
  );

  return (
    <AppLayout header={header} leftSidebar={leftSidebar} hideSidebars={true}>
      <div className="settings-container">
        <div className="settings-layout">
          {/* Left Navigation Sidebar */}
          <aside className="settings-sidebar">
            <div className="settings-sidebar-header">
              <h2 className="settings-sidebar-title">Cài đặt</h2>
            </div>
            <nav className="settings-nav">
              <button
                className={`settings-nav-item ${activeSection === "personal" ? "settings-nav-item--active" : ""}`}
                onClick={() => setActiveSection("personal")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span>Thông tin cá nhân</span>
              </button>
              <button
                className={`settings-nav-item ${activeSection === "security" ? "settings-nav-item--active" : ""}`}
                onClick={() => setActiveSection("security")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                </svg>
                <span>Mật khẩu và bảo mật</span>
              </button>
              <button
                className={`settings-nav-item ${activeSection === "privacy" ? "settings-nav-item--active" : ""}`}
                onClick={() => setActiveSection("privacy")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1C5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11S18.07 1 12 1zm0 18c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm0-11c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
                </svg>
                <span>Quyền riêng tư</span>
              </button>
              <button
                className={`settings-nav-item ${activeSection === "notifications" ? "settings-nav-item--active" : ""}`}
                onClick={() => setActiveSection("notifications")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                <span>Thông báo</span>
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="settings-main">
            {isLoading ? (
              <div className="settings-loading">Đang tải...</div>
            ) : (
              <>
                {activeSection === "personal" && (
                  <PersonalInfoSection user={currentUser} onUpdate={setCurrentUser} />
                )}
                {activeSection === "security" && <SecuritySection />}
                {activeSection === "privacy" && <PrivacySection />}
                {activeSection === "notifications" && <NotificationsSection />}
              </>
            )}
          </main>
        </div>
      </div>
    </AppLayout>
  );
}

// Personal Information Section
function PersonalInfoSection({
  user,
  onUpdate,
}: {
  user: User | null;
  onUpdate: (user: User) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);
    try {
      await updateUserProfile({
        name: name.trim(),
        username: username.trim() || undefined,
      });
      onUpdate({ ...user, name: name.trim(), username: username.trim() });
      setMessage({ type: "success", text: "Đã cập nhật thông tin thành công!" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Không thể cập nhật thông tin",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-section">
      <h1 className="settings-section-title">Thông tin cá nhân</h1>
      <p className="settings-section-description">
        Quản lý thông tin cá nhân của bạn. Thông tin này sẽ hiển thị với người khác.
      </p>

      <div className="settings-form">
        <div className="settings-form-group">
          <label className="settings-label">Tên</label>
          <input
            type="text"
            className="settings-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên của bạn"
          />
        </div>

        <div className="settings-form-group">
          <label className="settings-label">Tên người dùng</label>
          <input
            type="text"
            className="settings-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nhập tên người dùng"
          />
        </div>

        <div className="settings-form-group">
          <label className="settings-label">Email</label>
          <input
            type="email"
            className="settings-input settings-input--disabled"
            value={email}
            disabled
            placeholder="Email"
          />
          <p className="settings-hint">Email không thể thay đổi</p>
        </div>

        {message && (
          <div className={`settings-message settings-message--${message.type}`}>
            {message.text}
          </div>
        )}

        <button
          className="settings-button settings-button--primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}

// Security Section
function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ thông tin" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới không khớp" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu phải có ít nhất 6 ký tự" });
      return;
    }

    setIsChanging(true);
    setMessage(null);
    try {
      await changePassword(currentPassword, newPassword);
      setMessage({ type: "success", text: "Đã đổi mật khẩu thành công!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.error || "Không thể đổi mật khẩu",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="settings-section">
      <h1 className="settings-section-title">Mật khẩu và bảo mật</h1>
      <p className="settings-section-description">
        Thay đổi mật khẩu để bảo vệ tài khoản của bạn.
      </p>

      <div className="settings-form">
        <div className="settings-form-group">
          <label className="settings-label">Mật khẩu hiện tại</label>
          <input
            type="password"
            className="settings-input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>

        <div className="settings-form-group">
          <label className="settings-label">Mật khẩu mới</label>
          <input
            type="password"
            className="settings-input"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới"
          />
        </div>

        <div className="settings-form-group">
          <label className="settings-label">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            className="settings-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>

        {message && (
          <div className={`settings-message settings-message--${message.type}`}>
            {message.text}
          </div>
        )}

        <button
          className="settings-button settings-button--primary"
          onClick={handleChangePassword}
          disabled={isChanging}
        >
          {isChanging ? "Đang đổi..." : "Đổi mật khẩu"}
        </button>
      </div>
    </div>
  );
}

// Privacy Section
function PrivacySection() {
  return (
    <div className="settings-section">
      <h1 className="settings-section-title">Quyền riêng tư</h1>
      <p className="settings-section-description">
        Quản lý quyền riêng tư và cách người khác tìm thấy bạn.
      </p>
      <div className="settings-coming-soon">Tính năng đang được phát triển...</div>
    </div>
  );
}

// Notifications Section
function NotificationsSection() {
  return (
    <div className="settings-section">
      <h1 className="settings-section-title">Thông báo</h1>
      <p className="settings-section-description">
        Quản lý cách bạn nhận thông báo.
      </p>
      <div className="settings-coming-soon">Tính năng đang được phát triển...</div>
    </div>
  );
}
