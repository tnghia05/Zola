import { io, Socket } from 'socket.io-client';

// Simplified socket configuration - always use VPS server
const isWeb = typeof window !== 'undefined';
// Check if using ngrok tunnel
const isNgrok = isWeb && window?.location?.hostname && window.location.hostname.includes('ngrok');
// Use HTTP for now since backend doesn't support HTTPS/WSS
const SOCKET_BASE_URL = 'https://backend36.dev';

console.log('🔍 Platform detection:', { isWeb });
console.log('🔍 Socket URL:', SOCKET_BASE_URL);
console.log('🔍 App Version: 1.1.0');
console.log('🔍 Build Number: 017');
console.log('🔍 Cache busting timestamp:', Date.now());
console.log('🔍 Force refresh required - clear browser cache!');
console.log('🔍 Current URL:', typeof window !== 'undefined' && window?.location ? window.location.href : 'N/A');

let socket: Socket | null = null;
let isConnecting = false;
let connectionPromise: Promise<Socket | null> | null = null;
// ════════════════════════════════════════════════════════════
// WEBSOCKET CONNECTION - TCP-based, Full-Duplex
// ════════════════════════════════════════════════════════════
export const connectSocket = (token: string) => {
	if (socket?.connected) {
		console.log('🔍 Socket already connected, returning existing socket');
		console.log('🔍 Current socket ID:', socket.id);
		return socket;
	}
	
	if (isConnecting && connectionPromise) {
		console.log('🔍 Socket connection already in progress, waiting...');
		return connectionPromise;
	}
	
	// Clear any existing socket before creating new one
	if (socket) {
		console.log('🔧 Clearing existing socket before creating new one');
		socket.disconnect();
		socket = null;
	}
	
	isConnecting = true;
	
	// Create connection promise to avoid multiple simultaneous connections
	connectionPromise = new Promise(async (resolve) => {
	console.log('🔍 Creating new socket connection to:', SOCKET_BASE_URL || 'same-origin');
	console.log('🔍 Using token:', token ? 'Present' : 'Missing');
		console.log('🔍 Platform:', isWeb ? 'Web' : 'Mobile');
	
	// Clear any existing socket first (both web and mobile)
	if (socket) {
		console.log('🔧 Clearing existing socket before creating new connection');
		socket.disconnect();
		socket = null;
	}
	
	// Try to connect with retry logic
	let connectionAttempts = 0;
	const maxAttempts = 3;
	
	const tryConnect = (url: string) => {
		connectionAttempts++;
		console.log(`🔧 Connection attempt ${connectionAttempts}/${maxAttempts} to:`, url);
				// 🏗️ SOCKET TẠO Ở ĐÂY - Lần thử connect

		return new Promise((resolve, reject) => {
		const testSocket = io(url, {
			transports: isWeb ? ['polling'] : ['websocket', 'polling'],
			upgrade: isWeb ? false : true,
			timeout: 10000,
			auth: { token },
			path: '/socket.io',
			// Add debug options
			forceNew: true,
			rememberUpgrade: false,
			// Add connection debugging
			autoConnect: true,
			withCredentials: true,
		});
		
		// Add debug listeners to test socket
		testSocket.on('connect', () => {
			console.log('🔧 Test socket connected to:', url);
		});
		
		testSocket.on('disconnect', (reason) => {
			console.log('🔧 Test socket disconnected from:', url, 'reason:', reason);
		});
		
		testSocket.on('connect_error', (error) => {
			console.log('🔧 Test socket connect error:', url, error.message);
		});
		
		// Handle connection success
		testSocket.on('connect', () => {
			console.log('✅ Connection successful to:', url);
			// Don't disconnect the test socket - use it as the main socket
			resolve(testSocket as Socket);
		});
		
		// Handle connection error
		testSocket.on('connect_error', (error) => {
			console.log('❌ Connection failed to:', url, error.message);
			testSocket.disconnect();
			reject(error);
		});
		
		// Timeout after 10 seconds - only if not connected
		setTimeout(() => {
			if (!testSocket.connected) {
				console.log('⏰ Connection timeout to:', url);
				testSocket.disconnect();
				reject(new Error('Connection timeout'));
			}
		}, 10000);
		});
	};
	
		// Simple connection to VPS server
		const connectToServer = async () => {
			try {
				console.log(`🔧 Connecting to: ${SOCKET_BASE_URL}`);
				socket = await tryConnect(SOCKET_BASE_URL) as Socket;
				console.log('✅ Successfully connected to:', SOCKET_BASE_URL);
			} catch (error) {
				console.error('❌ Failed to connect to server:', error);
				console.error('❌ Backend server may be down or unreachable');
				console.error('❌ Please check if backend server is running');
						// 🏗️ SOCKET TẠO Ở ĐÂY - Fallback khi tryConnect() fail

				// Create a fallback socket with Netlify-compatible settings
				socket = io(SOCKET_BASE_URL, {
					transports: isWeb ? ['polling'] : ['websocket', 'polling'],
					upgrade: isWeb ? false : true,
					timeout: 10000,
					auth: { token },
					path: '/socket.io',
					// Netlify-specific options
					forceNew: true,
					rememberUpgrade: false,
					autoConnect: true,
					withCredentials: true,
				});
			}
		};
	
		// Try multiple connection strategies
		const connectionOptions = {
			// Use polling first for Netlify to avoid Mixed Content Error
			transports: isWeb ? ['polling'] : ['websocket', 'polling'],
			upgrade: isWeb ? false : true,
			reconnection: true,
			reconnectionAttempts: 15,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 15000,
			timeout: 30000,
			withCredentials: true,
			auth: { token },
			path: '/socket.io',
			// Add extra options for better connection
			forceNew: true,
			rememberUpgrade: false,
			// Add extra options for better reliability
			autoConnect: true,
			reconnectionDelayFactor: 1.5,
			maxReconnectionAttempts: 15,
		};
	
		// Connect to VPS server
				// 🏗️ SOCKET TẠO Ở ĐÂY - Fallback nếu không có socket

		connectToServer().then(() => {
			if (!socket) {
				console.log('🔧 Creating fallback socket connection');
				socket = io(SOCKET_BASE_URL, connectionOptions);
				
				// Add immediate debug listeners
				socket.on('connect', () => {
					console.log('🔧 Fallback socket connected');
				});
				
				socket.on('disconnect', (reason) => {
					console.log('🔧 Fallback socket disconnected:', reason);
				});
				
				socket.on('connect_error', (error) => {
					console.log('🔧 Fallback socket connect error:', error.message);
				});
				
				setupSocketListeners(token);
			} else {
				console.log('🔧 Socket already connected, setting up listeners');
				setupSocketListeners(token);
			}
			
			// Wait for socket to be fully connected
			const waitForConnection = () => {
				if (socket && socket.connected) {
					console.log('🔧 Socket fully connected, resolving...');
					isConnecting = false;
					resolve(socket);
				} else {
					console.log('🔧 Waiting for socket to be fully connected...');
					setTimeout(waitForConnection, 100);
				}
			};
			waitForConnection();
		}).catch((error) => {
			console.log('🔧 Connection failed, creating fallback socket');
			console.log('🔧 Connection error:', error);
			socket = io(SOCKET_BASE_URL, connectionOptions);
			
			// Add immediate debug listeners for fallback
			socket.on('connect', () => {
				console.log('🔧 Catch fallback socket connected');
			});
			
			socket.on('disconnect', (reason) => {
				console.log('🔧 Catch fallback socket disconnected:', reason);
			});
			
			socket.on('connect_error', (error) => {
				console.log('🔧 Catch fallback socket connect error:', error.message);
			});
			
			setupSocketListeners(token);
			
			// Wait for fallback socket to be connected
			const waitForFallback = () => {
				if (socket && socket.connected) {
					console.log('🔧 Fallback socket connected, resolving...');
					isConnecting = false;
					resolve(socket);
				} else {
					console.log('🔧 Waiting for fallback socket to be connected...');
					setTimeout(waitForFallback, 100);
				}
			};
			waitForFallback();
		});
	});
	
	return connectionPromise;
};

