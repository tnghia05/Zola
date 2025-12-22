/**
 * Desktop-specific styles for Conversations screen
 * These styles are ONLY used on desktop/web (width >= 768)
 * Changes here will NOT affect mobile layout
 */
export declare const desktopStyles: {
    desktopLayout: {
        flex: number;
        flexDirection: "row";
    };
    leftPanel: {
        width: number;
        backgroundColor: string;
        borderRightWidth: number;
        borderRightColor: string;
    };
    centerPanel: {
        flex: number;
        backgroundColor: string;
    };
    desktopHeader: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    desktopHeaderTitle: {
        fontSize: number;
        fontWeight: "bold";
        color: string;
    };
    desktopHeaderActions: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
    };
    avatarButton: {
        width: number;
        height: number;
        borderRadius: number;
        overflow: "hidden";
        borderWidth: number;
        borderColor: string;
    };
    composeButton: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    headerIcon: {
        fontSize: number;
        color: string;
    };
    searchContainer: {
        paddingHorizontal: number;
        paddingVertical: number;
    };
    searchInput: {
        backgroundColor: string;
        borderRadius: number;
        paddingHorizontal: number;
        paddingVertical: number;
        color: string;
        fontSize: number;
    };
    tabsContainer: {
        flexDirection: "row";
        paddingHorizontal: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    tab: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    tabText: {
        color: string;
        fontSize: number;
        fontWeight: "500";
    };
    conversationsList: {
        flex: number;
    };
    conversationItem: {
        flexDirection: "row";
        alignItems: "center";
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    selectedConversationItem: {
        backgroundColor: string;
    };
    conversationAvatar: {
        position: "relative";
        marginRight: number;
    };
    conversationContent: {
        flex: number;
    };
    conversationHeader: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        marginBottom: number;
    };
    conversationName: {
        color: string;
        fontSize: number;
        fontWeight: "500";
        flex: number;
    };
    conversationTime: {
        color: string;
        fontSize: number;
        marginLeft: number;
    };
    conversationPreview: {
        color: string;
        fontSize: number;
    };
    emptyChatArea: {
        flex: number;
        alignItems: "center";
        justifyContent: "center";
        padding: number;
    };
    emptyChatTitle: {
        fontSize: number;
        fontWeight: "bold";
        color: string;
        marginBottom: number;
    };
    emptyChatSubtitle: {
        fontSize: number;
        color: string;
        textAlign: "center";
    };
    chatArea: {
        flex: number;
        flexDirection: "column";
    };
    chatHeader: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    chatHeaderLeft: {
        flexDirection: "row";
        alignItems: "center";
        flex: number;
    };
    chatAvatar: {
        width: number;
        height: number;
        borderRadius: number;
        marginRight: number;
    };
    chatHeaderDefaultAvatar: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
        marginRight: number;
    };
    chatHeaderDefaultAvatarText: {
        color: string;
        fontWeight: "bold";
        fontSize: number;
    };
    chatHeaderInfo: {
        flex: number;
    };
    chatName: {
        color: string;
        fontSize: number;
        fontWeight: "600";
    };
    chatStatus: {
        color: string;
        fontSize: number;
    };
    chatHeaderActions: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
    };
    chatActionButton: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    chatActionIcon: {
        fontSize: number;
    };
    chatInfoPanel: {
        width: number;
        backgroundColor: string;
        borderLeftWidth: number;
        borderLeftColor: string;
    };
    chatInfoHeader: {
        alignItems: "center";
        padding: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    chatInfoAvatar: {
        width: number;
        height: number;
        borderRadius: number;
        marginBottom: number;
    };
    chatInfoName: {
        color: string;
        fontSize: number;
        fontWeight: "bold";
        marginBottom: number;
    };
    encryptionBadge: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
    };
    encryptionIcon: {
        fontSize: number;
    };
    encryptionText: {
        color: string;
        fontSize: number;
    };
    chatInfoActions: {
        flexDirection: "row";
        justifyContent: "space-around";
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    chatInfoAction: {
        alignItems: "center";
        flex: number;
    };
    chatInfoActionIcon: {
        fontSize: number;
        marginBottom: number;
    };
    chatInfoActionText: {
        color: string;
        fontSize: number;
        textAlign: "center";
    };
    chatInfoContent: {
        flex: number;
    };
    chatInfoSection: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    chatInfoSectionTitle: {
        color: string;
        fontSize: number;
        flex: number;
    };
    chatInfoSectionArrow: {
        color: string;
        fontSize: number;
    };
};
