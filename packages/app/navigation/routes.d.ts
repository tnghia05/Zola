import type { ReactNode } from "react";
export type ZolaRouteName = "home" | "chat" | "conversations" | "call" | "settings" | "login";
export interface ZolaRouteConfig {
    name: ZolaRouteName;
    path: string;
    title: string;
}
export declare const zolaRoutes: ZolaRouteConfig[];
export type ScreenComponent = () => ReactNode;
