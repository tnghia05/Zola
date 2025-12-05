import { ReactNode } from 'react';
import '../../styles/chat.css';

interface ChatLayoutProps {
  header: ReactNode;
  messageArea: ReactNode;
  composer: ReactNode;
  rightPanel?: ReactNode;
}

export function ChatLayout({ header, messageArea, composer, rightPanel }: ChatLayoutProps) {
  return (
    <div className="chat-container">
      <div className="chat-main">
        <div className="chat-header">{header}</div>
        <div className="chat-content">{messageArea}</div>
        <div className="chat-composer">{composer}</div>
      </div>
      {rightPanel ? <aside className="chat-side-panel">{rightPanel}</aside> : null}
    </div>
  );
}
