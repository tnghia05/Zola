"use client";

import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { acceptCall, rejectCall, getOpponentInfo, getConversations, getCall } from "../api";
import "../styles/floating-chat.css";

type IncomingCallData = {
  callId: string;
  conversationId: string;
  initiatorId: string;
  type: "video" | "audio";
  roomId?: string;
  callType?: "p2p" | "sfu";
  livekitRoomName?: string;
};

export function GlobalIncomingCall() {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callerName, setCallerName] = useState<string>("Ai đó");
  const [callerAvatar, setCallerAvatar] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGroupCall, setIsGroupCall] = useState(false);
  const [groupName, setGroupName] = useState<string | null>(null);

  // Listen for socket events globally
  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.warn("[GlobalIncomingCall] Socket not available");
      return;
    }

    const handleIncomingCall = (data: IncomingCallData) => {
      console.log("[GlobalIncomingCall] Received call:incoming", data);
      const currentUserId = typeof window !== "undefined" ? window.localStorage.getItem("user_id") : null;

      // Bỏ qua cuộc gọi do chính mình tạo
      if (currentUserId && data.initiatorId === currentUserId) {
        console.log("[GlobalIncomingCall] Skip own outgoing call");
        return;
      }

      // Nếu đang xử lý cuộc gọi khác thì bỏ qua
      if (incomingCall || isProcessing) {
        console.log("[GlobalIncomingCall] Already handling a call, ignoring new one");
        return;
      }

      setIncomingCall(data);
    };

    console.log("[GlobalIncomingCall] Subscribing to call:incoming");
    socket.on("call:incoming", handleIncomingCall);

    return () => {
      console.log("[GlobalIncomingCall] Cleanup call:incoming listener");
      socket.off("call:incoming", handleIncomingCall);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall, isProcessing]);

  // Load caller/group info and call details
  useEffect(() => {
    if (!incomingCall) return;

    let cancelled = false;

    const loadInfo = async () => {
      try {
        // Fetch call info to get callType and livekitRoomName if not provided
        if (!incomingCall.callType || !incomingCall.livekitRoomName) {
          try {
            const callInfo = await getCall(incomingCall.callId);
            if (!cancelled && callInfo) {
              // Update incomingCall with call info
              setIncomingCall(prev => prev ? {
                ...prev,
                callType: callInfo.callType || prev.callType,
                livekitRoomName: callInfo.metadata?.livekitRoomName || prev.livekitRoomName,
              } : prev);
              console.log("[GlobalIncomingCall] Call info loaded:", {
                callType: callInfo.callType,
                livekitRoomName: callInfo.metadata?.livekitRoomName
              });
            }
          } catch (err) {
            console.warn("[GlobalIncomingCall] Could not fetch call info:", err);
          }
        }
        
        // Check if this is a group call by getting conversation info
        const conversations = await getConversations();
        const conversation = conversations.find((c: any) => c._id === incomingCall.conversationId);
        
        if (cancelled) return;
        
        if (conversation?.isGroup) {
          // Group call
          setIsGroupCall(true);
          setGroupName(conversation.title || `Nhóm (${conversation.members?.length || 0} thành viên)`);
          setCallerAvatar(conversation.avatar || null);
          
          // Also try to get the initiator's name
          try {
            const info = await getOpponentInfo(incomingCall.conversationId);
            if (!cancelled && info?.user?.name) {
              setCallerName(info.user.name);
            }
          } catch {
            // Ignore error, use group name
          }
        } else {
          // 1-1 call
          setIsGroupCall(false);
          setGroupName(null);
          const info = await getOpponentInfo(incomingCall.conversationId);
          if (cancelled) return;
          setCallerName(info?.user?.name || info?.user?.email || "Ai đó");
          setCallerAvatar(info?.user?.avatar || null);
        }
      } catch (err) {
        console.error("[GlobalIncomingCall] Failed to load caller info", err);
        if (!cancelled) {
          setCallerName("Ai đó");
          setCallerAvatar(null);
          setIsGroupCall(false);
        }
      }
    };

    loadInfo();

    return () => {
      cancelled = true;
    };
  }, [incomingCall?.callId, incomingCall?.conversationId]);

  const clearState = () => {
    setIncomingCall(null);
    setIsProcessing(false);
    setIsGroupCall(false);
    setGroupName(null);
    setCallerName("Ai đó");
    setCallerAvatar(null);
  };

  const handleAccept = async () => {
    if (!incomingCall || isProcessing) return;
    setIsProcessing(true);

    try {
      await acceptCall(incomingCall.callId);
    } catch (err) {
      console.error("[GlobalIncomingCall] Error accepting call (will still navigate)", err);
    }

    // Điều hướng sang màn hình call
    if (typeof window !== "undefined") {
      // Detect Electron: check electronAPI hoặc hash trong URL hoặc userAgent
      const isElectron = !!(
        (window as any).electronAPI ||
        window.location.hash.includes("#/") ||
        window.location.href.includes("/#/") ||
        navigator.userAgent.toLowerCase().includes("electron")
      );

      console.log("[GlobalIncomingCall] isElectron:", isElectron, "hash:", window.location.hash);

      if (isElectron) {
        // Electron dùng HashRouter
        const target = `#/call/${incomingCall.callId}`;
        console.log("[GlobalIncomingCall] Navigating via hash to call screen:", target);
        window.location.hash = target;
      } else {
        // Web dùng BrowserRouter
        const params = new URLSearchParams({
          callId: incomingCall.callId,
          conversationId: incomingCall.conversationId,
          acceptedFromModal: 'true',
          isIncoming: 'true',
        });
        
        // Add call type params if available
        if (incomingCall.callType) {
          params.set('callType', incomingCall.callType);
        } else if (isGroupCall) {
          // Group calls use SFU
          params.set('callType', 'sfu');
        }
        
        if (incomingCall.livekitRoomName) {
          params.set('livekitRoomName', incomingCall.livekitRoomName);
        }
        
        console.log("[GlobalIncomingCall] Navigating to call screen with params:", Object.fromEntries(params));
        window.location.href = `/call?${params.toString()}`;
      }
    }

    clearState();
  };

  const handleReject = async () => {
    if (!incomingCall || isProcessing) return;
    setIsProcessing(true);

    try {
      await rejectCall(incomingCall.callId);
    } catch (err) {
      console.error("[GlobalIncomingCall] Error rejecting call", err);
    }

    clearState();
  };

  // Auto dismiss after 30s
  useEffect(() => {
    if (!incomingCall) return;
    const timer = setTimeout(() => {
      console.log("[GlobalIncomingCall] Auto dismiss incoming call toast");
      clearState();
    }, 30000);
    return () => clearTimeout(timer);
  }, [incomingCall]);

  if (!incomingCall) return null;

  const displayName = isGroupCall ? (groupName || "Nhóm") : callerName;
  const displaySubtitle = isGroupCall 
    ? `${callerName} đang gọi ${incomingCall.type === "video" ? "video" : "thoại"} nhóm`
    : (incomingCall.type === "video" ? "Gọi video" : "Gọi thoại");

  return (
    <div
      className="global-incoming-call-overlay"
      onClick={(e) => {
        // chặn click xuyên qua
        e.stopPropagation();
      }}
    >
      <div className={`global-incoming-call-card ${isGroupCall ? "global-incoming-call-card--group" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="global-incoming-call-header">
          {isGroupCall ? "Cuộc gọi nhóm" : "Cuộc gọi đến"}
        </div>
        <div className="global-incoming-call-body">
          <div className={`global-incoming-call-avatar ${isGroupCall ? "global-incoming-call-avatar--group" : ""}`}>
            {callerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={callerAvatar} alt={displayName} />
            ) : (
              <div className="global-incoming-call-avatar-fallback">
                {isGroupCall ? "👥" : displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="global-incoming-call-info">
            <div className="global-incoming-call-name">{displayName}</div>
            <div className="global-incoming-call-type">
              {displaySubtitle}
            </div>
          </div>
        </div>
        <div className="global-incoming-call-actions">
          <button
            className="global-incoming-call-btn global-incoming-call-btn--reject"
            onClick={handleReject}
            disabled={isProcessing}
          >
            Từ chối
          </button>
          <button
            className="global-incoming-call-btn global-incoming-call-btn--accept"
            onClick={handleAccept}
            disabled={isProcessing}
          >
            Tham gia
          </button>
        </div>
      </div>
    </div>
  );
}


