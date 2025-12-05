import type { ReactNode } from "react";

export type ZolaRouteName =
  | "home"
  | "chat"
  | "conversations"
  | "call"
  | "settings"
  | "login";

export interface ZolaRouteConfig {
  name: ZolaRouteName;
  path: string;
  title: string;
}

export const zolaRoutes: ZolaRouteConfig[] = [
  { name: "home", path: "/", title: "Home" },
  { name: "chat", path: "/chat", title: "Chat" },
  { name: "conversations", path: "/conversations", title: "Conversations" },
  { name: "call", path: "/call", title: "Call" },
  { name: "settings", path: "/settings", title: "Settings" },
  { name: "login", path: "/login", title: "Login" }
];

export type ScreenComponent = () => ReactNode;

