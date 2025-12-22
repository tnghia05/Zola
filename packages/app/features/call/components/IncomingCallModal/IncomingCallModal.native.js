import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View, Text, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import { Platform } from 'react-native';
export const IncomingCallModal = ({ visible, callerName, callerAvatar, onAccept, onDecline }) => {
    if (Platform.OS === 'web') {
        // Web: Custom popup modal
        if (!visible)
            return null;
        return (_jsx("div", { style: webStyles.overlay, children: _jsxs("div", { style: webStyles.modal, children: [_jsx("div", { style: webStyles.header, children: _jsx("div", { style: webStyles.avatarContainer, children: callerAvatar ? (_jsx("img", { src: callerAvatar, alt: "Caller", style: webStyles.avatar })) : (_jsx("div", { style: webStyles.defaultAvatar, children: _jsx("span", { style: webStyles.avatarText, children: callerName.charAt(0).toUpperCase() }) })) }) }), _jsxs("div", { style: webStyles.content, children: [_jsx(Text, { style: webStyles.callerName, children: callerName }), _jsx(Text, { style: webStyles.callingText, children: "\u0111ang g\u1ECDi cho b\u1EA1n" }), _jsxs("div", { style: webStyles.encryption, children: [_jsx("span", { style: webStyles.lockIcon, children: "\uD83D\uDD12" }), _jsx(Text, { style: webStyles.encryptionText, children: "\u0110\u01B0\u1EE3c m\u00E3 h\u00F3a \u0111\u1EA7u cu\u1ED1i" })] })] }), _jsxs("div", { style: webStyles.actions, children: [_jsxs(TouchableOpacity, { style: [webStyles.actionButton, webStyles.declineButton], onPress: onDecline, children: [_jsx(Text, { style: webStyles.actionButtonText, children: "\u2715" }), _jsx(Text, { style: webStyles.actionButtonLabel, children: "T\u1EEB ch\u1ED1i" })] }), _jsxs(TouchableOpacity, { style: [webStyles.actionButton, webStyles.acceptButton], onPress: onAccept, children: [_jsx(Text, { style: webStyles.actionButtonText, children: "\uD83D\uDCF9" }), _jsx(Text, { style: webStyles.actionButtonLabel, children: "Ch\u1EA5p nh\u1EADn" })] })] }), _jsx(TouchableOpacity, { style: webStyles.closeButton, onPress: onDecline, children: _jsx(Text, { style: webStyles.closeButtonText, children: "\u2715" }) })] }) }));
    }
    // Mobile: Native modal
    return (_jsx(Modal, { visible: visible, transparent: true, animationType: "fade", onRequestClose: onDecline, children: _jsx(View, { style: styles.overlay, children: _jsxs(View, { style: styles.modal, children: [_jsx(View, { style: styles.header, children: _jsx(View, { style: styles.avatarContainer, children: callerAvatar ? (_jsx(Image, { source: { uri: callerAvatar }, style: styles.avatar })) : (_jsx(View, { style: styles.defaultAvatar, children: _jsx(Text, { style: styles.avatarText, children: callerName.charAt(0).toUpperCase() }) })) }) }), _jsxs(View, { style: styles.content, children: [_jsx(Text, { style: styles.callerName, children: callerName }), _jsx(Text, { style: styles.callingText, children: "\u0111ang g\u1ECDi cho b\u1EA1n" }), _jsxs(View, { style: styles.encryption, children: [_jsx(Text, { style: styles.lockIcon, children: "\uD83D\uDD12" }), _jsx(Text, { style: styles.encryptionText, children: "\u0110\u01B0\u1EE3c m\u00E3 h\u00F3a \u0111\u1EA7u cu\u1ED1i" })] })] }), _jsxs(View, { style: styles.actions, children: [_jsxs(TouchableOpacity, { style: [styles.actionButton, styles.declineButton], onPress: onDecline, children: [_jsx(Text, { style: styles.actionButtonText, children: "\u2715" }), _jsx(Text, { style: styles.actionButtonLabel, children: "T\u1EEB ch\u1ED1i" })] }), _jsxs(TouchableOpacity, { style: [styles.actionButton, styles.acceptButton], onPress: onAccept, children: [_jsx(Text, { style: styles.actionButtonText, children: "\uD83D\uDCF9" }), _jsx(Text, { style: styles.actionButtonLabel, children: "Ch\u1EA5p nh\u1EADn" })] })] })] }) }) }));
};
// Mobile styles
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        minWidth: 300,
        maxWidth: 400,
    },
    header: {
        marginBottom: 20,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        backgroundColor: '#333',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    defaultAvatar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#4a90e2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        alignItems: 'center',
        marginBottom: 30,
    },
    callerName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    callingText: {
        fontSize: 16,
        color: '#ccc',
        marginBottom: 15,
    },
    encryption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lockIcon: {
        fontSize: 14,
        marginRight: 5,
    },
    encryptionText: {
        fontSize: 12,
        color: '#888',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    actionButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 20,
    },
    declineButton: {
        backgroundColor: '#ff4444',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        fontSize: 24,
        color: 'white',
        marginBottom: 4,
    },
    actionButtonLabel: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
    },
});
// Web styles - using any to avoid TypeScript issues with web styles
const webStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    modal: {
        backgroundColor: '#1a1a1a',
        borderRadius: '20px',
        padding: '30px',
        alignItems: 'center',
        minWidth: '300px',
        maxWidth: '400px',
        position: 'relative',
    },
    header: {
        marginBottom: '20px',
    },
    avatarContainer: {
        width: '80px',
        height: '80px',
        borderRadius: '40px',
        overflow: 'hidden',
        backgroundColor: '#333',
    },
    avatar: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    defaultAvatar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#4a90e2',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: '32px',
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        alignItems: 'center',
        marginBottom: '30px',
    },
    callerName: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: 'white',
        marginBottom: '8px',
    },
    callingText: {
        fontSize: '16px',
        color: '#ccc',
        marginBottom: '15px',
    },
    encryption: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    lockIcon: {
        fontSize: '14px',
        marginRight: '5px',
    },
    encryptionText: {
        fontSize: '12px',
        color: '#888',
    },
    actions: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    actionButton: {
        width: '70px',
        height: '70px',
        borderRadius: '35px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: '20px',
        cursor: 'pointer',
        border: 'none',
    },
    declineButton: {
        backgroundColor: '#ff4444',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        fontSize: '24px',
        color: 'white',
        marginBottom: '4px',
    },
    actionButtonLabel: {
        fontSize: '12px',
        color: 'white',
        fontWeight: '500',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '30px',
        height: '30px',
        borderRadius: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
    },
    closeButtonText: {
        color: 'white',
        fontSize: '16px',
    },
};
