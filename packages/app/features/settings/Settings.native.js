import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { updateUsername, logout, setAuthToken, updateCurrentUserProfile, uploadImageS3 } from '../api';
import { disconnectSocket } from '../socket';
import { useTheme } from '../contexts/ThemeContext';
export default function SettingsScreen({ navigation }) {
    const { mode, isDark, setMode, colors } = useTheme();
    const [activityStatus, setActivityStatus] = useState(true);
    const [userInfo, setUserInfo] = useState({});
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showImagePickerModal, setShowImagePickerModal] = useState(false);
    const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center');
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
                }
                else {
                    console.log('⚠️ No avatar found in AsyncStorage, using default');
                }
            }
        }
        catch (error) {
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
    const validateUsername = (username) => {
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
        }
        catch (error) {
            console.error('❌ Update username error:', error);
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật username. Vui lòng thử lại.');
        }
        finally {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('❌ Error taking photo:', error);
            Alert.alert('Lỗi', 'Không thể chụp ảnh');
        }
    };
    const handleImageUpload = async (imageUri) => {
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
            }
            else {
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
        }
        catch (error) {
            console.error('❌ Error uploading avatar to S3:', error);
            // Check if JWT expired
            if (error?.response?.status === 403 && error?.response?.data?.error === 'jwt expired') {
                Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại để tiếp tục.', [
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
                ]);
            }
            else {
                Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.');
            }
        }
        finally {
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
                }
                catch (apiError) {
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
        }
        catch (error) {
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
    const SettingItem = ({ icon, title, subtitle, onPress, showBadge = false, badgeCount = 0, showSwitch = false, switchValue = false, onSwitchChange }) => (_jsxs(TouchableOpacity, { style: styles.settingItem, onPress: onPress, children: [_jsxs(View, { style: styles.settingLeft, children: [_jsx(Text, { style: styles.settingIcon, children: icon }), _jsxs(View, { style: styles.settingTextContainer, children: [_jsx(Text, { style: styles.settingTitle, children: title }), subtitle && _jsx(Text, { style: styles.settingSubtitle, children: subtitle })] })] }), _jsxs(View, { style: styles.settingRight, children: [showBadge && (_jsx(View, { style: styles.badge, children: _jsx(Text, { style: styles.badgeText, children: badgeCount }) })), showSwitch ? (_jsx(Switch, { value: switchValue, onValueChange: onSwitchChange, trackColor: { false: '#767577', true: '#007AFF' }, thumbColor: switchValue ? '#fff' : '#f4f3f4' })) : (_jsx(Text, { style: styles.chevron, children: "\u203A" }))] })] }));
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
    return (_jsxs(ScrollView, { style: dynamicStyles.container, children: [_jsxs(View, { style: dynamicStyles.header, children: [_jsx(TouchableOpacity, { onPress: () => navigation.goBack(), children: _jsx(Text, { style: dynamicStyles.backButton, children: "\u2190" }) }), _jsx(Text, { style: dynamicStyles.headerTitle, children: "C\u00E0i \u0111\u1EB7t" })] }), _jsxs(View, { style: styles.profileSection, children: [_jsxs(View, { style: styles.profileImageContainer, children: [_jsx(Image, { source: { uri: profileImage }, style: styles.profileImage, onLoad: () => console.log('✅ Image loaded successfully:', profileImage), onError: (error) => console.log('❌ Image load error:', error.nativeEvent.error, 'URL:', profileImage), defaultSource: { uri: 'https://via.placeholder.com/120x120/333/fff?text=Avatar' } }), _jsx(TouchableOpacity, { style: styles.cameraButton, onPress: () => {
                                    console.log('🎯 Camera button pressed!');
                                    handleChangeProfileImage();
                                }, children: _jsx(Text, { style: styles.cameraIcon, children: "\uD83D\uDCF7" }) })] }), _jsx(Text, { style: styles.profileName, children: userInfo.name || 'User' }), _jsxs(Text, { style: styles.profileUsername, children: ["@", userInfo.username || 'username'] })] }), _jsx(SettingItem, { icon: "\uD83C\uDFE0", title: "Xem c\u1EA3nh b\u00E1o b\u1EA3o m\u1EADt", onPress: handleSecurityAlerts, showBadge: true, badgeCount: 1 }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "T\u00E0i kho\u1EA3n" }), _jsx(SettingItem, { icon: "\uD83D\uDC65", title: "Chuy\u1EC3n t\u00E0i kho\u1EA3n", onPress: handleSwitchAccount, showBadge: true, badgeCount: 1 })] }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "Trang c\u00E1 nh\u00E2n" }), _jsx(SettingItem, { icon: "\uD83C\uDF19", title: "Ch\u1EBF \u0111\u1ED9 t\u1ED1i", subtitle: mode === 'system' ? 'Hệ thống' : mode === 'dark' ? 'Bật' : 'Tắt', onPress: handleDarkMode, showSwitch: true, switchValue: isDark, onSwitchChange: handleDarkMode }), _jsx(SettingItem, { icon: "\uD83D\uDFE2", title: "Tr\u1EA1ng th\u00E1i ho\u1EA1t \u0111\u1ED9ng", subtitle: activityStatus ? "Đang bật" : "Đang tắt", onPress: handleActivityStatus, showSwitch: true, switchValue: activityStatus, onSwitchChange: setActivityStatus }), _jsx(SettingItem, { icon: "@", title: "T\u00EAn ng\u01B0\u1EDDi d\u00F9ng", subtitle: `@${userInfo.username || 'username'}`, onPress: handleUsername })] }), _jsxs(View, { style: styles.section, children: [_jsx(Text, { style: styles.sectionTitle, children: "D\u00E0nh cho gia \u0111\u00ECnh" }), _jsx(SettingItem, { icon: "\uD83C\uDFE0", title: "Trung t\u00E2m gia \u0111\u00ECnh", onPress: handleFamilyCenter })] }), _jsx(TouchableOpacity, { style: styles.logoutButton, onPress: () => setShowLogoutModal(true), children: _jsx(Text, { style: styles.logoutText, children: "\u0110\u0103ng xu\u1EA5t" }) }), _jsx(Modal, { visible: showUsernameModal, transparent: true, animationType: "fade", onRequestClose: () => setShowUsernameModal(false), children: _jsx(View, { style: styles.modalOverlay, children: _jsxs(View, { style: styles.modalContainer, children: [_jsx(Text, { style: styles.modalTitle, children: "\u0110\u1ED5i t\u00EAn ng\u01B0\u1EDDi d\u00F9ng" }), _jsx(Text, { style: styles.modalDescription, children: "Nh\u1EADp username m\u1EDBi (3-50 k\u00FD t\u1EF1, ch\u1EC9 a-z, 0-9, d\u1EA5u ch\u1EA5m)" }), _jsxs(View, { style: styles.inputContainer, children: [_jsx(Text, { style: styles.inputLabel, children: "Username:" }), _jsx(TextInput, { style: styles.usernameInput, value: newUsername, onChangeText: setNewUsername, placeholder: "Nh\u1EADp username m\u1EDBi", placeholderTextColor: "#666", autoCapitalize: "none", autoCorrect: false, maxLength: 50 })] }), _jsxs(View, { style: styles.modalButtons, children: [_jsx(TouchableOpacity, { style: [styles.modalButton, styles.cancelButton], onPress: () => setShowUsernameModal(false), disabled: isUpdating, children: _jsx(Text, { style: styles.cancelButtonText, children: "H\u1EE7y" }) }), _jsx(TouchableOpacity, { style: [styles.modalButton, styles.confirmButton], onPress: handleUpdateUsername, disabled: isUpdating, children: _jsx(Text, { style: styles.confirmButtonText, children: isUpdating ? 'Đang cập nhật...' : 'Đổi' }) })] })] }) }) }), _jsx(Modal, { visible: showLogoutModal, transparent: true, animationType: "fade", onRequestClose: () => setShowLogoutModal(false), children: _jsx(View, { style: styles.modalOverlay, children: _jsxs(View, { style: styles.modalContainer, children: [_jsx(Text, { style: styles.modalTitle, children: "\u0110\u0103ng xu\u1EA5t" }), _jsx(Text, { style: styles.modalDescription, children: "B\u1EA1n c\u00F3 ch\u1EAFc ch\u1EAFn mu\u1ED1n \u0111\u0103ng xu\u1EA5t?" }), _jsxs(View, { style: styles.modalButtons, children: [_jsx(TouchableOpacity, { style: [styles.modalButton, styles.cancelButton], onPress: () => setShowLogoutModal(false), children: _jsx(Text, { style: styles.cancelButtonText, children: "H\u1EE7y" }) }), _jsx(TouchableOpacity, { style: [styles.modalButton, styles.logoutConfirmButton], onPress: handleLogout, children: _jsx(Text, { style: styles.logoutConfirmButtonText, children: "\u0110\u0103ng xu\u1EA5t" }) })] })] }) }) }), _jsx(Modal, { visible: showImagePickerModal, transparent: true, animationType: "fade", onRequestClose: () => setShowImagePickerModal(false), children: _jsx(View, { style: styles.modalOverlay, children: _jsxs(View, { style: styles.modalContainer, children: [_jsx(Text, { style: styles.modalTitle, children: "Thay \u0111\u1ED5i \u1EA3nh \u0111\u1EA1i di\u1EC7n" }), _jsx(Text, { style: styles.modalDescription, children: "Ch\u1ECDn c\u00E1ch thay \u0111\u1ED5i \u1EA3nh \u0111\u1EA1i di\u1EC7n" }), _jsxs(View, { style: styles.modalButtons, children: [_jsx(TouchableOpacity, { style: [styles.modalButton, styles.cancelButton], onPress: () => setShowImagePickerModal(false), children: _jsx(Text, { style: styles.cancelButtonText, children: "H\u1EE7y" }) }), _jsx(TouchableOpacity, { style: [styles.modalButton, styles.confirmButton], onPress: pickImageFromLibrary, children: _jsx(Text, { style: styles.confirmButtonText, children: "Ch\u1ECDn t\u1EEB th\u01B0 vi\u1EC7n" }) }), _jsx(TouchableOpacity, { style: [styles.modalButton, styles.confirmButton], onPress: takePhoto, children: _jsx(Text, { style: styles.confirmButtonText, children: "Ch\u1EE5p \u1EA3nh" }) })] })] }) }) })] }));
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
