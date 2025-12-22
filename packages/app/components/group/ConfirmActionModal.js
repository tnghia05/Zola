import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import '../../styles/group-modals.css';
export function ConfirmActionModal({ isOpen, title, description, confirmLabel = 'Xác nhận', onClose, onConfirm, variant = 'danger', }) {
    if (!isOpen)
        return null;
    const handleConfirm = async () => {
        await onConfirm();
        onClose();
    };
    return (_jsx("div", { className: "group-modal-overlay", children: _jsxs("div", { className: "group-modal", children: [_jsxs("header", { className: "group-modal__header", children: [_jsx("h2", { children: title }), _jsx("button", { onClick: onClose, children: "\u2715" })] }), _jsx("div", { className: "group-modal__body", children: _jsx("p", { children: description }) }), _jsxs("footer", { className: "group-modal__footer", children: [_jsx("button", { className: "secondary-btn", onClick: onClose, children: "H\u1EE7y" }), _jsx("button", { className: `primary-btn ${variant === 'danger' ? 'danger' : ''}`, onClick: handleConfirm, children: confirmLabel })] })] }) }));
}
