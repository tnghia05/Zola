import { useParams } from 'react-router-dom';
import { DesktopChat } from '../components/chat/DesktopChat';

export default function ChatScreen() {
  const { conversationId } = useParams<{ conversationId: string }>();

  if (!conversationId) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          backgroundColor: '#0f172a',
        }}
      >
        Không tìm thấy cuộc trò chuyện.
      </div>
    );
  }

  return <DesktopChat conversationId={conversationId} />;
}

