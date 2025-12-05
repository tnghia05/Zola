import { useCallback, useEffect, useRef } from "react";
import { trackEventApi, AnalyticsEventType } from "../api";

// Generate a session ID that persists for the browser session
const getSessionId = (): string => {
  const key = "__analytics_session_id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export const useAnalytics = () => {
  const sessionIdRef = useRef<string>(getSessionId());

  const trackEvent = useCallback(
    (eventType: AnalyticsEventType, metadata?: Record<string, any>) => {
      trackEventApi(eventType, metadata, sessionIdRef.current);
    },
    []
  );

  // Track page view on mount (optional)
  useEffect(() => {
    // You can add page view tracking here if needed
  }, []);

  return { trackEvent };
};

