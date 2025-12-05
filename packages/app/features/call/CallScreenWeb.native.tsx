import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CallScreen from './CallScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '../api';

export default function CallWeb() {
  const [callParams, setCallParams] = useState<{
    callId: string;
    conversationId: string;
    isIncoming: boolean;
    callType?: 'p2p' | 'sfu';
    livekitRoomName?: string;
  } | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const ensureAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (!token) {
          setAuthError('Chưa đăng nhập. Vui lòng mở app chính và đăng nhập lại.');
          return;
        }
        setAuthToken(token);
        setAuthReady(true);
      } catch (error) {
        console.error('❌ [CALLWEB] Unable to restore auth token:', error);
        setAuthError('Không thể đọc token đăng nhập. Vui lòng thử lại.');
      }
    };
    ensureAuth();
  }, []);

  useEffect(() => {
    console.log('📞 [CALLWEB] CallWeb component mounted');
    console.log('📞 [CALLWEB] Current URL:', window.location.href);
    console.log('📞 [CALLWEB] Full URL search:', window.location.search);
    
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const callId = urlParams.get('callId');
    const conversationId = urlParams.get('conversationId');
    const isIncoming = urlParams.get('isIncoming') === 'true';
    const callTypeParam = urlParams.get('callType');
    const livekitRoomName = urlParams.get('livekitRoomName') || undefined;

    console.log('📞 [CALLWEB] Parsed params:', { callId, conversationId, isIncoming });
    console.log('📞 [CALLWEB] All URL params:', Object.fromEntries(urlParams.entries()));

    if (callId && conversationId) {
      console.log('📞 [CALLWEB] Setting call params and rendering CallScreen');
      setCallParams({ 
        callId, 
        conversationId, 
        isIncoming,
        callType: callTypeParam === 'sfu' ? 'sfu' : callTypeParam === 'p2p' ? 'p2p' : undefined,
        livekitRoomName
      });
    } else {
      console.error('❌ [CALLWEB] Invalid parameters detected');
      console.error('❌ [CALLWEB] callId:', callId, 'conversationId:', conversationId);
      console.error('❌ [CALLWEB] Raw search params:', window.location.search);
      
      // Try to get parameters from parent window or other sources
      console.log('📞 [CALLWEB] Attempting to get parameters from parent window...');
      if (window.opener) {
        try {
          // Try to get parameters from parent
          const parentUrl = window.opener.location.href;
          console.log('📞 [CALLWEB] Parent URL:', parentUrl);
        } catch (e) {
          console.log('📞 [CALLWEB] Cannot access parent window:', e);
        }
      }
      
      // Don't close window immediately, show error instead
      console.error('❌ [CALLWEB] Keeping window open for debugging - DO NOT CLOSE');
      // Comment out the window.close() for now to debug
      // setTimeout(() => {
      //   console.error('❌ [CALLWEB] Still invalid params after delay, closing window');
      //   window.close();
      // }, 5000);
    }

    return () => {
      console.log('📞 [CALLWEB] CallWeb component unmounting.');
    };
  }, []);

  if (authError) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Không thể mở cuộc gọi</Text>
          <Text style={styles.errorText}>{authError}</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!authReady || !callParams) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang chuẩn bị cuộc gọi...</Text>
          <Text style={styles.errorText}>Đang xác thực phiên đăng nhập</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Render CallScreen with mock navigation
  return (
    <SafeAreaProvider>
      <CallScreen 
        route={{
          key: 'call-web',
          name: 'Call',
          params: callParams
        }}
        navigation={{} as any} // Mock navigation for web
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});
