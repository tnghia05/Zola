/**
 * Mobile-specific styles for Conversations screen
 * These styles are ONLY used on mobile devices (width < 768)
 * Changes here will NOT affect desktop/web layout
 */
export declare const mobileStyles: {
    container: {
        flex: number;
    };
    header: {
        flexDirection: "row";
        alignItems: "center";
        justifyContent: "space-between";
        paddingHorizontal: number;
        paddingVertical: number;
        backgroundColor: string;
        borderBottomWidth: number;
        borderBottomColor: string;
        paddingTop: number;
    };
    headerTitle: {
        fontSize: number;
        fontWeight: "bold";
    };
    headerActions: {
        flexDirection: "row";
        alignItems: "center";
        gap: number;
    };
    composeButton: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
        alignItems: "center";
        justifyContent: "center";
    };
    avatarButtonMobile: {
        width: number;
        height: number;
        borderRadius: number;
        overflow: "hidden";
        borderWidth: number;
        borderColor: string;
    };
    headerIcon: {
        fontSize: number;
    };
    searchContainer: {
        paddingHorizontal: number;
        paddingVertical: number;
        backgroundColor: string;
    };
    searchInput: {
        backgroundColor: string;
        borderRadius: number;
        paddingHorizontal: number;
        paddingVertical: number;
        fontSize: number;
        borderWidth: number;
        borderColor: string;
    };
    tabsContainer: {
        flexDirection: "row";
        paddingHorizontal: number;
        borderBottomWidth: number;
        borderBottomColor: string;
        backgroundColor: string;
    };
    tab: {
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    activeTab: {};
    tabText: {
        fontSize: number;
        fontWeight: "500";
    };
    activeTabText: {};
    conversationsList: {
        flex: number;
        backgroundColor: string;
    };
    conversationItem: {
        flexDirection: "row";
        alignItems: "center";
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
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
        fontSize: number;
        fontWeight: "500";
        flex: number;
    };
    conversationTime: {
        fontSize: number;
        marginLeft: number;
    };
    conversationPreview: {
        fontSize: number;
    };
};
