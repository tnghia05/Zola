import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { searchUsers } from '../../api';
import '../../styles/group-modals.css';
export function AddMembersModal({ isOpen, onClose, onConfirm, conversation }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelected(new Set());
            setError(null);
        }
    }, [isOpen]);
    useEffect(() => {
        let active = true;
        if (!isOpen || query.trim().length < 2) {
            setResults([]);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                const res = await searchUsers(query.trim());
                if (!active)
                    return;
                const conversationMemberSet = new Set(conversation.members.map((m) => String(m)));
                const filtered = res.users.filter((user) => !conversationMemberSet.has(user._id));
                setResults(filtered);
            }
            catch (err) {
                console.error('Search users error', err);
                if (active)
                    setError('Không thể tìm kiếm người dùng, thử lại sau');
            }
            finally {
                if (active)
                    setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [isOpen, query, conversation.members]);
    const toggleUser = (userId) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            }
            else {
                next.add(userId);
            }
            return next;
        });
    };
    const handleConfirm = async () => {
        if (selected.size === 0) {
            setError('Hãy chọn ít nhất một người');
            return;
        }
        try {
            setSubmitting(true);
            await onConfirm(Array.from(selected));
            onClose();
        }
        catch (err) {
            console.error('Add members error', err);
            setError(err?.response?.data?.error || 'Không thể thêm thành viên');
        }
        finally {
            setSubmitting(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "group-modal-overlay", children: _jsxs("div", { className: "group-modal", children: [_jsxs("header", { className: "group-modal__header", children: [_jsx("h2", { children: "Th\u00EAm th\u00E0nh vi\u00EAn" }), _jsx("button", { onClick: onClose, children: "\u2715" })] }), _jsxs("div", { className: "group-modal__body", children: [_jsx("input", { type: "text", placeholder: "Nh\u1EADp t\u00EAn/email \u0111\u1EC3 t\u00ECm ki\u1EBFm", value: query, onChange: (e) => setQuery(e.target.value) }), loading && _jsx("div", { className: "hint", children: "\u0110ang t\u00ECm..." }), error && _jsx("div", { className: "error-message", children: error }), _jsxs("div", { className: "group-modal__list", children: [results.map((user) => (_jsxs("button", { type: "button", className: `group-modal__item ${selected.has(user._id) ? 'selected' : ''}`, onClick: () => toggleUser(user._id), children: [_jsx("div", { className: "member-avatar", children: user.avatar ? _jsx("img", { src: user.avatar, alt: user.name }) : user.name.slice(0, 2).toUpperCase() }), _jsxs("div", { className: "member-meta", children: [_jsx("div", { children: user.name }), _jsx("span", { className: "member-email", children: user.email })] }), selected.has(user._id) && _jsx("span", { children: "\u2713" })] }, user._id))), !loading && results.length === 0 && query.length >= 2 && (_jsx("div", { className: "hint", children: "Kh\u00F4ng t\u00ECm th\u1EA5y ng\u01B0\u1EDDi d\u00F9ng n\u00E0o" }))] })] }), _jsxs("footer", { className: "group-modal__footer", children: [_jsx("button", { className: "secondary-btn", onClick: onClose, disabled: submitting, children: "H\u1EE7y" }), _jsx("button", { className: "primary-btn", onClick: handleConfirm, disabled: submitting, children: submitting ? 'Đang thêm...' : 'Thêm thành viên' })] })] }) }));
}
