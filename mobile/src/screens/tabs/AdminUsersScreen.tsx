import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Users, Shield, User as UserIcon, Settings, ChevronDown } from 'lucide-react-native';
import * as api from '../../api';
import { User, Role } from '../../types';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch admin users', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thành viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = (userId: string, currentRole: Role, userName: string) => {
    Alert.alert(
      `Đổi vai trò - ${userName}`,
      `Chọn vai trò mới cho người dùng:`,
      [
        { text: 'Khán giả', onPress: () => updateRole(userId, 'SPECTATOR') },
        { text: 'Chủ ngựa', onPress: () => updateRole(userId, 'OWNER') },
        { text: 'Nài ngựa', onPress: () => updateRole(userId, 'JOCKEY') },
        { text: 'Trọng tài', onPress: () => updateRole(userId, 'REFEREE') },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  const updateRole = async (userId: string, role: Role) => {
    try {
      await api.updateUserRole(userId, role);
      Alert.alert('Thành công', 'Cập nhật vai trò thành công!');
      fetchUsers();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật vai trò.');
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role.toLowerCase()) {
      case 'admin': return 'Quản trị viên';
      case 'referee': return 'Trọng tài';
      case 'owner': return 'Chủ ngựa';
      case 'jockey': return 'Nài ngựa';
      default: return 'Khán giả';
    }
  };

  const getRoleColor = (role: string) => {
    switch(role.toLowerCase()) {
      case 'admin': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'referee': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'owner': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'jockey': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-800">Thành viên hệ thống</Text>
        <Text className="text-sm text-slate-500 mt-1">Quản lý và phân quyền người dùng.</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUsers} />}
      >
        {loading && users.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : users.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <Users size={48} color="#cbd5e1" />
            <Text className="text-slate-500 font-medium text-center mt-4">Không có dữ liệu người dùng.</Text>
          </View>
        ) : (
          <View>
            {users.map(u => {
              const roleColor = getRoleColor(u.role);
              const isAdmin = u.role === 'ADMIN';
              return (
                <View key={u.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-slate-100">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row flex-1">
                      <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
                        <UserIcon size={20} color="#64748b" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-800">{u.name}</Text>
                        <Text className="text-xs text-slate-500">{u.email}</Text>
                      </View>
                    </View>
                    
                    <View className={`px-2 py-1 rounded border ${roleColor}`}>
                      <Text className={`text-[10px] font-bold uppercase ${roleColor.split(' ')[1]}`}>
                        {getRoleLabel(u.role)}
                      </Text>
                    </View>
                  </View>

                  <View className="h-px w-full bg-slate-100 my-3" />
                  
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <View className={`w-2 h-2 rounded-full mr-1.5 ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <Text className="text-xs font-semibold text-slate-500">
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </Text>
                    </View>

                    {!isAdmin && (
                      <TouchableOpacity 
                        className="flex-row items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg"
                        onPress={() => handleChangeRole(u.id, u.role, u.name)}
                      >
                        <Shield size={14} color="#64748b" />
                        <Text className="text-xs font-semibold text-slate-700 ml-1.5 mr-1">Phân quyền</Text>
                        <ChevronDown size={14} color="#64748b" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
