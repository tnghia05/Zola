import { io, Socket } from 'socket.io-client';

const SOCKET_BASE_URL = 'https://backend36.dev';

let socket: Socket | null = null;
let isConnecting = false;
let connectionPromise: Promise<Socket | null> | null = null;

export const connectSocket = (token: string) => {
  if (socket?.connected) {
    console.log('🔍 Socket already connected, returning existing socket');
    return socket;
  }
  
  if (isConnecting && connectionPromise) {
    console.log('🔍 Socket connection already in progress, waiting...');
    return connectionPromise;
  }
  
  if (socket) {
    console.log('🔧 Clearing existing socket before creating new one');
    socket.disconnect();
    socket = null;
  }
  
  isConnecting = true;
  
  connectionPromise = new Promise(async (resolve) => {
    console.log('🔍 Creating new socket connection to:', SOCKET_BASE_URL);
    
    const connectionOptions = {
      // Use polling only to avoid websocket upgrade issues
      transports: ['polling'],
      upgrade: false, // Disable websocket upgrade to avoid 400 errors
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      timeout: 30000,
      withCredentials: true,
      auth: { token },
      path: '/socket.io',
      forceNew: false,
      rememberUpgrade: false,
      autoConnect: true,
    };
    
    socket = io(SOCKET_BASE_URL, connectionOptions);
    try {
      (window as any).__socket = socket;
    } catch (err) {
      console.warn('[Socket] Unable to set window.__socket reference:', err);
    }
    
    setupSocketListeners(token);
    
    const waitForConnection = () => {
      if (socket && socket.connected) {
        console.log('🔧 Socket fully connected, resolving...');
        isConnecting = false;
        resolve(socket);
      } else {
        setTimeout(waitForConnection, 100);
      }
    };
    waitForConnection();
  });
  
  return connectionPromise;
};

const setupSocketListeners = (token: string) => {
  if (!socket) return;
  
  socket.on('connect', () => {
    console.log('✅ WebSocket connected successfully');
    console.log('🔍 Socket ID:', socket?.id);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        const exp = payload.exp;
        console.log('🔍 JWT Token expires at:', new Date(exp * 1000));
        
        if (exp < now) {
          console.error('❌ JWT Token expired!');
          socket?.disconnect();
          return;
        }
      } catch (error) {
        console.error('❌ JWT Token invalid:', error);
      }
    }
    
    socket?.emit('test-connection', { 
      platform: 'electron',
      timestamp: Date.now()
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket disconnected, reason:', reason);
    
    if (reason === 'io client disconnect') {
      console.log('🔍 Client initiated disconnect - not auto-reconnecting');
      return;
    }
    
    console.log('🔧 Auto-reconnecting for server disconnect...');
    setTimeout(() => {
      if (socket && !socket.connected) {
        socket.connect();
      }
    }, 2000);
  });
  
  socket.on('connect_error', (error) => {
    console.log('❌ WebSocket connection error:', error.message);
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔧 Socket reconnection attempt:', attemptNumber);
  });
  
  socket.on('reconnect_error', (error) => {
    console.log('❌ Socket reconnection error:', error);
  });
  
  socket.on('reconnect_failed', () => {
    console.log('❌ Socket reconnection failed');
  });
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  isConnecting = false;
};

export const reconnectSocket = (token: string) => {
  console.log('🔧 Force reconnecting socket with new token...');
  disconnectSocket();
  return connectSocket(token);
};

