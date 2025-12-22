import { jsx as _jsx } from "react/jsx-runtime";
export const CommentIcon = ({ size = 20, color, className = '' }) => {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 0 61 60", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: className, style: {
            display: 'inline-block',
            verticalAlign: 'middle',
            color: color || 'currentColor' // Dùng currentColor để inherit màu từ CSS
        }, children: _jsx("path", { fillRule: "evenodd", clipRule: "evenodd", d: "M60.0003 30C60.0003 13.4315 46.5689 0 30.0003 0C13.4318 0 0.00030899 13.4315 0.00030899 30C0.00030899 46.5685 13.4318 60 30.0003 60C35.9253 60 41.455 58.2799 46.1097 55.312L55.6783 58.661C58.4678 59.6373 61.1369 56.9305 60.1215 54.155L56.4606 44.1484C58.7197 39.9314 60.0003 35.112 60.0003 30ZM30.0003 5C43.8074 5 55.0003 16.1929 55.0003 30C55.0003 34.6245 53.747 38.9486 51.5631 42.6596C51.1839 43.304 51.113 44.0843 51.3699 44.7865L54.336 52.8938L46.5842 50.1807C45.8245 49.9148 44.9833 50.0309 44.3241 50.4926C40.2682 53.3334 35.3326 55 30.0003 55C16.1932 55 5.00031 43.8071 5.00031 30C5.00031 16.1929 16.1932 5 30.0003 5Z", fill: "currentColor" }) }));
};
export default CommentIcon;
