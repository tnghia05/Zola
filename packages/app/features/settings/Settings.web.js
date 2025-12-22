"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "../../components/AppLayout";
import { FacebookNavbarWeb } from "../../components/FacebookNavbar.web";
import { LeftSidebar } from "../../components/LeftSidebar.web";
import { getCurrentUserId, getUserById, updateUserProfile, changePassword, } from "../../api";
import "../../styles/feed.css";
import "../../styles/settings.css";
export default function SettingsScreen() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("personal");
    const [currentUser, setCurrentUser] = useState(null);
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
            }
            catch (error) {
                console.error("Failed to load user:", error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);
    const header = (_jsx(FacebookNavbarWeb, { currentUser: currentUser ? { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar } : null }));
    const leftSidebar = (_jsx(LeftSidebar, { currentUser: currentUser ? { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar } : null, activeRoute: "/settings" }));
    return (_jsx(AppLayout, { header: header, leftSidebar: leftSidebar, hideSidebars: true, children: _jsx("div", { className: "settings-container", children: _jsxs("div", { className: "settings-layout", children: [_jsxs("aside", { className: "settings-sidebar", children: [_jsx("div", { className: "settings-sidebar-header", children: _jsx("h2", { className: "settings-sidebar-title", children: "C\u00E0i \u0111\u1EB7t" }) }), _jsxs("nav", { className: "settings-nav", children: [_jsxs("button", { className: `settings-nav-item ${activeSection === "personal" ? "settings-nav-item--active" : ""}`, onClick: () => setActiveSection("personal"), children: [_jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" }) }), _jsx("span", { children: "Th\u00F4ng tin c\u00E1 nh\u00E2n" })] }), _jsxs("button", { className: `settings-nav-item ${activeSection === "security" ? "settings-nav-item--active" : ""}`, onClick: () => setActiveSection("security"), children: [_jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" }) }), _jsx("span", { children: "M\u1EADt kh\u1EA9u v\u00E0 b\u1EA3o m\u1EADt" })] }), _jsxs("button", { className: `settings-nav-item ${activeSection === "privacy" ? "settings-nav-item--active" : ""}`, onClick: () => setActiveSection("privacy"), children: [_jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M12 1C5.93 1 1 5.93 1 12s4.93 11 11 11 11-4.93 11-11S18.07 1 12 1zm0 18c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7zm0-11c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" }) }), _jsx("span", { children: "Quy\u1EC1n ri\u00EAng t\u01B0" })] }), _jsxs("button", { className: `settings-nav-item ${activeSection === "notifications" ? "settings-nav-item--active" : ""}`, onClick: () => setActiveSection("notifications"), children: [_jsx("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", children: _jsx("path", { d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" }) }), _jsx("span", { children: "Th\u00F4ng b\u00E1o" })] })] })] }), _jsx("main", { className: "settings-main", children: isLoading ? (_jsx("div", { className: "settings-loading", children: "\u0110ang t\u1EA3i..." })) : (_jsxs(_Fragment, { children: [activeSection === "personal" && (_jsx(PersonalInfoSection, { user: currentUser, onUpdate: setCurrentUser })), activeSection === "security" && _jsx(SecuritySection, {}), activeSection === "privacy" && _jsx(PrivacySection, {}), activeSection === "notifications" && _jsx(NotificationsSection, {})] })) })] }) }) }));
}
// Personal Information Section
function PersonalInfoSection({ user, onUpdate, }) {
    const [name, setName] = useState(user?.name || "");
    const [username, setUsername] = useState(user?.username || "");
    const [email, setEmail] = useState(user?.email || "");
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setUsername(user.username || "");
            setEmail(user.email || "");
        }
    }, [user]);
    const handleSave = async () => {
        if (!user)
            return;
        setIsSaving(true);
        setMessage(null);
        try {
            await updateUserProfile({
                name: name.trim(),
                username: username.trim() || undefined,
            });
            onUpdate({ ...user, name: name.trim(), username: username.trim() });
            setMessage({ type: "success", text: "Đã cập nhật thông tin thành công!" });
        }
        catch (error) {
            setMessage({
                type: "error",
                text: error?.response?.data?.error || "Không thể cập nhật thông tin",
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsxs("div", { className: "settings-section", children: [_jsx("h1", { className: "settings-section-title", children: "Th\u00F4ng tin c\u00E1 nh\u00E2n" }), _jsx("p", { className: "settings-section-description", children: "Qu\u1EA3n l\u00FD th\u00F4ng tin c\u00E1 nh\u00E2n c\u1EE7a b\u1EA1n. Th\u00F4ng tin n\u00E0y s\u1EBD hi\u1EC3n th\u1ECB v\u1EDBi ng\u01B0\u1EDDi kh\u00E1c." }), _jsxs("div", { className: "settings-form", children: [_jsxs("div", { className: "settings-form-group", children: [_jsx("label", { className: "settings-label", children: "T\u00EAn" }), _jsx("input", { type: "text", className: "settings-input", value: name, onChange: (e) => setName(e.target.value), placeholder: "Nh\u1EADp t\u00EAn c\u1EE7a b\u1EA1n" })] }), _jsxs("div", { className: "settings-form-group", children: [_jsx("label", { className: "settings-label", children: "T\u00EAn ng\u01B0\u1EDDi d\u00F9ng" }), _jsx("input", { type: "text", className: "settings-input", value: username, onChange: (e) => setUsername(e.target.value), placeholder: "Nh\u1EADp t\u00EAn ng\u01B0\u1EDDi d\u00F9ng" })] }), _jsxs("div", { className: "settings-form-group", children: [_jsx("label", { className: "settings-label", children: "Email" }), _jsx("input", { type: "email", className: "settings-input settings-input--disabled", value: email, disabled: true, placeholder: "Email" }), _jsx("p", { className: "settings-hint", children: "Email kh\u00F4ng th\u1EC3 thay \u0111\u1ED5i" })] }), message && (_jsx("div", { className: `settings-message settings-message--${message.type}`, children: message.text })), _jsx("button", { className: "settings-button settings-button--primary", onClick: handleSave, disabled: isSaving, children: isSaving ? "Đang lưu..." : "Lưu thay đổi" })] })] }));
}
// Security Section
function SecuritySection() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChanging, setIsChanging] = useState(false);
    const [message, setMessage] = useState(null);
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
        }
        catch (error) {
            setMessage({
                type: "error",
                text: error?.response?.data?.error || "Không thể đổi mật khẩu",
            });
        }
        finally {
            setIsChanging(false);
        }
    };
    return (_jsxs("div", { className: "settings-section", children: [_jsx("h1", { className: "settings-section-title", children: "M\u1EADt kh\u1EA9u v\u00E0 b\u1EA3o m\u1EADt" }), _jsx("p", { className: "settings-section-description", children: "Thay \u0111\u1ED5i m\u1EADt kh\u1EA9u \u0111\u1EC3 b\u1EA3o v\u1EC7 t\u00E0i kho\u1EA3n c\u1EE7a b\u1EA1n." }), _jsxs("div", { className: "settings-form", children: [_jsxs("div", { className: "settings-form-group", children: [_jsx("label", { className: "settings-label", children: "M\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i" }), _jsx("input", { type: "password", className: "settings-input", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value), placeholder: "Nh\u1EADp m\u1EADt kh\u1EA9u hi\u1EC7n t\u1EA1i" })] }), _jsxs("div", { className: "settings-form-group", children: [_jsx("label", { className: "settings-label", children: "M\u1EADt kh\u1EA9u m\u1EDBi" }), _jsx("input", { type: "password", className: "settings-input", value: newPassword, onChange: (e) => setNewPassword(e.target.value), placeholder: "Nh\u1EADp m\u1EADt kh\u1EA9u m\u1EDBi" })] }), _jsxs("div", { className: "settings-form-group", children: [_jsx("label", { className: "settings-label", children: "X\u00E1c nh\u1EADn m\u1EADt kh\u1EA9u m\u1EDBi" }), _jsx("input", { type: "password", className: "settings-input", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), placeholder: "Nh\u1EADp l\u1EA1i m\u1EADt kh\u1EA9u m\u1EDBi" })] }), message && (_jsx("div", { className: `settings-message settings-message--${message.type}`, children: message.text })), _jsx("button", { className: "settings-button settings-button--primary", onClick: handleChangePassword, disabled: isChanging, children: isChanging ? "Đang đổi..." : "Đổi mật khẩu" })] })] }));
}
// Privacy Section
function PrivacySection() {
    return (_jsxs("div", { className: "settings-section", children: [_jsx("h1", { className: "settings-section-title", children: "Quy\u1EC1n ri\u00EAng t\u01B0" }), _jsx("p", { className: "settings-section-description", children: "Qu\u1EA3n l\u00FD quy\u1EC1n ri\u00EAng t\u01B0 v\u00E0 c\u00E1ch ng\u01B0\u1EDDi kh\u00E1c t\u00ECm th\u1EA5y b\u1EA1n." }), _jsx("div", { className: "settings-coming-soon", children: "T\u00EDnh n\u0103ng \u0111ang \u0111\u01B0\u1EE3c ph\u00E1t tri\u1EC3n..." })] }));
}
// Notifications Section
function NotificationsSection() {
    return (_jsxs("div", { className: "settings-section", children: [_jsx("h1", { className: "settings-section-title", children: "Th\u00F4ng b\u00E1o" }), _jsx("p", { className: "settings-section-description", children: "Qu\u1EA3n l\u00FD c\u00E1ch b\u1EA1n nh\u1EADn th\u00F4ng b\u00E1o." }), _jsx("div", { className: "settings-coming-soon", children: "T\u00EDnh n\u0103ng \u0111ang \u0111\u01B0\u1EE3c ph\u00E1t tri\u1EC3n..." })] }));
}