// Setup socket listeners
const setupSocketListeners = (token: string) => {
		if (!socket) return;
	
	// Add debug logs
	socket.on('connect', () => {
		console.log('✅ WebSocket connected successfully');
		console.log('🔍 Socket ID:', socket?.id);
			console.log('🔍 Socket URL:', SOCKET_BASE_URL);
			console.log('🔍 Socket transport:', socket?.io?.engine?.transport?.name);
			console.log('🔍 Platform:', isWeb ? 'Web' : 'Mobile');
			console.log('🔍 Token present:', !!token);
			console.log('🔍 Socket connected state:', socket?.connected);
			console.log('🔍 Socket io engine:', socket?.io?.engine?.readyState);
			
			// Check JWT token expiration
			if (token) {
				try {
					const payload = JSON.parse(atob(token.split('.')[1]));
					const now = Math.floor(Date.now() / 1000);
					const exp = payload.exp;
					console.log('🔍 JWT Token expires at:', new Date(exp * 1000));
					console.log('🔍 Current time:', new Date(now * 1000));
					console.log('🔍 Token valid for:', Math.floor((exp - now) / 60), 'minutes');
					
					if (exp < now) {
						console.error('❌ JWT Token expired!');
						socket?.disconnect();
						return;
					}
				} catch (error) {
					console.error('❌ JWT Token invalid:', error);
				}
			}
			
			// Emit a test event to verify connection
			socket?.emit('test-connection', { 
				platform: isWeb ? 'web' : 'mobile',
				timestamp: Date.now()
			});
			
			// Don't auto-join conversation - let Chat component handle this
	});
	
	socket.on('disconnect', (reason) => {
		console.log('❌ WebSocket disconnected, reason:', reason);
		console.log('❌ Socket ID before disconnect:', socket?.id);
		console.log('❌ Socket connected state before disconnect:', socket?.connected);
		console.log('❌ Socket transport before disconnect:', socket?.io?.engine?.transport?.name);
		
	// Don't auto-reconnect for client disconnect to avoid loops
	if (reason === 'io client disconnect') {
		console.log('🔍 Client initiated disconnect - not auto-reconnecting to avoid loops');
		return;
	}
	
	// Auto-reconnect for server disconnect
	console.log('🔧 Auto-reconnecting for server disconnect...');
	setTimeout(() => {
		if (socket && !socket.connected) {
			console.log('🔧 Attempting reconnection...');
			socket.connect();
		}
	}, 2000);
	});
	
	socket.on('connect_error', (error) => {
		console.log('❌ WebSocket connection error:', error);
		console.log('❌ Error details:', error.message);
		console.log('❌ Platform:', isWeb ? 'Web' : 'Mobile');
		console.log('❌ Transport:', socket?.io?.engine?.transport?.name);
		
		// Mobile-specific error handling
		if (!isWeb) {
			console.log('🔧 Mobile: Attempting alternative connection...');
			// Try to reconnect with different options
			setTimeout(() => {
				if (socket && !socket.connected) {
					console.log('🔧 Mobile: Force reconnection...');
					socket.connect();
				}
			}, 2000);
		}
	});
	
	// Add periodic connection check
	setInterval(() => {
		console.log('🔍 Socket status check:', {
			connected: socket?.connected,
			id: socket?.id,
			transport: socket?.io?.engine?.transport?.name,
			platform: isWeb ? 'Web' : 'Mobile'
		});
		
		// Mobile-specific: Force reconnection if disconnected
		if (!isWeb && socket && !socket.connected) {
			console.log('🔧 Mobile: Socket disconnected, attempting reconnection...');
			socket.connect();
		}
		
		// Check token expiration and refresh if needed
		if (token) {
			try {
				const payload = JSON.parse(atob(token.split('.')[1]));
				const now = Math.floor(Date.now() / 1000);
				const exp = payload.exp;
				
				// If token expires in less than 5 minutes, warn user
				if (exp - now < 300) {
					console.warn('⚠️ JWT Token expires soon:', Math.floor((exp - now) / 60), 'minutes');
					console.warn('⚠️ Consider refreshing token to maintain connection');
					
					// If token expires in less than 2 minutes, warn but don't disconnect
					if (exp - now < 120) {
						console.warn('⚠️ Token expires very soon, but keeping connection alive');
						console.warn('⚠️ Consider refreshing token in the background');
					}
				}
			} catch (error) {
				console.error('❌ JWT Token invalid:', error);
			}
		}
	}, 10000); // Check every 10 seconds

	// Add event listener debug
	const originalEmit = socket.emit;
	socket.emit = function(event: string, ...args: any[]) {
		console.log('🔍 [SOCKET] Emitting event:', event, args);
		return originalEmit.call(this, event, ...args);
	};
	
	// Track disconnect calls
	const originalDisconnect = socket.disconnect;
	socket.disconnect = function() {
		console.log('🔍 [SOCKET] Disconnect called');
		console.trace('🔍 [SOCKET] Disconnect call stack:');
		return originalDisconnect.call(this);
	};

	const originalOn = socket.on;
	socket.on = function(event: string, listener: any) {
		console.log('🔍 [SOCKET] Setting up listener for event:', event);
		return originalOn.call(this, event, listener);
	};
	
	// Listen for any events to debug
	socket.onAny((event, ...args) => {
		console.log('🔍 Socket received event:', event, args);
	});
	
		// Add more debug listeners
		socket.on('connect_error', (error) => {
			console.log('❌ Socket connect_error:', error);
		});
		
		socket.on('error', (error) => {
			console.log('❌ Socket error:', error);
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

// Lazy getter for socket - for web we create the connection on first use
export const getSocket = () => {
	if (socket) return socket;

	if (!isWeb || typeof window === 'undefined') {
		console.warn('⚠️ getSocket called in non-web environment without existing socket');
		return socket;
	}

	// Try to read token from localStorage (kept in sync with api.ts)
	let token = '';
	try {
		token = window.localStorage.getItem('auth_token') || '';
	} catch (err) {
		console.warn('⚠️ Unable to read auth_token from localStorage for socket auth', err);
	}

	console.log('🔧 Creating socket from getSocket()', {
		hasToken: !!token,
		url: SOCKET_BASE_URL,
	});

	// Simple, synchronous socket creation for web
	socket = io(SOCKET_BASE_URL, {
		transports: ['polling'],
		upgrade: false,
		timeout: 10000,
		withCredentials: true,
		auth: { token },
		path: '/socket.io',
		forceNew: true,
		rememberUpgrade: false,
		autoConnect: true,
	});

	setupSocketListeners(token);
	return socket;
};

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


