import React from "react";
import { useLocalSearchParams } from "expo-router";
import Chat from "@zola/app/features/chat/Chat.native";

export default function Screen() {
  const params = useLocalSearchParams<{
    conversationId?: string;
    name?: string;
  }>();

  const conversationId = params.conversationId
    ? String(params.conversationId)
    : "";
  const name = params.name ? String(params.name) : "Người dùng";

  return <Chat conversationId={conversationId} name={name} />;
}
