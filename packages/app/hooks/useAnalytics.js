import { useCallback, useEffect, useRef } from "react";
import { trackEventApi } from "../api";
// Generate a session ID that persists for the browser session
const getSessionId = () => {
    const key = "__analytics_session_id";
    // Guard for SSR / non-browser environments
    if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
        // Fallback: non-persistent session id
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    let sessionId = window.sessionStorage.getItem(key);
    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        window.sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
};
export const useAnalytics = () => {
    const sessionIdRef = useRef(getSessionId());
    const trackEvent = useCallback((eventType, metadata) => {
        trackEventApi(eventType, metadata, sessionIdRef.current);
    }, []);
    // Track page view on mount (optional)
    useEffect(() => {
        // You can add page view tracking here if needed
    }, []);
    return { trackEvent };
};
