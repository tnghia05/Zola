/**
 * Shared styles used by BOTH mobile and desktop
 * These styles are common across all platforms
 * For platform-specific styles, see:
 * - conversations.mobile.styles.ts
 * - conversations.desktop.styles.ts
 */
export declare const conversationsStyles: {
    avatarImage: {
        width: "100%";
        height: "100%";
        resizeMode: "cover";
    };
    defaultAvatar: {
        width: "100%";
        height: "100%";
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    defaultAvatarText: {
        color: string;
        fontWeight: "bold";
        fontSize: number;
    };
    unreadBadge: {
        position: "absolute";
        top: number;
        right: number;
        backgroundColor: string;
        borderRadius: number;
        minWidth: number;
        height: number;
        alignItems: "center";
        justifyContent: "center";
        borderWidth: number;
        borderColor: string;
    };
    unreadBadgeText: {
        color: string;
        fontSize: number;
        fontWeight: "bold";
    };
    messageAvatar: {
        width: number;
        height: number;
        borderRadius: number;
        marginRight: number;
        marginBottom: number;
    };
    messageAvatarImage: {
        width: "100%";
        height: "100%";
        borderRadius: number;
    };
    messageAvatarDefault: {
        width: "100%";
        height: "100%";
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    messageAvatarText: {
        color: string;
        fontSize: number;
        fontWeight: "bold";
    };
    messageBubbleLeft: {
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        marginBottom: number;
    };
    messageBubbleRight: {
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        marginBottom: number;
    };
    messageContainerLeft: {
        marginBottom: number;
    };
    messageContainerRight: {
        marginBottom: number;
    };
    messageTextLeft: {
        color: string;
        fontSize: number;
        lineHeight: number;
    };
    messageTextRight: {
        color: string;
        fontSize: number;
        lineHeight: number;
    };
    fileChip: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
        borderRadius: number;
        paddingVertical: number;
        paddingHorizontal: number;
        maxWidth: number;
        marginVertical: number;
    };
    fileLeft: {
        backgroundColor: string;
    };
    fileRight: {
        backgroundColor: string;
        borderWidth: number;
        borderColor: string;
    };
    fileIcon: {
        fontSize: number;
    };
    fileIconLeft: {
        color: string;
    };
    fileIconRight: {
        color: string;
    };
    fileName: {
        fontSize: number;
        fontWeight: "600";
    };
    fileNameLeft: {
        color: string;
    };
    fileNameRight: {
        color: string;
    };
    fileMeta: {
        fontSize: number;
    };
    fileMetaLeft: {
        color: string;
    };
    fileMetaRight: {
        color: string;
    };
    fileOpen: {
        fontSize: number;
        fontWeight: "700";
    };
    fileOpenLeft: {
        color: string;
    };
    fileOpenRight: {
        color: string;
    };
    callHistoryContainer: {
        backgroundColor: string;
        padding: number;
        borderTopWidth: number;
        borderTopColor: string;
        maxHeight: number;
    };
    callHistoryTitle: {
        fontSize: number;
        fontWeight: "bold";
        marginBottom: number;
        color: string;
    };
    noHistoryText: {
        textAlign: "center";
        color: string;
        fontStyle: "italic";
        padding: number;
    };
    modalOverlay: {
        position: "absolute";
        top: number;
        left: number;
        right: number;
        bottom: number;
        backgroundColor: string;
        zIndex: number;
        justifyContent: "center";
        alignItems: "center";
    };
    searchModal: {
        width: "90%";
        maxWidth: number;
        maxHeight: "80%";
        backgroundColor: string;
        borderRadius: number;
        overflow: "hidden";
    };
    searchModalHeader: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        padding: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    searchModalTitle: {
        fontSize: number;
        fontWeight: "bold";
        color: string;
    };
    closeButton: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    closeButtonText: {
        color: string;
        fontSize: number;
    };
    searchInputContainer: {
        padding: number;
    };
    searchResults: {
        flex: number;
        minHeight: number;
    };
    loadingContainer: {
        flex: number;
        alignItems: "center";
        justifyContent: "center";
        padding: number;
    };
    loadingText: {
        color: string;
        fontSize: number;
    };
    errorContainer: {
        flex: number;
        alignItems: "center";
        justifyContent: "center";
        padding: number;
    };
    errorText: {
        color: string;
        fontSize: number;
        textAlign: "center";
    };
    noResultsContainer: {
        flex: number;
        alignItems: "center";
        justifyContent: "center";
        padding: number;
    };
    noResultsText: {
        color: string;
        fontSize: number;
        textAlign: "center";
    };
    searchResultItem: {
        flexDirection: "row";
        alignItems: "center";
        padding: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    searchResultAvatar: {
        width: number;
        height: number;
        borderRadius: number;
        marginRight: number;
        overflow: "hidden";
    };
    searchResultAvatarImage: {
        width: "100%";
        height: "100%";
        resizeMode: "cover";
    };
    searchResultDefaultAvatar: {
        width: "100%";
        height: "100%";
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    searchResultDefaultAvatarText: {
        color: string;
        fontWeight: "bold";
        fontSize: number;
    };
    searchResultInfo: {
        flex: number;
    };
    searchResultName: {
        color: string;
        fontSize: number;
        fontWeight: "600";
        marginBottom: number;
    };
    searchResultEmail: {
        color: string;
        fontSize: number;
        marginBottom: number;
    };
    searchResultUsername: {
        color: string;
        fontSize: number;
    };
};
