import { StyleSheet } from 'react-native';
export const chatStyles = StyleSheet.create({
    // File and Call styles
    fileChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        maxWidth: 260,
        marginVertical: 2,
    },
    fileLeft: { backgroundColor: '#eef6ff' },
    fileRight: { backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
    fileIcon: { fontSize: 18 },
    fileIconLeft: { color: '#0b5cff' },
    fileIconRight: { color: '#ffffff' },
    fileName: { fontSize: 14, fontWeight: '600' },
    fileNameLeft: { color: '#0b5cff' },
    fileNameRight: { color: '#ffffff' },
    fileMeta: { fontSize: 12 },
    fileMetaLeft: { color: '#6b7280' },
    fileMetaRight: { color: '#E5E7EB' },
    fileOpen: { fontSize: 12, fontWeight: '700' },
    fileOpenLeft: { color: '#0b5cff' },
    fileOpenRight: { color: '#ffffff' },
    callButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent to match gradient
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    callButtonText: {
        fontSize: 20,
        // color: set dynamically via theme
    },
    historyButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent to match gradient
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    historyButtonText: {
        fontSize: 20,
        // color: set dynamically via theme
    },
    infoButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent to match gradient
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    infoButtonText: {
        fontSize: 20,
        // color: set dynamically via theme
    },
    callHistoryContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)', // Semi-transparent to match gradient
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        maxHeight: 300,
    },
    callHistoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        // color: set dynamically via theme
    },
    noHistoryText: {
        textAlign: 'center',
        // color: set dynamically via theme
        fontStyle: 'italic',
        padding: 20,
    },
    // Message avatar styles
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 2,
    },
    messageAvatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    messageAvatarDefault: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    messageAvatarText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
