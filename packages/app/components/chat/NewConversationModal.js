'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { createConversationWithUser, createGroupConversation, searchUsers, } from '../../api';
import '../../styles/new-conversation-modal.css';
export function NewConversationModal({ isOpen, onClose, onCreated }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const currentUserId = useMemo(() => {
        if (typeof window === 'undefined')
            return '';
        try {
            return window.localStorage.getItem('user_id') || '';
        }
        catch {
            return '';
        }
    }, []);
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUsers([]);
            setGroupName('');
            setError(null);
            setInfoMessage(null);
            setIsSearching(false);
            setIsSubmitting(false);
            return;
        }
        setGroupName('');
    }, [isOpen]);
    useEffect(() => {
        if (selectedUsers.length < 2 && groupName) {
            setGroupName('');
        }
    }, [selectedUsers.length, groupName]);
    useEffect(() => {
        let active = true;
        if (!isOpen) {
            return;
        }
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            setInfoMessage('Nhập ít nhất 2 ký tự để tìm kiếm');
            setError(null);
            return;
        }
        async function runSearch() {
            setIsSearching(true);
            setInfoMessage(null);
            try {
                const result = await searchUsers(searchQuery.trim());
                if (!active)
                    return;
                const filtered = result.users.filter((user) => user._id !== currentUserId);
                setSearchResults(filtered);
                setError(filtered.length === 0 ? 'Không tìm thấy người dùng phù hợp' : null);
            }
            catch (err) {
                console.error('Search users error:', err);
                if (!active)
                    return;
                setError('Không thể tìm kiếm lúc này, thử lại sau');
            }
            finally {
                if (active) {
                    setIsSearching(false);
                }
            }
        }
        const timeout = setTimeout(runSearch, 350);
        return () => {
            active = false;
            clearTimeout(timeout);
        };
    }, [searchQuery, isOpen, currentUserId]);
    const isSelected = (userId) => selectedUsers.some((user) => user._id === userId);
    const toggleUser = (user) => {
        setSelectedUsers((prev) => {
            if (prev.some((item) => item._id === user._id)) {
                return prev.filter((item) => item._id !== user._id);
            }
            return [...prev, user];
        });
    };
    const selectedIds = selectedUsers.map((user) => user._id);
    const handleCreate = async () => {
        if (selectedUsers.length === 0) {
            setError('Hãy chọn ít nhất một người dùng');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            let conversation;
            if (selectedUsers.length === 1) {
                conversation = await createConversationWithUser(selectedUsers[0]._id);
            }
            else {
                conversation = await createGroupConversation(selectedIds, groupName.trim() || undefined);
            }
            onCreated?.(conversation);
            onClose();
        }
        catch (err) {
            console.error('Create conversation error:', err);
            const apiError = err?.response?.data?.error || err?.message;
            setError(apiError || 'Không thể tạo cuộc trò chuyện, thử lại sau');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (!isOpen)
        return null;
    const canSubmit = selectedUsers.length >= 1 && !isSubmitting;
    const isGroup = selectedUsers.length >= 2;
    return (_jsx("div", { className: "new-conversation-modal-overlay", role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "new-conversation-modal", children: [_jsxs("header", { className: "new-conversation-modal__header", children: [_jsxs("div", { children: [_jsx("h2", { children: "T\u1EA1o cu\u1ED9c tr\u00F2 chuy\u1EC7n" }), _jsx("p", { children: "Ch\u1ECDn m\u1ED9t ho\u1EB7c nhi\u1EC1u ng\u01B0\u1EDDi \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u tr\u00F2 chuy\u1EC7n" })] }), _jsx("button", { className: "modal-close-btn", onClick: onClose, "aria-label": "\u0110\u00F3ng", children: "\u2715" })] }), _jsxs("div", { className: "new-conversation-modal__body", children: [isGroup && (_jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "groupName", children: "T\u00EAn nh\u00F3m" }), _jsx("input", { id: "groupName", type: "text", value: groupName, onChange: (e) => setGroupName(e.target.value), placeholder: "V\u00ED d\u1EE5: Nh\u00F3m d\u1EF1 \u00E1n, Team marketing..." }), _jsx("span", { className: "hint", children: "Nh\u00F3m s\u1EBD xu\u1EA5t hi\u1EC7n khi b\u1EA1n ch\u1ECDn t\u1EEB 2 ng\u01B0\u1EDDi tr\u1EDF l\u00EAn" })] })), _jsxs("div", { className: "form-group", children: [_jsx("label", { htmlFor: "searchUsers", children: "T\u00ECm ki\u1EBFm ng\u01B0\u1EDDi d\u00F9ng" }), _jsx("input", { id: "searchUsers", type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Nh\u1EADp t\u00EAn, email ho\u1EB7c username" })] }), isSearching && _jsx("div", { className: "hint", children: "\u0110ang t\u00ECm ki\u1EBFm..." }), infoMessage && !isSearching && _jsx("div", { className: "hint", children: infoMessage }), error && !isSearching && _jsx("div", { className: "error-message", children: error }), _jsx("div", { className: "search-results", children: searchResults.map((user) => (_jsxs("button", { type: "button", className: `search-result-item ${isSelected(user._id) ? 'selected' : ''}`, onClick: () => toggleUser(user), children: [_jsx("div", { className: "result-avatar", children: user.avatar ? (_jsx("img", { src: user.avatar, alt: user.name })) : (user.name?.[0]?.toUpperCase() || '?') }), _jsxs("div", { className: "result-info", children: [_jsx("div", { className: "result-name", children: user.name }), _jsxs("div", { className: "result-subline", children: [user.email, user.username ? ` · @${user.username}` : ''] })] }), isSelected(user._id) && _jsx("span", { className: "result-check", children: "\u2713" })] }, user._id))) }), selectedUsers.length > 0 && (_jsx("div", { className: "selected-users", children: selectedUsers.map((user) => (_jsxs("span", { className: "selected-chip", onClick: () => toggleUser(user), children: [user.name, _jsx("span", { className: "chip-remove", children: "\u2715" })] }, user._id))) }))] }), _jsxs("footer", { className: "new-conversation-modal__footer", children: [_jsx("button", { className: "secondary-btn", onClick: onClose, disabled: isSubmitting, children: "H\u1EE7y" }), _jsx("button", { className: "primary-btn", onClick: handleCreate, disabled: !canSubmit, children: isSubmitting ? 'Đang tạo...' : 'Tạo' })] })] }) }));
}
