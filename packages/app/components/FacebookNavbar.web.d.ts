import "../styles/facebook-navbar.css";
interface FacebookNavbarWebProps {
    currentUser?: {
        _id: string;
        name: string;
        avatar?: string;
    } | null;
    onLogout?: () => void;
}
export declare const FacebookNavbarWeb: ({ currentUser, onLogout }: FacebookNavbarWebProps) => import("react/jsx-runtime").JSX.Element;
export {};
