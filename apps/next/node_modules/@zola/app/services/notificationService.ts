// Notification service for Electron
// electronAPI types are defined in types/electron.d.ts

export function showNotification(options: {
  title?: string;
  body?: string;
  icon?: string;
  conversationId?: string;
}) {
  if (typeof window !== 'undefined' && window.electronAPI?.showNotification) {
    return window.electronAPI.showNotification({
      ...options,
      onClick: options.conversationId ? { conversationId: options.conversationId } : undefined,
    });
  }
  
  // Fallback to browser notifications if Electron API not available
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(options.title || 'Tin nhắn mới', {
      body: options.body,
      icon: options.icon,
    });
    
    if (options.conversationId) {
      notification.onclick = () => {
        window.focus();
        // Navigate to conversation if needed
        const event = new CustomEvent('navigate-to-conversation', {
          detail: { conversationId: options.conversationId },
        });
        window.dispatchEvent(event);
      };
    }
    
    return Promise.resolve(true);
  }
  
  return Promise.resolve(false);
}

export async function requestNotificationPermission() {
  if (typeof window === 'undefined') return false;
  
  if (window.electronAPI) {
    // Electron handles permissions automatically
    return true;
  }
  
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }
  
  return false;
}

