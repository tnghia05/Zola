import { StyleSheet } from 'react-native';
/**
 * Mobile-specific styles for Conversations screen
 * These styles are ONLY used on mobile devices (width < 768)
 * Changes here will NOT affect desktop/web layout
 */
export const mobileStyles = StyleSheet.create({
    // ====== MOBILE LAYOUT ======
    container: {
        flex: 1,
        // backgroundColor removed - using LinearGradient instead
    },
    // ====== MOBILE HEADER ======
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent', // Transparent to show gradient
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
        paddingTop: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        // color: set dynamically in component via theme
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    // ====== MOBILE BUTTONS ======
    composeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Semi-transparent for gradient
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarButtonMobile: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent border
    },
    headerIcon: {
        fontSize: 18,
        // color: set dynamically via theme
    },
    // ====== MOBILE SEARCH ======
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'transparent', // Transparent to show gradient
    },
    searchInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)', // Semi-transparent (works for both themes)
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        // color: set dynamically in component via theme
        fontSize: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    // ====== MOBILE TABS ======
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)', // Subtle border
        backgroundColor: 'transparent', // Transparent to show gradient
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
    // borderBottomColor: set dynamically via theme (primary color)
    },
    tabText: {
        // color: set dynamically via theme
        fontSize: 14,
        fontWeight: '500',
    },
    activeTabText: {
    // color: set dynamically via theme (primary color)
    },
    // ====== MOBILE CONVERSATIONS LIST ======
    conversationsList: {
        flex: 1,
        backgroundColor: 'transparent', // Transparent to show gradient
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)', // Subtle border
        backgroundColor: 'transparent', // Transparent to show gradient
    },
    conversationAvatar: {
        position: 'relative',
        marginRight: 12,
    },
    conversationContent: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    conversationName: {
        // color: set dynamically via theme
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    conversationTime: {
        // color: set dynamically via theme
        fontSize: 12,
        marginLeft: 8,
    },
    conversationPreview: {
        // color: set dynamically via theme
        fontSize: 14,
    },
});
