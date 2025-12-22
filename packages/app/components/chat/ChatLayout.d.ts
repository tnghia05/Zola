import { ReactNode } from 'react';
import '../../styles/chat.css';
interface ChatLayoutProps {
    header: ReactNode;
    messageArea: ReactNode;
    composer: ReactNode;
    rightPanel?: ReactNode;
}
export declare function ChatLayout({ header, messageArea, composer, rightPanel }: ChatLayoutProps): import("react/jsx-runtime").JSX.Element;
export {};
