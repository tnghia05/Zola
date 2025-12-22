import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, Text } from "react-native";
import { lightColors } from "../../styles/themeTokens";
// App version for debugging (giữ để sau dùng nếu cần)
const APP_VERSION = "1.1.0";
const BUILD_NUMBER = "017";
export default function ChatScreen({ conversationId, name }) {
    const colors = lightColors;
    return (_jsxs(View, { style: {
            flex: 1,
            backgroundColor: colors.background,
            paddingTop: 16,
        }, children: [_jsxs(View, { style: {
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    backgroundColor: colors.surface,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                }, children: [_jsx(View, { style: {
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.avatarBackground,
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 12,
                        }, children: _jsx(Text, { style: {
                                color: colors.avatarText,
                                fontWeight: "700",
                            }, children: name?.[0]?.toUpperCase() ?? "?" }) }), _jsxs(View, { style: { flex: 1 }, children: [_jsx(Text, { style: {
                                    color: colors.text,
                                    fontSize: 16,
                                    fontWeight: "600",
                                }, children: name }), _jsxs(Text, { style: {
                                    color: colors.textSecondary,
                                    fontSize: 12,
                                }, children: ["v", APP_VERSION, "-", BUILD_NUMBER, " \u00B7 ", conversationId] })] })] }), _jsx(View, { style: {
                    flex: 1,
                    backgroundColor: colors.surfaceVariant,
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                }, children: _jsxs(Text, { style: {
                        color: colors.textSecondary,
                        fontSize: 14,
                        textAlign: "center",
                    }, children: ["Mobile Chat \u0111ang d\u00F9ng layout v\u00E0 m\u00E0u l\u1EA5y t\u1EEB giao di\u1EC7n desktop.", "\n", "Ph\u1EA7n logic tin nh\u1EAFn \u0111\u1EA7y \u0111\u1EE7 s\u1EBD \u0111\u01B0\u1EE3c map d\u1EA7n t\u1EEB DesktopChat."] }) })] }));
}
