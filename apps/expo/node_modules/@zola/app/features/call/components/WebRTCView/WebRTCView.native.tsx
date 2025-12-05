import React, { useRef, useEffect } from 'react';
import { Platform } from 'react-native';

// Conditionally import react-native-webrtc only for mobile
let RTCView: any = null;
if (Platform.OS !== 'web') {
  try {
    const WebRTC = require('react-native-webrtc');
    RTCView = WebRTC.RTCView;
  } catch (error) {
    console.warn('react-native-webrtc not available:', error);
  }
}

// WebRTC View component that works on both web and mobile
export const WebRTCView = ({ streamURL, style, mirror, onVideoStarted, muted = true }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastStreamId = useRef<string | null>(null);

  if (Platform.OS === 'web') {
    // Use useEffect to handle stream changes properly
    useEffect(() => {
      const video = videoRef.current;
      if (video && streamURL) {
        // Always reattach and attempt playback; track list may change while stream id stays the same
        const currentStreamId = streamURL.id || streamURL.toString();
        console.log('📞 [WEBRTCVIEW] ===== (RE)ATTACH VIDEO SRC =====');
        console.log('📞 [WEBRTCVIEW] Stream ID:', currentStreamId);
        console.log('📞 [WEBRTCVIEW] Stream active:', streamURL.active);
        console.log('📞 [WEBRTCVIEW] Tracks:', streamURL.getTracks().map((t:any)=>t.kind + ':' + t.readyState));
        lastStreamId.current = currentStreamId;

        // Only reset srcObject if changed to avoid DOM removal/remount issues
        const needsAttach = (video as any).srcObject !== streamURL;
        if (needsAttach) {
          try {
            (video as any).srcObject = streamURL;
          } catch {
            // Fallback for older browsers
            (video as any).src = URL.createObjectURL(streamURL);
          }
        }
        video.autoplay = true;
        video.muted = !!muted;
        video.playsInline = true;

        const tryPlay = () => {
          if (!(video as any)?.isConnected) {
            // Video element chưa gắn vào DOM -> thử lại sau một nhịp
            setTimeout(tryPlay, 100);
            return;
          }
          const p = (video as any).play?.();
          if (p && typeof p.then === 'function') {
            p.catch((err: any) => {
              console.warn('📞 [WEBRTCVIEW] video.play() blocked, will retry on unmute/visibility change:', err?.message || err);
            });
          }
        };
        // Defer play to next frame to ensure DOM is settled
        requestAnimationFrame(() => tryPlay());
        // Retry once more after a short delay in case of race with track unmute
        setTimeout(tryPlay, 120);

        // If video track exists but is muted initially, try again on unmute
        const vTrack = streamURL.getVideoTracks?.()[0];
        if (vTrack) {
          const onUnmute = () => {
            console.log('📞 [WEBRTCVIEW] Video track unmuted -> retry play');
            tryPlay();
          };
          if ((vTrack as any).onunmute === undefined) {
            vTrack.addEventListener?.('unmute', onUnmute, { once: true } as any);
          } else {
            (vTrack as any).onunmute = onUnmute;
          }
        }

        // Retry on visibility change (some browsers allow play after a tick)
        const onVis = () => tryPlay();
        document.addEventListener('visibilitychange', onVis, { once: true });
        const onPointer = () => tryPlay();
        document.addEventListener('pointerdown', onPointer, { once: true });

        // Debug listeners
        video.onloadedmetadata = () => {
          console.log('📞 [WEBRTCVIEW] Video metadata loaded');
          console.log('📞 [WEBRTCVIEW] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        };
        video.oncanplay = () => {
          console.log('📞 [WEBRTCVIEW] Video can play');
          tryPlay();
          if (typeof onVideoStarted === 'function') onVideoStarted();
        };
        video.onloadeddata = () => {
          console.log('📞 [WEBRTCVIEW] Video loadeddata');
          tryPlay();
          if (typeof onVideoStarted === 'function') onVideoStarted();
        };
        video.onplay = () => {
          console.log('📞 [WEBRTCVIEW] Video started playing');
          if (typeof onVideoStarted === 'function') onVideoStarted();
        };
        video.onerror = (error) => console.error('📞 [WEBRTCVIEW] Video error:', error);
        video.onloadstart = () => console.log('📞 [WEBRTCVIEW] Video load started');

        return () => {
          document.removeEventListener('visibilitychange', onVis as any);
          document.removeEventListener('pointerdown', onPointer as any);
        };
      }
    }, [streamURL]);

    // Web implementation using HTML5 video
    return (
      <video
        key={(streamURL && (streamURL.id || streamURL.toString())) || 'no-stream'}
        ref={videoRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: mirror ? 'scaleX(-1)' : 'none',
          backgroundColor: 'transparent',
          opacity: 1,
          visibility: 'visible',
          zIndex: 1,
          display: 'block',
          pointerEvents: 'none',
          ...style
        }}
        autoPlay
        muted
        playsInline
      />
    );
  } else {
    // Mobile implementation using RTCView
    if (RTCView) {
      return (
        <RTCView
          streamURL={streamURL}
          style={style}
          mirror={mirror}
        />
      );
    } else {
      // Fallback for when RTCView is not available
      return (
        <div style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          ...style 
        }}>
          WebRTC not available
        </div>
      );
    }
  }
};
