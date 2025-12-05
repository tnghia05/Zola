"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getSocket } from "../socket";
import { Message, getOpponentInfo, getCurrentUserId, getUserById, getMessages } from "../api";

interface ChatWindow {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isOnline?: boolean;
}

interface ChatWindowsContextType {
  chatWindows: ChatWindow[];
  openChat: (userId: string, userName: string, userAvatar?: string, isOnline?: boolean) => void;
  closeChat: (userId: string) => void;
  minimizeChat: (userId: string) => void;
  restoreChat: (userId: string) => void;
  minimizedChats: Set<string>;
}

const ChatWindowsContext = createContext<ChatWindowsContextType | undefined>(undefined);

export const ChatWindowsProvider = ({ children }: { children: ReactNode }) => {
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);
  const [minimizedChats, setMinimizedChats] = useState<Set<string>>(new Set());

  const openChat = (userId: string, userName: string, userAvatar?: string, isOnline?: boolean) => {
    setChatWindows((prev) => {
      // Check if chat already exists
      const exists = prev.find((w) => w.userId === userId);
      if (exists) {
        // Remove from minimized if it was minimized
        setMinimizedChats((prevMin) => {
          const newMin = new Set(prevMin);
          newMin.delete(userId);
          return newMin;
        });
        return prev; // Already open
      }
      // Add new chat window
      return [
        ...prev,
        {
          id: `${userId}-${Date.now()}`,
          userId,
          userName,
          userAvatar,
          isOnline,
        },
      ];
    });
  };

  const closeChat = (userId: string) => {
    setChatWindows((prev) => prev.filter((w) => w.userId !== userId));
    setMinimizedChats((prev) => {
      const newMin = new Set(prev);
      newMin.delete(userId);
      return newMin;
    });
  };

  const minimizeChat = (userId: string) => {
    setMinimizedChats((prev) => {
      const newMin = new Set(prev);
      newMin.add(userId);
      return newMin;
    });
  };

  const restoreChat = (userId: string) => {
    setMinimizedChats((prev) => {
      const newMin = new Set(prev);
      newMin.delete(userId);
      return newMin;
    });
  };

  // Listen for new messages from all conversations and auto-open chat window
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn("⚠️ ChatWindows: Socket not available");
      return;
    }

    console.log("🔔 ChatWindows: Setting up socket listeners for auto-popup");

    const handleNewMessage = async (payload: any) => {
      console.log("📨 ChatWindows: Received message event:", payload);
      try {
        // Extract message and conversationId
        let message: Message;
        let conversationId: string;
        
        if ('conversationId' in payload && 'message' in payload) {
          message = payload.message;
          conversationId = payload.conversationId;
        } else if (payload._id && payload.conversationId) {
          // Direct message object
          message = payload as Message;
          conversationId = String(message.conversationId);
        } else {
          console.warn("⚠️ ChatWindows: Unknown payload format:", payload);
          return;
        }

        console.log("📨 ChatWindows: Extracted message:", { messageId: message._id, conversationId, senderId: message.senderId });

        // Get current user ID
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
          console.warn("⚠️ ChatWindows: No current user ID");
          return;
        }

        console.log("📨 ChatWindows: Current user ID:", currentUserId, "Sender ID:", message.senderId);

        // Only auto-open if message is from someone else (not from current user)
        if (message.senderId === currentUserId) {
          console.log("ℹ️ ChatWindows: Message from self, skipping auto-open");
          return;
        }

        // Get opponent info to find the userId
        try {
          console.log("📨 ChatWindows: Getting opponent info for conversation:", conversationId);
          const opponentInfo = await getOpponentInfo(conversationId);
          const opponentUserId = opponentInfo.user._id;
          console.log("📨 ChatWindows: Opponent info:", { userId: opponentUserId, name: opponentInfo.user.name });
          
          // Check if window already exists
          setChatWindows((prev) => {
            const exists = prev.some((w) => w.userId === opponentUserId);
            if (exists) {
              console.log("ℹ️ ChatWindows: Window already exists, removing from minimized");
              // Window exists, just remove from minimized if it was minimized
              setMinimizedChats((prevMin) => {
                const newMin = new Set(prevMin);
                newMin.delete(opponentUserId);
                return newMin;
              });
              return prev;
            }

            // Auto-open chat window
            console.log("🔔 ChatWindows: Auto-opening chat for new message from:", opponentInfo.user.name);
            const newWindow = {
              id: `${opponentUserId}-${Date.now()}`,
              userId: opponentUserId,
              userName: opponentInfo.user.name || opponentInfo.user.email || "User",
              userAvatar: opponentInfo.user.avatar,
              isOnline: opponentInfo.status?.isOnline || false,
            };
            console.log("✅ ChatWindows: Adding new window:", newWindow);
            return [...prev, newWindow];
          });
        } catch (error) {
          console.error("❌ ChatWindows: Failed to get opponent info:", error);
          // Fallback: try to get user info from senderId
          try {
            const sender = await getUserById(message.senderId);
            setChatWindows((prev) => {
              const exists = prev.some((w) => w.userId === message.senderId);
              if (!exists) {
                return [
                  ...prev,
                  {
                    id: `${message.senderId}-${Date.now()}`,
                    userId: message.senderId,
                    userName: sender.name || sender.email || "User",
                    userAvatar: sender.avatar,
                  },
                ];
              }
              return prev;
            });
          } catch (err) {
            console.error("❌ ChatWindows: Failed to get sender info:", err);
          }
        }
      } catch (error) {
        console.error("❌ ChatWindows: Error handling new message:", error);
      }
    };

    // Listen to all message events
    console.log("🔔 ChatWindows: Registering socket listeners...");
    socket.on('message:new', (payload) => {
      console.log("📨 ChatWindows: 'message:new' event received:", payload);
      handleNewMessage(payload);
    });
    socket.on('newMessage', (payload) => {
      console.log("📨 ChatWindows: 'newMessage' event received:", payload);
      handleNewMessage(payload);
    });
    socket.on('chatMessage', (payload) => {
      console.log("📨 ChatWindows: 'chatMessage' event received:", payload);
      handleNewMessage(payload);
    });
    
    // Also listen to conversation:update in case message comes through that
    const handleConversationUpdate = async (payload: any) => {
      console.log("📨 ChatWindows: 'conversation:update' event received:", payload);
      
      try {
        let conversationId: string | null = null;
        
        // Handle different payload formats
        if (Array.isArray(payload) && payload.length > 0) {
          const conv = payload[0];
          conversationId = conv._id || conv.conversationId;
        } else if (payload && typeof payload === 'object') {
          conversationId = payload.conversationId || payload._id;
        }
        
        if (!conversationId) {
          console.warn("⚠️ ChatWindows: No conversationId in conversation:update payload");
          return;
        }
        
        console.log("📨 ChatWindows: Processing conversation:update for:", conversationId);
        
        // Get current user ID
        const currentUserId = await getCurrentUserId();
        if (!currentUserId) {
          console.warn("⚠️ ChatWindows: No current user ID");
          return;
        }
        
        // Get the latest message from this conversation
        try {
          const messages = await getMessages(conversationId);
          const messagesArray = Array.isArray(messages) ? messages : (messages as any)?.messages || [];
          
          if (messagesArray.length === 0) {
            console.log("ℹ️ ChatWindows: No messages in conversation");
            return;
          }
          
          // Get the most recent message
          const latestMessage = messagesArray[messagesArray.length - 1];
          console.log("📨 ChatWindows: Latest message:", { messageId: latestMessage._id, senderId: latestMessage.senderId });
          
          // Only auto-open if message is from someone else
          if (latestMessage.senderId === currentUserId) {
            console.log("ℹ️ ChatWindows: Latest message from self, skipping");
            return;
          }
          
          // Check if this is a new message (not already in our windows)
          // We'll use the conversation update to trigger opening the chat
          console.log("🔔 ChatWindows: New message detected in conversation:update, opening chat...");
          
          // Get opponent info
          try {
            const opponentInfo = await getOpponentInfo(conversationId);
            const opponentUserId = opponentInfo.user._id;
            
            setChatWindows((prev) => {
              const exists = prev.some((w) => w.userId === opponentUserId);
              if (exists) {
                console.log("ℹ️ ChatWindows: Window already exists, removing from minimized");
                setMinimizedChats((prevMin) => {
                  const newMin = new Set(prevMin);
                  newMin.delete(opponentUserId);
                  return newMin;
                });
                return prev;
              }
              
              console.log("🔔 ChatWindows: Auto-opening chat from conversation:update");
              return [
                ...prev,
                {
                  id: `${opponentUserId}-${Date.now()}`,
                  userId: opponentUserId,
                  userName: opponentInfo.user.name || opponentInfo.user.email || "User",
                  userAvatar: opponentInfo.user.avatar,
                  isOnline: opponentInfo.status?.isOnline || false,
                },
              ];
            });
          } catch (error) {
            console.error("❌ ChatWindows: Failed to get opponent info:", error);
          }
        } catch (error) {
          console.error("❌ ChatWindows: Failed to get messages:", error);
        }
      } catch (error) {
        console.error("❌ ChatWindows: Error handling conversation:update:", error);
      }
    };
    
    socket.on('conversation:update', handleConversationUpdate);

    return () => {
      console.log("🔔 ChatWindows: Cleaning up socket listeners");
      socket.off('message:new', handleNewMessage);
      socket.off('newMessage', handleNewMessage);
      socket.off('chatMessage', handleNewMessage);
      socket.off('conversation:update', handleConversationUpdate);
    };
  }, []); // Empty deps - we use setChatWindows which is stable

  return (
    <ChatWindowsContext.Provider
      value={{
        chatWindows,
        openChat,
        closeChat,
        minimizeChat,
        restoreChat,
        minimizedChats,
      }}
    >
      {children}
    </ChatWindowsContext.Provider>
  );
};

export const useChatWindows = () => {
  const context = useContext(ChatWindowsContext);
  if (!context) {
    throw new Error("useChatWindows must be used within ChatWindowsProvider");
  }
  return context;
};

