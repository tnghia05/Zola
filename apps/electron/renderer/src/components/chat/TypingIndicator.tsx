import { TypingUser } from '../../types/chat';

interface TypingIndicatorProps {
  users: TypingUser[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (!users.length) return null;

  const text =
    users.length === 1
      ? `${users[0].name ?? 'Ai đó'} đang nhập...`
      : `${users.length} người đang nhập...`;

  return <div className="chat-typing-indicator">{text}</div>;
}
