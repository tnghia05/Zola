import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, setAuthToken, api, sendVerificationOTP } from '../api';
import { connectSocket } from '../socket';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
	Login: undefined;
	Register: undefined;
	OTPVerification: { email: string; password: string; name?: string };
	Conversations: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const onSubmit = async () => {
		if (!email || !password) return Alert.alert('Thiếu thông tin', 'Nhập email và mật khẩu');
		try {
			setLoading(true);
			const res = await login(email, password);
			console.log('🔍 Login response:', res);
			console.log('🔍 res.user:', res.user);
			console.log('🔍 res.user.id:', res.user?.id);
			console.log('🔍 res.user._id:', (res.user as any)?._id);
			console.log('🔍 res.user.userId:', (res.user as any)?.userId);
			// Lưu token và user ID vào storage
			const token = res.accessToken;
			const userId = res.user.id || (res.user as any)._id || (res.user as any).userId;
			console.log('🔍 Final userId to save:', userId);
					
			if (!userId) {
				console.error('❌ No userId found in login response!');
				Alert.alert('Lỗi', 'Không tìm thấy user ID trong phản hồi đăng nhập');
				return;
			}
			
			await AsyncStorage.setItem('auth_token', token);
			await AsyncStorage.setItem('user_id', userId);
			await AsyncStorage.setItem('user_data', JSON.stringify(res.user));
			console.log('Token saved to storage:', token);
			console.log('User ID saved to storage:', userId);
			console.log('User data saved to storage:', res.user);
			setAuthToken(token);
			console.log('Token set in axios:', api.defaults.headers.common['Authorization']);
			// Don't call connectSocket here - let Chat.tsx handle it
			console.log('🔍 Login successful, navigating to Conversations...');
			navigation.replace('Conversations');
		} catch (e: any) {
			console.error('❌ Login error:', e);
			
			// Handle 403 error - email not verified
			if (e?.response?.status === 403) {
				Alert.alert(
					'Email chưa được xác thực', 
					'Vui lòng kiểm tra email và xác thực tài khoản trước khi đăng nhập. Bạn có muốn gửi lại mã OTP không?',
					[
						{
							text: 'Không',
							style: 'cancel'
						},
						{
							text: 'Gửi lại OTP',
							onPress: async () => {
								try {
									setLoading(true);
									const result = await sendVerificationOTP(email);
									console.log('🔍 Send verification OTP response:', result);
									
									Alert.alert(
										'Đã gửi lại OTP', 
										`Mã OTP xác thực đã được gửi đến ${email}. Vui lòng kiểm tra email và thử đăng nhập lại.`,
										[
											{
												text: 'OK',
												onPress: () => {
													// Clear password field for retry
													setPassword('');
												}
											}
										]
									);
								} catch (error: any) {
									console.error('❌ Send verification OTP error:', error);
									Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại sau.');
								} finally {
									setLoading(false);
								}
							}
						}
					]
				);
			} else {
				Alert.alert('Đăng nhập thất bại', e?.response?.data?.message || e.message);
			}
		} finally {
			setLoading(false);
		}
	};

	const goToRegister = () => {
		navigation.navigate('Register');
	};

	return (
		<KeyboardAvoidingView 
			style={styles.container} 
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={styles.content}>
				<Text style={styles.title}>Đăng nhập</Text>
				<TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" style={styles.input} value={email} onChangeText={setEmail} />
				<TextInput placeholder="Mật khẩu" secureTextEntry style={styles.input} value={password} onChangeText={setPassword} />
				<Button title={loading ? 'Đang xử lý...' : 'Đăng nhập'} onPress={onSubmit} disabled={loading} />
				
				<View style={styles.footer}>
					<Text style={styles.footerText}>Chưa có tài khoản? </Text>
					<TouchableOpacity onPress={goToRegister}>
						<Text style={styles.linkText}>Đăng ký</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { 
		flex: 1, 
		backgroundColor: '#f5f5f5',
	},
	content: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
	},
	title: { 
		fontSize: 28, 
		fontWeight: 'bold', 
		marginBottom: 30, 
		textAlign: 'center',
		color: '#333',
	},
	input: { 
		borderWidth: 1, 
		borderColor: '#ddd', 
		borderRadius: 10, 
		padding: 15, 
		marginBottom: 15,
		fontSize: 16,
		backgroundColor: '#fff',
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 20,
	},
	footerText: {
		fontSize: 16,
		color: '#666',
	},
	linkText: {
		fontSize: 16,
		color: '#007AFF',
		fontWeight: '600',
	},
});


