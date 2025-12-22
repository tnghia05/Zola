export class CallPopupManager {
  private callWindow: Window | null = null;
  private callUrl: string;

  constructor() {
    this.callUrl = typeof window !== 'undefined' ? `${window.location.origin}/call` : '';
  }

  private isElectron(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).electronAPI ||
      window.location.hash.includes('#/') ||
      window.location.href.includes('/#/') ||
      navigator.userAgent.toLowerCase().includes('electron')
    );
  }

  openCallWindow(
    callId: string,
    conversationId: string,
    isIncoming: boolean = false,
    options?: { callType?: 'p2p' | 'sfu'; livekitRoomName?: string }
  ) {
    // Service này chỉ dùng cho web; nếu không có window thì bỏ qua
    if (typeof window === "undefined") {
      console.log('Call popup only works in browser environment');
      return null;
    }

    // Detect Electron và dùng hash navigation
    if (this.isElectron()) {
      const target = `#/call/${callId}`;
      console.log('📞 [CALLPOPUP] Electron detected, navigating via hash:', target);
      window.location.hash = target;
      return window;
    }

    // Web: dùng query params
    const callParams = new URLSearchParams({
      callId,
      conversationId,
      isIncoming: isIncoming.toString()
    });
    if (options?.callType) {
      callParams.set('callType', options.callType);
    }
    if (options?.livekitRoomName) {
      callParams.set('livekitRoomName', options.livekitRoomName);
    }

    const fullUrl = `${this.callUrl}?${callParams}`;
    console.log('📞 [CALLPOPUP] Navigating to call URL in same tab:', fullUrl);

    // Đơn giản: mở màn hình call ngay trong tab hiện tại để tránh popup bị chặn
    window.location.href = fullUrl;

    return window;
  }

  closeCallWindow() {
    if (this.callWindow && !this.callWindow.closed) {
      this.callWindow.close();
    }
    this.callWindow = null;
  }

  private endCall() {
    // Emit end call event to parent window
    if (typeof window !== 'undefined' && window.opener) {
      window.opener.postMessage({ type: 'CALL_ENDED' }, '*');
    }
  }
}
