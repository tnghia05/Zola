"use client";

import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { acceptCall, rejectCall, getOpponentInfo } from "../api";

type IncomingCallData = {
  callId: string;
  conversationId: string;
  initiatorId: string;
  type: "video" | "audio";
  roomId?: string;
};

export function GlobalIncomingCall() {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callerName, setCallerName] = useState<string>("Ai đó");
  const [callerAvatar, setCallerAvatar] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Load caller info
  useEffect(() => {
    if (!incomingCall) return;

    let cancelled = false;

    const loadInfo = async () => {
      try {
        const info = await getOpponentInfo(incomingCall.conversationId);
        if (cancelled) return;
        setCallerName(info?.user?.name || info?.user?.email || "Ai đó");
        setCallerAvatar(info?.user?.avatar || null);
      } catch (err) {
        console.error("[GlobalIncomingCall] Failed to load caller info", err);
        if (!cancelled) {
          setCallerName("Ai đó");
          setCallerAvatar(null);
        }
      }
    };

    loadInfo();

    return () => {
      cancelled = true;
    };
  }, [incomingCall]);

  const clearState = () => {
    setIncomingCall(null);
    setIsProcessing(false);
  };

  const handleAccept = async () => {
    if (!incomingCall || isProcessing) return;
    setIsProcessing(true);

    try {
      await acceptCall(incomingCall.callId);
    } catch (err) {
      console.error("[GlobalIncomingCall] Error accepting call (will still navigate)", err);
    }

    // Điều hướng sang màn hình call của web
    if (typeof window !== "undefined") {
      const url = `/call?callId=${encodeURIComponent(incomingCall.callId)}&conversationId=${encodeURIComponent(
        incomingCall.conversationId
      )}&acceptedFromModal=true`;
      window.location.href = url;
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

  return (
    <div
      className="global-incoming-call-overlay"
      onClick={(e) => {
        // chặn click xuyên qua
        e.stopPropagation();
      }}
    >
      <div className="global-incoming-call-card" onClick={(e) => e.stopPropagation()}>
        <div className="global-incoming-call-header">Cuộc gọi đến</div>
        <div className="global-incoming-call-body">
          <div className="global-incoming-call-avatar">
            {callerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={callerAvatar} alt={callerName} />
            ) : (
              <div className="global-incoming-call-avatar-fallback">
                {callerName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="global-incoming-call-info">
            <div className="global-incoming-call-name">{callerName}</div>
            <div className="global-incoming-call-type">
              {incomingCall.type === "video" ? "Gọi video" : "Gọi thoại"}
            </div>
          </div>
        </div>
        <div className="global-incoming-call-actions">
          <button
            className="global-incoming-call-btn global-incoming-call-btn--reject"
            onClick={handleReject}
            disabled={isProcessing}
          >
            Kết thúc
          </button>
          <button
            className="global-incoming-call-btn global-incoming-call-btn--accept"
            onClick={handleAccept}
            disabled={isProcessing}
          >
            Trả lời
          </button>
        </div>
      </div>
    </div>
  );
}


