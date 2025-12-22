import { StyleSheet } from 'react-native';
/**
 * Shared styles used by BOTH mobile and desktop
 * These styles are common across all platforms
 * For platform-specific styles, see:
 * - conversations.mobile.styles.ts
 * - conversations.desktop.styles.ts
 */
export const conversationsStyles = StyleSheet.create({
    // ====== SHARED AVATAR STYLES ======
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    defaultAvatar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    defaultAvatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // ====== SHARED UNREAD BADGE ======
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1a1a1a',
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // ====== SHARED MESSAGE AVATAR STYLES ======
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
    // ====== SHARED MESSAGE BUBBLE STYLES ======
    messageBubbleLeft: {
        backgroundColor: '#333',
        borderRadius: 14,
        padding: 2,
        marginBottom: 2,
    },
    messageBubbleRight: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        padding: 2,
        marginBottom: 2,
    },
    messageContainerLeft: {
        marginBottom: 6,
    },
    messageContainerRight: {
        marginBottom: 6,
    },
    messageTextLeft: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
    },
    messageTextRight: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
    },
    // ====== SHARED FILE STYLES ======
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
    // ====== SHARED CALL HISTORY STYLES ======
    callHistoryContainer: {
        backgroundColor: '#1a1a1a',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        maxHeight: 300,
    },
    callHistoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#fff',
    },
    noHistoryText: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
        padding: 20,
    },
    // ====== SHARED MODAL STYLES (Used by both mobile and desktop) ======
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchModal: {
        width: '90%',
        maxWidth: 500,
        maxHeight: '80%',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        overflow: 'hidden',
    },
    searchModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    searchModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    searchInputContainer: {
        padding: 16,
    },
    searchResults: {
        flex: 1,
        minHeight: 200,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        color: '#999',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 16,
        textAlign: 'center',
    },
    noResultsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    noResultsText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    searchResultAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        overflow: 'hidden',
    },
    searchResultAvatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    searchResultDefaultAvatar: {
        width: '100%',
        height: '100%',
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchResultDefaultAvatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    searchResultInfo: {
        flex: 1,
    },
    searchResultName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    searchResultEmail: {
        color: '#999',
        fontSize: 14,
        marginBottom: 2,
    },
    searchResultUsername: {
        color: '#007AFF',
        fontSize: 14,
    },
});
