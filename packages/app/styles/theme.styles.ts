import { StyleSheet } from 'react-native';
import { ThemeColors } from './themeColors';

export const createThemeStyles = (colors: ThemeColors) => StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Gradient backgrounds
  gradientBackground: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.headerBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.headerText,
  },
  backButton: {
    fontSize: 24,
    color: colors.text,
    marginRight: 16,
  },
  
  // Text styles
  text: {
    color: colors.text,
  },
  textSecondary: {
    color: colors.textSecondary,
  },
  textTertiary: {
    color: colors.textTertiary,
  },
  
  // Input styles - ĐẸP VỚI SHADOW
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.inputText,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputPlaceholder: {
    color: colors.inputPlaceholder,
  },
  
  // Button styles - ĐẸP VỚI SHADOW
  button: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.buttonPrimary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: colors.buttonSecondary,
  },
  buttonDanger: {
    backgroundColor: colors.buttonDanger,
  },
  
  // Card styles - ĐẸP VỚI SHADOW
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.tabBackground,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: colors.tabActive,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.tabInactive,
  },
  activeTabText: {
    color: colors.buttonText,
  },
  
  // Modal styles - ĐẸP VỚI SHADOW
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.modalBackground,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  
  // Chat styles - BUBBLE ĐẸP VỚI SHADOW
  chatBubbleOwn: {
    backgroundColor: colors.chatBubbleOwn,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginVertical: 4,
    alignSelf: 'flex-end',
    maxWidth: '80%',
    shadowColor: colors.chatBubbleOwn,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  chatBubbleOther: {
    backgroundColor: colors.chatBubbleOther,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginVertical: 4,
    alignSelf: 'flex-start',
    maxWidth: '80%',
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chatTextOwn: {
    color: colors.chatTextOwn,
    fontSize: 16,
  },
  chatTextOther: {
    color: colors.chatTextOther,
    fontSize: 16,
  },
  
  // Status styles
  statusOnline: {
    color: colors.success,
  },
  statusOffline: {
    color: colors.textSecondary,
  },
  
  // Avatar styles
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.avatarBackground,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  
  // Section styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
});
