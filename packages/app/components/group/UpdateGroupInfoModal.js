import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import '../../styles/group-modals.css';
export function UpdateGroupInfoModal({ isOpen, onClose, onSave, initialTitle, initialAvatar, }) {
    const [title, setTitle] = useState(initialTitle || '');
    const [avatar, setAvatar] = useState(initialAvatar || '');
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (isOpen) {
            setTitle(initialTitle || '');
            setAvatar(initialAvatar || '');
            setError(null);
        }
    }, [isOpen, initialTitle, initialAvatar]);
    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Tên nhóm không được để trống');
            return;
        }
        try {
            setSaving(true);
            await onSave({ title: title.trim(), avatar: avatar.trim() || undefined });
            onClose();
        }
        catch (err) {
            console.error('Update group info error', err);
            setError(err?.response?.data?.error || 'Không thể cập nhật nhóm');
        }
        finally {
            setSaving(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "group-modal-overlay", children: _jsxs("div", { className: "group-modal", children: [_jsxs("header", { className: "group-modal__header", children: [_jsx("h2", { children: "Ch\u1EC9nh s\u1EEDa nh\u00F3m" }), _jsx("button", { onClick: onClose, children: "\u2715" })] }), _jsxs("div", { className: "group-modal__body", children: [error && _jsx("div", { className: "error-message", children: error }), _jsx("label", { children: "T\u00EAn nh\u00F3m" }), _jsx("input", { value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Nh\u1EADp t\u00EAn nh\u00F3m m\u1EDBi" }), _jsx("label", { children: "\u1EA2nh nh\u00F3m (URL)" }), _jsx("input", { value: avatar, onChange: (e) => setAvatar(e.target.value), placeholder: "https://..." }), avatar && (_jsx("div", { className: "preview-avatar", children: _jsx("img", { src: avatar, alt: "preview" }) }))] }), _jsxs("footer", { className: "group-modal__footer", children: [_jsx("button", { className: "secondary-btn", onClick: onClose, disabled: saving, children: "H\u1EE7y" }), _jsx("button", { className: "primary-btn", onClick: handleSubmit, disabled: saving, children: saving ? 'Đang lưu...' : 'Lưu' })] })] }) }));
}
