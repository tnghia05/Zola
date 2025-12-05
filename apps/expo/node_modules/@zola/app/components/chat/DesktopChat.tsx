import { useEffect, useState } from 'react';
import { ChatLayout } from './ChatLayout';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList/MessageList';
import { MessageComposer } from './MessageComposer/MessageComposer';
import { TypingIndicator } from './TypingIndicator';
import { ForwardMessageDialog } from './ForwardMessageDialog';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useOpponentInfo } from '../../hooks/useOpponentInfo';
import { useTypingStatus } from '../../hooks/useTypingStatus';
import { useNotifications } from '../../hooks/useNotifications';
import { ChatMessage } from '../../types/chat';
import { initiateCall } from '../../api';
import { CallPopupManager } from '../../services/callPopup';
import { DirectChatInfoPanel } from './DirectChatInfoPanel';

interface DesktopChatProps {
  conversationId: string;
  conversationName?: string;
  isGroup?: boolean;
  groupAvatar?: string;
  groupMemberCount?: number;
  memberIds?: string[];
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  onToggleInfo?: () => void;
  isInfoVisible?: boolean;
}

export function DesktopChat({
  conversationId,
  conversationName,
  isGroup,
  groupAvatar,
  groupMemberCount,
  memberIds,
  onTypingStart,
  onTypingStop,
  onToggleInfo,
  isInfoVisible,
}: DesktopChatProps) {
  // NOTE: navigate logic từ react-router-dom đã bỏ, Next sẽ điều hướng ở cấp trang.
  const {
    messages,
    loading,
    error,
    currentUserId,
    hasMore,
    sendMessage,
    markConversationAsRead,
    loadOlder,
    reactToMessage,
    togglePinMessage,
    editMessageContent,
    deleteMessageById,
    revokeMessageById,
    starMessageById,
  } = useChatMessages(conversationId);
  const shouldLoadOpponent = !isGroup;
  const { info: opponentInfo } = useOpponentInfo(shouldLoadOpponent ? conversationId : undefined);
  const typing = useTypingStatus(conversationId, currentUserId ?? undefined);
  useNotifications(conversationId); // Enable notifications
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);

  useEffect(() => {
    markConversationAsRead();
  }, [markConversationAsRead]);

  useEffect(() => {
    if (error) {
      console.error('Chat error:', error);
    }
  }, [error]);

  useEffect(() => {
    setReplyTarget(null);
    setEditingMessage(null);
    setComposerText('');
  }, [conversationId]);

  const headerTitle = isGroup
    ? conversationName ?? 'Nhóm'
    : opponentInfo?.name ?? conversationName ?? 'Đang tải...';
  const headerSubtitle = isGroup
    ? `${groupMemberCount ?? 0} thành viên`
    : opponentInfo
    ? opponentInfo.status === 'online'
      ? 'Đang hoạt động'
      : opponentInfo.lastSeen
      ? `Hoạt động: ${new Date(opponentInfo.lastSeen).toLocaleString('vi-VN')}`
      : 'Không hoạt động'
    : 'Đang tải...';

  const handleSend = async (payload: { text?: string; imageUrl?: string }) => {
    if (editingMessage) {
      if (payload.text && payload.text.trim()) {
        await editMessageContent(editingMessage._id, payload.text.trim());
      }
      setEditingMessage(null);
      setComposerText('');
      return;
    }

    await sendMessage({ ...payload, replyTo: replyTarget?._id });
    setReplyTarget(null);
    setComposerText('');
    typing.notifyMessageSent();
    onTypingStop?.();
  };

  const resolveTargetUserId = () => {
    if (isGroup) return undefined;
    if (!currentUserId) return undefined;
    if (opponentInfo?.userId && opponentInfo.userId !== currentUserId) {
      return opponentInfo.userId;
    }
    const listCandidate = memberIds?.find((id) => id && id !== currentUserId);
    if (listCandidate) {
      return listCandidate;
    }
    const otherSender = messages.find((msg) => msg.senderId && msg.senderId !== currentUserId);
    if (otherSender?.senderId) {
      return otherSender.senderId;
    }
    return undefined;
  };

  const handleVideoCall = async () => {
    if (!currentUserId) return;
    
    const targetUserId = resolveTargetUserId();
    
    if (!isGroup && !targetUserId) {
      console.warn('[DesktopChat] Cannot determine target user for video call');
      return;
    }
    
    try {
      console.log('[DesktopChat] Initiating video call...', { isGroup, targetUserId });
      const result = await initiateCall(conversationId, 'video', targetUserId);
      console.log('[DesktopChat] Call initiated:', result);
      if (!result.call?.id) {
        console.error('[DesktopChat] No call ID in response:', result);
        return;
      }

      const callType = result.call.callType === 'sfu' ? 'sfu' : 'p2p';
      const livekitRoomName = result.call.livekitRoomName;

      console.log('[DesktopChat] Opening call screen for initiator...', {
        callId: result.call.id,
        conversationId,
        callType,
        livekitRoomName,
      });

      const popup = new CallPopupManager();
      popup.openCallWindow(result.call.id, conversationId, false, {
        callType,
        livekitRoomName,
      });
    } catch (error) {
      console.error('[DesktopChat] Error initiating video call:', error);
    }
  };

  const handleAudioCall = async () => {
    if (!currentUserId) return;
    
    const targetUserId = resolveTargetUserId();
    
    if (!isGroup && !targetUserId) {
      console.warn('[DesktopChat] Cannot determine target user for audio call');
      return;
    }
    
    try {
      console.log('[DesktopChat] Initiating audio call...', { isGroup, targetUserId });
      const result = await initiateCall(conversationId, 'audio', targetUserId);
      console.log('[DesktopChat] Call initiated:', result);
      if (!result.call?.id) {
        console.error('[DesktopChat] No call ID in response:', result);
        return;
      }

      const callType = result.call.callType === 'sfu' ? 'sfu' : 'p2p';
      const livekitRoomName = result.call.livekitRoomName;

      console.log('[DesktopChat] Opening call screen for initiator (audio)...', {
        callId: result.call.id,
        conversationId,
        callType,
        livekitRoomName,
      });

      const popup = new CallPopupManager();
      popup.openCallWindow(result.call.id, conversationId, false, {
        callType,
        livekitRoomName,
      });
    } catch (error) {
      console.error('[DesktopChat] Error initiating audio call:', error);
    }
  };


  return (
    <>
      <ChatLayout
        header={
          <ChatHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            avatar={isGroup ? groupAvatar : opponentInfo?.avatar}
            statusDotColor={!isGroup && opponentInfo?.status === 'online' ? '#10B981' : undefined}
            onVideoCall={handleVideoCall}
            onAudioCall={handleAudioCall}
            onToggleInfo={onToggleInfo}
            isInfoVisible={isInfoVisible}
          />
        }
        messageArea={
          <>
            <MessageList
              messages={messages}
              currentUserId={currentUserId}
              loading={loading}
              hasMore={hasMore}
              opponentName={opponentInfo?.name}
              opponentAvatar={opponentInfo?.avatar}
              onLoadMore={loadOlder}
              onReply={(message) => {
                setEditingMessage(null);
                setReplyTarget(message);
                setComposerText('');
              }}
              onReact={(messageId, emoji) => reactToMessage(messageId, emoji)}
              onTogglePin={(messageId, shouldPin) => togglePinMessage(messageId, shouldPin)}
              onEdit={(message) => {
                setReplyTarget(null);
                setEditingMessage(message);
                setComposerText(message.text ?? '');
              }}
              onDelete={(message) => {
                deleteMessageById(message._id);
              }}
              onForward={(message) => {
                setForwardingMessage(message);
              }}
              onStar={(message) => {
                if (message.isStarred) return;
                starMessageById(message._id);
              }}
              onRevoke={(message) => {
                revokeMessageById(message._id);
              }}
              onScrollToMessage={(messageId) => {
                setPendingScrollId(messageId);
                loadOlder();
              }}
              focusMessageId={pendingScrollId}
              onFocusHandled={() => setPendingScrollId(null)}
            />
            <TypingIndicator users={typing.typingUsers} />
          </>
        }
        composer={
          <MessageComposer
            disabled={loading}
            replyPreview={replyTarget?.text}
            editingLabel={editingMessage ? 'Chỉnh sửa tin nhắn' : undefined}
            value={composerText}
            onValueChange={(value) => {
              setComposerText(value);
              typing.handleInputChange(value);
              if (value.trim()) {
                onTypingStart?.();
              } else {
                onTypingStop?.();
              }
            }}
            onCancelReply={() => setReplyTarget(null)}
            onCancelEdit={() => {
              setEditingMessage(null);
              setComposerText('');
            }}
            onSend={handleSend}
          />
        }
        rightPanel={
          !isGroup && isInfoVisible
            ? (
              <DirectChatInfoPanel
                conversation={{
                  _id: conversationId,
                  isGroup: false,
                  title: headerTitle,
                } as any}
                opponentName={opponentInfo?.name}
                opponentAvatar={opponentInfo?.avatar}
                messages={messages}
              />
            )
            : null
        }
      />
      <ForwardMessageDialog
        message={forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        onForwarded={() => {
          setForwardingMessage(null);
        }}
      />
    </>
  );
}
