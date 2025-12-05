import { StyleSheet } from 'react-native';

/**
 * Desktop-specific styles for Conversations screen
 * These styles are ONLY used on desktop/web (width >= 768)
 * Changes here will NOT affect mobile layout
 */
export const desktopStyles = StyleSheet.create({
	// ====== DESKTOP LAYOUT ======
	desktopLayout: {
		flex: 1,
		flexDirection: 'row',
	},

	// ====== LEFT PANEL (Conversations List) ======
	leftPanel: {
		width: 320,
		backgroundColor: '#1a1a1a',
		borderRightWidth: 0.5,
		borderRightColor: '#333',
	},

	// ====== CENTER PANEL (Chat Area) ======
	centerPanel: {
		flex: 1,
		backgroundColor: '#1a1a1a',
	},

	// ====== DESKTOP HEADER ======
	desktopHeader: {
		flexDirection: 'row',
		alignItems: 'center', 
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},

	desktopHeaderTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
	},

	desktopHeaderActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},

	// ====== DESKTOP BUTTONS ======
	avatarButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: '#007AFF',
	},

	composeButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#333',
		alignItems: 'center',
		justifyContent: 'center',
	},

	headerIcon: {
		fontSize: 18,
		color: '#fff',
	},

	// ====== DESKTOP SEARCH ======
	searchContainer: {
		paddingHorizontal: 16,
		paddingVertical: 8, 
	},

	searchInput: {
		backgroundColor: '#333',
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		color: '#fff',
		fontSize: 14,
	},

	// ====== DESKTOP TABS ======
	tabsContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},

	tab: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},

	tabText: {
		color: '#999',
		fontSize: 14,
		fontWeight: '500',
	},

	// ====== DESKTOP CONVERSATIONS LIST ======
	conversationsList: {
		flex: 1,
	},

	conversationItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},

	selectedConversationItem: {
		backgroundColor: '#2a2a2a',
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
		color: '#fff',
		fontSize: 16,
		fontWeight: '500',
		flex: 1,
	},

	conversationTime: {
		color: '#999',
		fontSize: 12,
		marginLeft: 8,
	},

	conversationPreview: {
		color: '#999',
		fontSize: 14,
	},

	// ====== CHAT AREA ======
	emptyChatArea: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32,
	},

	emptyChatTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 8,
	},

	emptyChatSubtitle: {
		fontSize: 16,
		color: '#999',
		textAlign: 'center',
	},

	chatArea: {
		flex: 1,
		flexDirection: 'column',
	},

	chatHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},

	chatHeaderLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},

	chatAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 12,
	},

	chatHeaderDefaultAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#007AFF',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},

	chatHeaderDefaultAvatarText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},

	chatHeaderInfo: {
		flex: 1,
	},

	chatName: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},

	chatStatus: {
		color: '#999',
		fontSize: 12,
	},

	chatHeaderActions: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},

	chatActionButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#333',
		alignItems: 'center',
		justifyContent: 'center',
	},

	chatActionIcon: {
		fontSize: 16,
	},

	// ====== CHAT INFO PANEL (Right Panel) ======
	chatInfoPanel: {
		width: 320,
		backgroundColor: '#1a1a1a',
		borderLeftWidth: 0.5,
		borderLeftColor: '#333',
	},

	chatInfoHeader: {
		alignItems: 'center',
		padding: 20,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},

	chatInfoAvatar: {
		width: 60,
		height: 60,
		borderRadius: 30,
		marginBottom: 12,
	},

	chatInfoName: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 8,
	},

	encryptionBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},

	encryptionIcon: {
		fontSize: 12,
	},

	encryptionText: {
		color: '#999',
		fontSize: 12,
	},

	chatInfoActions: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 16,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},

	chatInfoAction: {
		alignItems: 'center',
		flex: 1,
	},

	chatInfoActionIcon: {
		fontSize: 20,
		marginBottom: 4,
	},

	chatInfoActionText: {
		color: '#999',
		fontSize: 12,
		textAlign: 'center',
	},

	chatInfoContent: {
		flex: 1,
	},

	chatInfoSection: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},

	chatInfoSectionTitle: {
		color: '#fff',
		fontSize: 14,
		flex: 1,
	},

	chatInfoSectionArrow: {
		color: '#999',
		fontSize: 18,
	},
});

