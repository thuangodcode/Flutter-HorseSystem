import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,  ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Trophy, Mail, Lock, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Đăng Nhập Thất Bại', error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6 pt-6"
      >
        {/* Back Button */}
        <TouchableOpacity 
          className="flex-row items-center gap-3 mb-8"
          onPress={() => router.push('/(auth)/welcome')}
        >
          <View className="p-2 bg-white rounded-lg border border-slate-200">
            <ChevronLeft size={16} color="#64748b" />
          </View>
          <Text className="text-slate-500 font-medium">Quay lại trang chủ</Text>
        </TouchableOpacity>

        {/* Brand Header */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
            <Trophy color="white" size={32} />
          </View>
          <Text className="text-2xl font-extrabold text-slate-800 tracking-tight">ERMS</Text>
          <Text className="text-sm font-medium text-slate-500 mt-1">Hệ thống Quản lý Giải đấu</Text>
        </View>

        {/* Login Form */}
        <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <Text className="text-xl font-bold text-slate-800 mb-1">Đăng Nhập</Text>
          <Text className="text-xs text-slate-500 mb-6">Vui lòng nhập thông tin tài khoản để tiếp tục.</Text>

          {/* Email */}
          <Text className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Địa chỉ Email</Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 mb-4 h-12">
            <Mail size={18} color="#94a3b8" />
            <TextInput 
              className="flex-1 ml-3 text-slate-800"
              placeholder="you@example.com"
              placeholderTextColor="#cbd5e1"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <Text className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Mật khẩu</Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 mb-8 h-12">
            <Lock size={18} color="#94a3b8" />
            <TextInput 
              className="flex-1 ml-3 text-slate-800"
              placeholder="••••••••"
              placeholderTextColor="#cbd5e1"
              secureTextEntry={obscure}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setObscure(!obscure)}>
              {obscure ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            className={`bg-blue-600 rounded-xl py-3.5 flex-row justify-center items-center ${loading ? 'opacity-70' : ''}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">Đăng nhập</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-500">Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text className="text-blue-600 font-bold">Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
