import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
const DEFAULT_REASONS = [
    "Spam hoặc quảng cáo",
    "Nội dung phản cảm",
    "Tin giả/misleading",
    "Quấy rối hoặc thù địch",
    "Vi phạm bản quyền",
    "Khác",
];
export const ReportPostModal = ({ isOpen, post, onClose, onSubmit, isSubmitting }) => {
    const [reason, setReason] = useState(DEFAULT_REASONS[0]);
    const [details, setDetails] = useState("");
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!isOpen) {
            setReason(DEFAULT_REASONS[0]);
            setDetails("");
            setError(null);
        }
    }, [isOpen]);
    if (!isOpen || !post) {
        return null;
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason || reason.trim().length < 3) {
            setError("Vui lòng chọn lý do");
            return;
        }
        try {
            await onSubmit({ reason, details: details.trim() ? details.trim() : undefined });
        }
        catch (err) {
            setError(err?.message || "Không thể gửi báo cáo lúc này");
        }
    };
    return (_jsx("div", { className: "report-modal-overlay", children: _jsxs("div", { className: "report-modal-card", children: [_jsxs("div", { className: "report-modal-header", children: [_jsxs("div", { children: [_jsx("h3", { children: "B\u00E1o c\u00E1o b\u00E0i vi\u1EBFt" }), _jsxs("p", { children: ["B\u00E0i vi\u1EBFt c\u1EE7a ", post.author?.name || "người dùng"] })] }), _jsx("button", { className: "report-modal-close", onClick: onClose, children: "\u2715" })] }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "report-modal-section", children: [_jsx("label", { className: "report-modal-label", children: "L\u00FD do" }), _jsx("div", { className: "report-modal-reasons", children: DEFAULT_REASONS.map((item) => (_jsxs("label", { className: "report-reason-option", children: [_jsx("input", { type: "radio", name: "report-reason", value: item, checked: reason === item, onChange: () => setReason(item), disabled: isSubmitting }), _jsx("span", { children: item })] }, item))) })] }), _jsxs("div", { className: "report-modal-section", children: [_jsxs("label", { className: "report-modal-label", children: ["M\u00F4 t\u1EA3 th\u00EAm ", _jsx("span", { style: { opacity: 0.6 }, children: "(tu\u1EF3 ch\u1ECDn)" })] }), _jsx("textarea", { className: "report-modal-textarea", placeholder: "Nh\u1EADp m\u00F4 t\u1EA3 chi ti\u1EBFt n\u1EBFu c\u1EA7n...", value: details, onChange: (e) => setDetails(e.target.value), disabled: isSubmitting, rows: 4 })] }), error && _jsx("div", { className: "report-modal-error", children: error }), _jsxs("div", { className: "report-modal-actions", children: [_jsx("button", { type: "button", className: "report-modal-secondary", onClick: onClose, disabled: isSubmitting, children: "Hu\u1EF7" }), _jsx("button", { type: "submit", className: "report-modal-primary", disabled: isSubmitting, children: isSubmitting ? "Đang gửi..." : "Gửi báo cáo" })] })] })] }) }));
};
export default ReportPostModal;
