import React, { useState, useEffect } from 'react';
import { 
	View, 
	Text, 
	StyleSheet, 
	ScrollView, 
	TouchableOpacity, 
	Image, 
	Switch,
	Alert,
	Modal,
	TextInput,
	Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { updateUsername, logout, setAuthToken, updateCurrentUserProfile, uploadImageS3, uploadImageLocal } from '../api';
import { disconnectSocket } from '../socket';
import { useTheme } from '../contexts/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
	Conversations: undefined;
	Settings: undefined;
	Chat: { conversationId: string; name: string };
	Login: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
	const { mode, isDark, setMode, colors } = useTheme();
	const [activityStatus, setActivityStatus] = useState(true);
	const [userInfo, setUserInfo] = useState<{name?: string; username?: string; email?: string; avatar?: string}>({});
	const [showUsernameModal, setShowUsernameModal] = useState(false);
	const [newUsername, setNewUsername] = useState('');
	const [isUpdating, setIsUpdating] = useState(false);
	const [showLogoutModal, setShowLogoutModal] = useState(false);
	const [showImagePickerModal, setShowImagePickerModal] = useState(false);
	const [profileImage, setProfileImage] = useState<string>('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center');

	useEffect(() => {
		loadUserInfo();
	}, []);

	const loadUserInfo = async () => {
		try {
			const userId = await AsyncStorage.getItem('user_id');
			const userData = await AsyncStorage.getItem('user_data');
			
			if (userData) {
				const parsed = JSON.parse(userData);
				setUserInfo({
					name: parsed.name,
					username: parsed.username,
					email: parsed.email,
					avatar: parsed.avatar
				});
				
				// Set profile image if avatar exists
				if (parsed.avatar) {
					console.log('🖼️ Loading existing avatar from AsyncStorage:', parsed.avatar);
					setProfileImage(parsed.avatar);
				} else {
					console.log('⚠️ No avatar found in AsyncStorage, using default');
				}
			}
		} catch (error) {
			console.error('Error loading user info:', error);
		}
	};

	const handleSecurityAlerts = () => {
		Alert.alert('Cảnh báo bảo mật', 'Bạn có 1 cảnh báo bảo mật chưa xem');
	};

	const handleSwitchAccount = () => {
		Alert.alert('Chuyển tài khoản', 'Tính năng chuyển tài khoản đang phát triển');
	};

	const handleDarkMode = () => {
		const newMode = mode === 'dark' ? 'light' : 'dark';
		setMode(newMode);
		Alert.alert('Chế độ tối', `Đã ${newMode === 'dark' ? 'bật' : 'tắt'} chế độ tối`);
	};

	const handleActivityStatus = () => {
		setActivityStatus(!activityStatus);
	};

	const handleUsername = () => {
		setNewUsername(userInfo.username || '');
		setShowUsernameModal(true);
	};

	const validateUsername = (username: string) => {
		if (username.length < 3 || username.length > 50) {
			return 'Username phải có từ 3-50 ký tự';
		}
		
		const usernameRegex = /^[a-z0-9.]+$/;
		if (!usernameRegex.test(username)) {
			return 'Username chỉ được chứa chữ thường, số và dấu chấm';
		}
		
		if (username === userInfo.username) {
			return 'Username mới giống với username hiện tại';
		}
		
		return null;
	};

	const handleUpdateUsername = async () => {
		const error = validateUsername(newUsername);
		if (error) {
			Alert.alert('Lỗi', error);
			return;
		}

		setIsUpdating(true);
		try {
			const result = await updateUsername(newUsername);
			console.log('🔍 Update username response:', result);
			
			// Update local user info
			setUserInfo(prev => ({
				...prev,
				username: result.user.username
			}));
			
			// Update AsyncStorage
			await AsyncStorage.setItem('user_data', JSON.stringify(result.user));
			
			setShowUsernameModal(false);
			Alert.alert('Thành công', 'Username đã được cập nhật!');
		} catch (error: any) {
			console.error('❌ Update username error:', error);
			Alert.alert(
				'Lỗi', 
				error?.response?.data?.message || 'Không thể cập nhật username. Vui lòng thử lại.'
			);
		} finally {
			setIsUpdating(false);
		}
	};

	const handleFamilyCenter = () => {
		Alert.alert('Trung tâm gia đình', 'Tính năng trung tâm gia đình đang phát triển');
	};

	const handleChangeProfileImage = async () => {
		console.log('🎯 handleChangeProfileImage called');
		setShowImagePickerModal(true);
	};

	const pickImageFromLibrary = async () => {
		try {
			console.log('📋 Picking image from library...');
			
			// Request permissions first
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
			console.log('📋 Library permission result:', permissionResult);
			
			if (permissionResult.granted === false) {
				Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh');
				return;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ['images'],
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			console.log('📋 Image picker result:', result);

			if (!result.canceled && result.assets[0]) {
				console.log('📋 Selected image:', result.assets[0].uri);
				await handleImageUpload(result.assets[0].uri);
			}
		} catch (error) {
			console.error('❌ Error picking image:', error);
			Alert.alert('Lỗi', 'Không thể chọn ảnh từ thư viện');
		}
	};

	const takePhoto = async () => {
		try {
			console.log('📸 Taking photo...');
			
			const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
			console.log('📸 Camera permission result:', permissionResult);
			
			if (permissionResult.granted === false) {
				Alert.alert('Quyền truy cập', 'Cần quyền truy cập camera để chụp ảnh');
				return;
			}

			const result = await ImagePicker.launchCameraAsync({
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			console.log('📸 Camera result:', result);

			if (!result.canceled && result.assets[0]) {
				console.log('📸 Captured image:', result.assets[0].uri);
				await handleImageUpload(result.assets[0].uri);
			}
		} catch (error) {
			console.error('❌ Error taking photo:', error);
			Alert.alert('Lỗi', 'Không thể chụp ảnh');
		}
	};

	const handleImageUpload = async (imageUri: string) => {
		try {
			// Show loading state và đóng modal ngay lập tức
			setIsUpdating(true);
			setShowImagePickerModal(false);
			
			// Cách 2: Upload lên S3 rồi cập nhật database
			console.log('📤 Uploading image to S3...');
			const uploadResult = await uploadImageS3({
				uri: imageUri,
				name: `profile-avatar-${Date.now()}.jpg`,
				type: 'image/jpeg'
			});
			
			console.log('✅ Image uploaded to S3:', uploadResult);
			
			// Tạo public URL từ S3 key (cần bucket public)
			const s3Key = uploadResult?.key || '';
			const publicS3Url = `https://dacs4chat.s3.ap-southeast-1.amazonaws.com/${s3Key}`;
			console.log('🔗 S3 Key:', s3Key);
			console.log('🔗 Public S3 URL:', publicS3Url);
			
			// Cập nhật avatar trong database với public S3 URL
			console.log('🔄 Updating avatar in database...');
			const avatarResult = await updateCurrentUserProfile({ 
				avatar: publicS3Url 
			});
			
			console.log('✅ Avatar updated in database:', avatarResult);
			
			// Cập nhật UI ngay lập tức với public S3 URL
			console.log('🖼️ Updating UI immediately with public S3 URL');
			console.log('🔗 Final public S3 URL to display:', publicS3Url);
			console.log('🔗 URL length:', publicS3Url.length);
			console.log('🔗 URL starts with https:', publicS3Url.startsWith('https://'));
			setProfileImage(publicS3Url);
			
			// Cập nhật user_data trong AsyncStorage
			if (avatarResult?.user) {
				console.log('💾 Updating AsyncStorage with server response');
				await AsyncStorage.setItem('user_data', JSON.stringify(avatarResult.user));
				
				// Cập nhật local userInfo state
				setUserInfo(prev => ({
					...prev,
					avatar: avatarResult.user.avatar || publicS3Url
				}));
			} else {
				// Fallback: Cập nhật AsyncStorage với S3 URL nếu server response không có user
				console.log('💾 Fallback: Updating AsyncStorage with S3 URL');
				const currentUserData = await AsyncStorage.getItem('user_data');
				if (currentUserData) {
					const parsedUserData = JSON.parse(currentUserData);
					const updatedUserData = {
						...parsedUserData,
						avatar: publicS3Url
					};
					await AsyncStorage.setItem('user_data', JSON.stringify(updatedUserData));
					
					// Cập nhật local userInfo state
					setUserInfo(prev => ({
						...prev,
						avatar: publicS3Url
					}));
				}
			}
			
			Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật và lưu lên S3!');
		} catch (error: any) {
			console.error('❌ Error uploading avatar to S3:', error);
			
			// Check if JWT expired
			if (error?.response?.status === 403 && error?.response?.data?.error === 'jwt expired') {
				Alert.alert(
					'Phiên đăng nhập hết hạn', 
					'Vui lòng đăng nhập lại để tiếp tục.',
					[
						{
							text: 'Đăng nhập lại',
							onPress: () => {
								// Clear token and navigate to login
								AsyncStorage.removeItem('auth_token');
								AsyncStorage.removeItem('user_id');
								AsyncStorage.removeItem('user_data');
								setAuthToken();
								navigation.navigate('Login');
							}
						}
					]
				);
			} else {
				Alert.alert(
					'Lỗi', 
					error?.response?.data?.message || 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.'
				);
			}
		} finally {
			setIsUpdating(false);
		}
	};

	const handleLogout = async () => {
		try {
			// Lấy token từ AsyncStorage trước khi xóa
			const token = await AsyncStorage.getItem('auth_token');
			
			// Gọi API logout để xóa session trên server (nếu có token)
			if (token) {
				try {
					await logout(token);
					console.log('✅ Logout API call successful');
				} catch (apiError: any) {
					// Log error nhưng không throw để không crash app
					console.log('⚠️ Logout API failed, but continuing with local logout:', apiError?.response?.status);
				}
			}
			
			// Xóa token và user data khỏi AsyncStorage
			await AsyncStorage.removeItem('auth_token');
			await AsyncStorage.removeItem('user_id');
			await AsyncStorage.removeItem('user_data');
			await AsyncStorage.removeItem('user');
			
			// Xóa token khỏi axios headers
			setAuthToken();
			
			// Ngắt kết nối socket
			disconnectSocket();
			
			// Đóng modal trước khi navigate
			setShowLogoutModal(false);
			
			// Navigate về Login screen
			navigation.navigate('Login');
		} catch (error) {
			console.log('⚠️ Logout error (non-critical):', error);
			// Vẫn thực hiện logout local dù có lỗi API
			await AsyncStorage.removeItem('auth_token');
			await AsyncStorage.removeItem('user_id');
			await AsyncStorage.removeItem('user_data');
			await AsyncStorage.removeItem('user');
			setAuthToken();
			disconnectSocket();
			setShowLogoutModal(false);
			navigation.navigate('Login');
		}
	};

	const SettingItem = ({ 
		icon, 
		title, 
		subtitle, 
		onPress, 
		showBadge = false, 
		badgeCount = 0,
		showSwitch = false,
		switchValue = false,
		onSwitchChange 
	}: {
		icon: string;
		title: string;
		subtitle?: string;
		onPress: () => void;
		showBadge?: boolean;
		badgeCount?: number;
		showSwitch?: boolean;
		switchValue?: boolean;
		onSwitchChange?: (value: boolean) => void;
	}) => (
		<TouchableOpacity style={styles.settingItem} onPress={onPress}>
			<View style={styles.settingLeft}>
				<Text style={styles.settingIcon}>{icon}</Text>
				<View style={styles.settingTextContainer}>
					<Text style={styles.settingTitle}>{title}</Text>
					{subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
				</View>
			</View>
			<View style={styles.settingRight}>
				{showBadge && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{badgeCount}</Text>
					</View>
				)}
				{showSwitch ? (
					<Switch
						value={switchValue}
						onValueChange={onSwitchChange}
						trackColor={{ false: '#767577', true: '#007AFF' }}
						thumbColor={switchValue ? '#fff' : '#f4f3f4'}
					/>
				) : (
					<Text style={styles.chevron}>›</Text>
				)}
			</View>
		</TouchableOpacity>
	);

	const dynamicStyles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: colors.background,
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderBottomWidth: 0.5,
			borderBottomColor: colors.border,
		},
		backButton: {
			fontSize: 24,
			color: colors.text,
			marginRight: 16,
		},
		headerTitle: {
			fontSize: 20,
			fontWeight: 'bold',
			color: colors.text,
		},
		sectionTitle: {
			fontSize: 16,
			fontWeight: '600',
			color: colors.text,
			paddingHorizontal: 16,
			paddingVertical: 8,
			backgroundColor: colors.surface,
		},
		settingItem: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderBottomWidth: 0.5,
			borderBottomColor: colors.border,
		},
		settingTitle: {
			fontSize: 16,
			color: colors.text,
			marginBottom: 2,
		},
		settingSubtitle: {
			fontSize: 14,
			color: colors.textSecondary,
		},
		profileName: {
			fontSize: 24,
			fontWeight: 'bold',
			color: colors.text,
			marginBottom: 4,
		},
		profileUsername: {
			fontSize: 16,
			color: colors.textSecondary,
		},
		logoutButton: {
			margin: 16,
			padding: 16,
			backgroundColor: colors.error,
			borderRadius: 12,
			alignItems: 'center',
		},
		logoutText: {
			color: colors.buttonText,
			fontSize: 16,
			fontWeight: '600',
		},
		modalContainer: {
			backgroundColor: colors.modalBackground,
			borderRadius: 16,
			padding: 24,
			width: '100%',
			maxWidth: 400,
			borderWidth: 1,
			borderColor: colors.border,
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
		inputLabel: {
			fontSize: 16,
			color: colors.text,
			marginBottom: 8,
			fontWeight: '500',
		},
		usernameInput: {
			backgroundColor: colors.inputBackground,
			borderRadius: 12,
			padding: 16,
			fontSize: 16,
			color: colors.inputText,
			borderWidth: 1,
			borderColor: colors.inputBorder,
		},
		cancelButton: {
			backgroundColor: colors.secondary,
			borderWidth: 1,
			borderColor: colors.border,
		},
		confirmButton: {
			backgroundColor: colors.primary,
		},
		logoutConfirmButton: {
			backgroundColor: colors.error,
		},
		cancelButtonText: {
			color: colors.buttonText,
			fontSize: 16,
			fontWeight: '600',
		},
		confirmButtonText: {
			color: colors.buttonText,
			fontSize: 16,
			fontWeight: '600',
		},
		logoutConfirmButtonText: {
			color: colors.buttonText,
			fontSize: 16,
			fontWeight: '600',
		},
	});

	return (
		<ScrollView style={dynamicStyles.container}>
			{/* Header */}
			<View style={dynamicStyles.header}>
				<TouchableOpacity onPress={() => navigation.goBack()}>
					<Text style={dynamicStyles.backButton}>←</Text>
				</TouchableOpacity>
				<Text style={dynamicStyles.headerTitle}>Cài đặt</Text>
			</View>

			{/* Profile Section */}
			<View style={styles.profileSection}>
				<View style={styles.profileImageContainer}>
					<Image 
						source={{ uri: profileImage }}
						style={styles.profileImage}
						onLoad={() => console.log('✅ Image loaded successfully:', profileImage)}
						onError={(error) => console.log('❌ Image load error:', error.nativeEvent.error, 'URL:', profileImage)}
						defaultSource={{ uri: 'https://via.placeholder.com/120x120/333/fff?text=Avatar' }}
					/>
					<TouchableOpacity 
						style={styles.cameraButton}
						onPress={() => {
							console.log('🎯 Camera button pressed!');
							handleChangeProfileImage();
						}}
					>
						<Text style={styles.cameraIcon}>📷</Text>
					</TouchableOpacity>
				</View>
				<Text style={styles.profileName}>{userInfo.name || 'User'}</Text>
				<Text style={styles.profileUsername}>@{userInfo.username || 'username'}</Text>
			</View>

			{/* Security Alerts */}
			<SettingItem
				icon="🏠"
				title="Xem cảnh báo bảo mật"
				onPress={handleSecurityAlerts}
				showBadge={true}
				badgeCount={1}
			/>

			{/* Account Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Tài khoản</Text>
				<SettingItem
					icon="👥"
					title="Chuyển tài khoản"
					onPress={handleSwitchAccount}
					showBadge={true}
					badgeCount={1}
				/>
			</View>

			{/* Personal Profile Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Trang cá nhân</Text>
				<SettingItem
					icon="🌙"
					title="Chế độ tối"
					subtitle={mode === 'system' ? 'Hệ thống' : mode === 'dark' ? 'Bật' : 'Tắt'}
					onPress={handleDarkMode}
					showSwitch={true}
					switchValue={isDark}
					onSwitchChange={handleDarkMode}
				/>
				<SettingItem
					icon="🟢"
					title="Trạng thái hoạt động"
					subtitle={activityStatus ? "Đang bật" : "Đang tắt"}
					onPress={handleActivityStatus}
					showSwitch={true}
					switchValue={activityStatus}
					onSwitchChange={setActivityStatus}
				/>
				<SettingItem
					icon="@"
					title="Tên người dùng"
					subtitle={`@${userInfo.username || 'username'}`}
					onPress={handleUsername}
				/>
			</View>

			{/* Family Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Dành cho gia đình</Text>
				<SettingItem
					icon="🏠"
					title="Trung tâm gia đình"
					onPress={handleFamilyCenter}
				/>
			</View>

			{/* Logout Button */}
			<TouchableOpacity 
				style={styles.logoutButton}
				onPress={() => setShowLogoutModal(true)}
			>
				<Text style={styles.logoutText}>Đăng xuất</Text>
			</TouchableOpacity>

			{/* Username Change Modal */}
			<Modal
				visible={showUsernameModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowUsernameModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>Đổi tên người dùng</Text>
						
						<Text style={styles.modalDescription}>
							Nhập username mới (3-50 ký tự, chỉ a-z, 0-9, dấu chấm)
						</Text>
						
						<View style={styles.inputContainer}>
							<Text style={styles.inputLabel}>Username:</Text>
							<TextInput
								style={styles.usernameInput}
								value={newUsername}
								onChangeText={setNewUsername}
								placeholder="Nhập username mới"
								placeholderTextColor="#666"
								autoCapitalize="none"
								autoCorrect={false}
								maxLength={50}
							/>
						</View>
						
						<View style={styles.modalButtons}>
							<TouchableOpacity 
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setShowUsernameModal(false)}
								disabled={isUpdating}
							>
								<Text style={styles.cancelButtonText}>Hủy</Text>
							</TouchableOpacity>
							
							<TouchableOpacity 
								style={[styles.modalButton, styles.confirmButton]}
								onPress={handleUpdateUsername}
								disabled={isUpdating}
							>
								<Text style={styles.confirmButtonText}>
									{isUpdating ? 'Đang cập nhật...' : 'Đổi'}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Logout Confirmation Modal */}
			<Modal
				visible={showLogoutModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowLogoutModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>Đăng xuất</Text>
						
						<Text style={styles.modalDescription}>
							Bạn có chắc chắn muốn đăng xuất?
						</Text>
						
						<View style={styles.modalButtons}>
							<TouchableOpacity 
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setShowLogoutModal(false)}
							>
								<Text style={styles.cancelButtonText}>Hủy</Text>
							</TouchableOpacity>
							
							<TouchableOpacity 
								style={[styles.modalButton, styles.logoutConfirmButton]}
								onPress={handleLogout}
							>
								<Text style={styles.logoutConfirmButtonText}>Đăng xuất</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Image Picker Modal */}
			<Modal
				visible={showImagePickerModal}
				transparent={true}
				animationType="fade"
				onRequestClose={() => setShowImagePickerModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>Thay đổi ảnh đại diện</Text>
						
						<Text style={styles.modalDescription}>
							Chọn cách thay đổi ảnh đại diện
						</Text>
						
						<View style={styles.modalButtons}>
							<TouchableOpacity 
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setShowImagePickerModal(false)}
							>
								<Text style={styles.cancelButtonText}>Hủy</Text>
							</TouchableOpacity>
							
							<TouchableOpacity 
								style={[styles.modalButton, styles.confirmButton]}
								onPress={pickImageFromLibrary}
							>
								<Text style={styles.confirmButtonText}>Chọn từ thư viện</Text>
							</TouchableOpacity>
							
							<TouchableOpacity 
								style={[styles.modalButton, styles.confirmButton]}
								onPress={takePhoto}
							>
								<Text style={styles.confirmButtonText}>Chụp ảnh</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#000',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},
	backButton: {
		fontSize: 24,
		color: '#fff',
		marginRight: 16,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
	},
	profileSection: {
		alignItems: 'center',
		paddingVertical: 32,
	},
	profileImageContainer: {
		position: 'relative',
		marginBottom: 16,
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
	},
	cameraButton: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#000',
		borderWidth: 2,
		borderColor: '#333',
		alignItems: 'center',
		justifyContent: 'center',
	},
	cameraIcon: {
		fontSize: 16,
	},
	profileName: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#fff',
		marginBottom: 4,
	},
	profileUsername: {
		fontSize: 16,
		color: '#999',
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: '#fff',
		paddingHorizontal: 16,
		paddingVertical: 8,
		backgroundColor: '#111',
	},
	settingItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 0.5,
		borderBottomColor: '#333',
	},
	settingLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	settingIcon: {
		fontSize: 20,
		marginRight: 12,
		width: 24,
		textAlign: 'center',
	},
	settingTextContainer: {
		flex: 1,
	},
	settingTitle: {
		fontSize: 16,
		color: '#fff',
		marginBottom: 2,
	},
	settingSubtitle: {
		fontSize: 14,
		color: '#999',
	},
	settingRight: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	badge: {
		backgroundColor: '#FF3B30',
		borderRadius: 10,
		minWidth: 20,
		height: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 8,
	},
	badgeText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: 'bold',
	},
	chevron: {
		fontSize: 18,
		color: '#999',
		fontWeight: '300',
	},
	logoutButton: {
		margin: 16,
		padding: 16,
		backgroundColor: '#FF3B30',
		borderRadius: 12,
		alignItems: 'center',
	},
	logoutText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	// Modal styles
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContainer: {
		backgroundColor: '#1a1a1a',
		borderRadius: 16,
		padding: 24,
		width: '100%',
		maxWidth: 400,
		borderWidth: 1,
		borderColor: '#333',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#fff',
		textAlign: 'center',
		marginBottom: 8,
	},
	modalDescription: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
		marginBottom: 20,
		lineHeight: 20,
	},
	inputContainer: {
		marginBottom: 24,
	},
	inputLabel: {
		fontSize: 16,
		color: '#fff',
		marginBottom: 8,
		fontWeight: '500',
	},
	usernameInput: {
		backgroundColor: '#2a2a2a',
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		color: '#fff',
		borderWidth: 1,
		borderColor: '#444',
	},
	modalButtons: {
		flexDirection: 'row',
		gap: 12,
	},
	modalButton: {
		flex: 1,
		padding: 16,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cancelButton: {
		backgroundColor: '#333',
		borderWidth: 1,
		borderColor: '#555',
	},
	confirmButton: {
		backgroundColor: '#007AFF',
	},
	logoutConfirmButton: {
		backgroundColor: '#FF3B30',
	},
	cancelButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	confirmButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	logoutConfirmButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
});
