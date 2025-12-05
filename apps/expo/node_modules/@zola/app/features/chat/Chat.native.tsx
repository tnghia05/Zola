import React from "react";
import { View, Text } from "react-native";
import { lightColors } from "../../styles/themeTokens";

// App version for debugging (giữ để sau dùng nếu cần)
const APP_VERSION = "1.1.0";
const BUILD_NUMBER = "017";

type ChatScreenProps = {
  conversationId: string;
  name: string;
};

export default function ChatScreen({ conversationId, name }: ChatScreenProps) {
  const colors = lightColors;

		return (
			<View
								style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 16,
      }}
    >
      {/* Header style giống desktop (navbar-style) */}
									<View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderColor: colors.border,
        }}
      >
									<View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.avatarBackground,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
					<Text
            style={{
              color: colors.avatarText,
              fontWeight: "700",
            }}
          >
            {name?.[0]?.toUpperCase() ?? "?"}
					</Text>
			</View>
        <View style={{ flex: 1 }}>
          <Text
				style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {name}
          </Text>
          <Text
						style={{ 
              color: colors.textSecondary,
              fontSize: 12,
            }}
          >
            v{APP_VERSION}-{BUILD_NUMBER} · {conversationId}
          </Text>
        </View>
      </View>

      {/* Placeholder body – sau này sẽ map giống DesktopChat */}
      <View
					style={{ 
						flex: 1,
          backgroundColor: colors.surfaceVariant,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text
							style={{ 
            color: colors.textSecondary,
								fontSize: 14, 
            textAlign: "center",
          }}
        >
          Mobile Chat đang dùng layout và màu lấy từ giao diện desktop.{"\n"}
          Phần logic tin nhắn đầy đủ sẽ được map dần từ DesktopChat.
        </Text>
			</View>
								</View>
  );
}



