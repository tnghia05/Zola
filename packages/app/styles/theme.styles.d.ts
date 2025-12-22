import { ThemeColors } from './themeColors';
export declare const createThemeStyles: (colors: ThemeColors) => {
    container: {
        flex: number;
        backgroundColor: string;
    };
    gradientBackground: {
        flex: number;
        backgroundColor: string;
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
    };
    headerTitle: {
        fontSize: number;
        fontWeight: "bold";
        color: string;
    };
    backButton: {
        fontSize: number;
        color: string;
        marginRight: number;
    };
    text: {
        color: string;
    };
    textSecondary: {
        color: string;
    };
    textTertiary: {
        color: string;
    };
    input: {
        backgroundColor: string;
        borderRadius: number;
        paddingHorizontal: number;
        paddingVertical: number;
        fontSize: number;
        color: string;
        borderWidth: number;
        borderColor: string;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    inputPlaceholder: {
        color: string;
    };
    button: {
        backgroundColor: string;
        borderRadius: number;
        paddingVertical: number;
        paddingHorizontal: number;
        alignItems: "center";
        justifyContent: "center";
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    buttonText: {
        color: string;
        fontSize: number;
        fontWeight: "600";
    };
    buttonSecondary: {
        backgroundColor: string;
    };
    buttonDanger: {
        backgroundColor: string;
    };
    card: {
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        marginVertical: number;
        borderWidth: number;
        borderColor: string;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    listItem: {
        flexDirection: "row";
        alignItems: "center";
        paddingHorizontal: number;
        paddingVertical: number;
        borderBottomWidth: number;
        borderBottomColor: string;
    };
    tabContainer: {
        flexDirection: "row";
        backgroundColor: string;
        marginHorizontal: number;
        marginVertical: number;
        borderRadius: number;
    };
    tab: {
        flex: number;
        paddingVertical: number;
        alignItems: "center";
        borderRadius: number;
    };
    activeTab: {
        backgroundColor: string;
    };
    tabText: {
        fontSize: number;
        fontWeight: "500";
        color: string;
    };
    activeTabText: {
        color: string;
    };
    modalOverlay: {
        flex: number;
        backgroundColor: string;
        justifyContent: "center";
        alignItems: "center";
        padding: number;
    };
    modalContainer: {
        backgroundColor: string;
        borderRadius: number;
        padding: number;
        width: "100%";
        maxWidth: number;
        borderWidth: number;
        borderColor: string;
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    modalTitle: {
        fontSize: number;
        fontWeight: "bold";
        color: string;
        textAlign: "center";
        marginBottom: number;
    };
    modalDescription: {
        fontSize: number;
        color: string;
        textAlign: "center";
        marginBottom: number;
        lineHeight: number;
    };
    chatBubbleOwn: {
        backgroundColor: string;
        borderRadius: number;
        paddingHorizontal: number;
        paddingVertical: number;
        marginVertical: number;
        alignSelf: "flex-end";
        maxWidth: "80%";
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    chatBubbleOther: {
        backgroundColor: string;
        borderRadius: number;
        paddingHorizontal: number;
        paddingVertical: number;
        marginVertical: number;
        alignSelf: "flex-start";
        maxWidth: "80%";
        shadowColor: string;
        shadowOffset: {
            width: number;
            height: number;
        };
        shadowOpacity: number;
        shadowRadius: number;
        elevation: number;
    };
    chatTextOwn: {
        color: string;
        fontSize: number;
    };
    chatTextOther: {
        color: string;
        fontSize: number;
    };
    statusOnline: {
        color: string;
    };
    statusOffline: {
        color: string;
    };
    avatar: {
        width: number;
        height: number;
        borderRadius: number;
        backgroundColor: string;
    };
    avatarLarge: {
        width: number;
        height: number;
        borderRadius: number;
    };
    section: {
        marginBottom: number;
    };
    sectionTitle: {
        fontSize: number;
        fontWeight: "600";
        color: string;
        paddingHorizontal: number;
        paddingVertical: number;
        backgroundColor: string;
    };
};
