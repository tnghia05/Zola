import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { register } from '../api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
	Login: undefined;
	Register: undefined;
	OTPVerification: { email: string; password: string; name?: string };
	Conversations: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [name, setName] = useState('');
	const [loading, setLoading] = useState(false);

	const validateForm = () => {
		if (!email || !password || !confirmPassword) {
			Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin');
			return false;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			Alert.alert('Email không hợp lệ', 'Vui lòng nhập email đúng định dạng');
			return false;
		}


		// Password validation
		if (password.length < 6) {
			Alert.alert('Mật khẩu yếu', 'Mật khẩu phải có ít nhất 6 ký tự');
			return false;
		}

		// Confirm password
		if (password !== confirmPassword) {
			Alert.alert('Mật khẩu không khớp', 'Mật khẩu xác nhận không khớp');
			return false;
		}

		return true;
	};

	const onSubmit = async () => {
		if (!validateForm()) return;

		try {
			setLoading(true);
			
			// ĐÚNG LOGIC: Register trước với isEmailVerified: false
			// Step 1: Register user first (with isEmailVerified: false)
			console.log('🔍 Attempting to register user with isEmailVerified: false');
			const registerResult = await register(email, password, name || undefined);
			console.log('🔍 Register response:', registerResult);

			const otpResult = registerResult?.otp;
			console.log('🔍 OTP info from register response:', otpResult);

			const goToOtpScreen = () =>
				navigation.navigate('OTPVerification', {
					email,
					password,
					name: name || undefined,
				});

			if (otpResult?.otpCreated && otpResult.emailSent === false) {
				// OTP was generated but email failed to send
				console.warn('⚠️ OTP created but email sending failed');
				Alert.alert(
					'Cảnh báo',
					otpResult.message ||
						'OTP đã được tạo nhưng không thể gửi email. Bạn có thể thử gửi lại OTP ở màn hình tiếp theo.',
					[
						{
							text: 'Tiếp tục',
							onPress: goToOtpScreen,
						},
					],
				);
				return;
			}

			goToOtpScreen();

			if (otpResult?.emailSent === true) {
				Alert.alert(
					'Đăng ký thành công',
					`Mã OTP đã được gửi đến ${email}. Vui lòng nhập mã xác thực.`,
				);
			} else if (otpResult?.otpCreated === false || !otpResult) {
				Alert.alert(
					'Đăng ký thành công',
					'Không thể gửi OTP tự động. Vui lòng sử dụng nút "Gửi lại OTP" ở màn hình tiếp theo.',
				);
			}
		} catch (e: any) {
			console.error('❌ Registration error:', e);
			console.error('❌ Error response:', e?.response);
			console.error('❌ Error response data:', e?.response?.data);
			console.error('❌ Error response status:', e?.response?.status);
			
			let errorMessage = 'Có lỗi xảy ra, vui lòng thử lại';
			
			if (e?.response?.status === 400) {
				// Handle validation errors
				const errorData = e?.response?.data;
				if (errorData?.message) {
					errorMessage = errorData.message;
					
					// Special handling for backend validation message
					if (errorData.message.includes('xác minh email bằng OTP trước khi đăng ký')) {
						errorMessage = 'Backend đang yêu cầu verify email trước khi register. Cần sửa backend logic để cho phép register với isEmailVerified: false.';
					}
				} else if (errorData?.errors) {
					// Handle multiple validation errors
					const errors = Array.isArray(errorData.errors) 
						? errorData.errors.join(', ') 
						: JSON.stringify(errorData.errors);
					errorMessage = `Lỗi validation: ${errors}`;
				} else {
					errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
				}
			} else if (e?.response?.status === 409) {
				errorMessage = 'Email đã được sử dụng. Vui lòng chọn email khác.';
			} else if (e?.response?.data?.message) {
				errorMessage = e.response.data.message;
			} else if (e?.message) {
				errorMessage = e.message;
			}
			
			Alert.alert('Đăng ký thất bại', errorMessage);
		} finally {
			setLoading(false);
		}
	};

	const goToLogin = () => {
		navigation.navigate('Login');
	};

	return (
		<KeyboardAvoidingView 
			style={styles.container} 
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<View style={styles.content}>
				<Text style={styles.title}>Đăng ký tài khoản</Text>
				
				<TextInput 
					placeholder="Họ và tên (tùy chọn)" 
					style={styles.input} 
					value={name} 
					onChangeText={setName}
					autoCapitalize="words"
				/>
				
				<TextInput 
					placeholder="Email" 
					autoCapitalize="none" 
					keyboardType="email-address" 
					style={styles.input} 
					value={email} 
					onChangeText={setEmail} 
				/>
				
				<TextInput 
					placeholder="Mật khẩu" 
					secureTextEntry 
					style={styles.input} 
					value={password} 
					onChangeText={setPassword} 
				/>
				
				<TextInput 
					placeholder="Xác nhận mật khẩu" 
					secureTextEntry 
					style={styles.input} 
					value={confirmPassword} 
					onChangeText={setConfirmPassword} 
				/>
				
				<Button 
					title={loading ? 'Đang xử lý...' : 'Đăng ký'} 
					onPress={onSubmit} 
					disabled={loading} 
				/>
				
				<View style={styles.footer}>
					<Text style={styles.footerText}>Đã có tài khoản? </Text>
					<TouchableOpacity onPress={goToLogin}>
						<Text style={styles.linkText}>Đăng nhập</Text>
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
        
