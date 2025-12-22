import { AnalyticsEventType } from "../api";
export declare const useAnalytics: () => {
    trackEvent: (eventType: AnalyticsEventType, metadata?: Record<string, any>) => void;
};
