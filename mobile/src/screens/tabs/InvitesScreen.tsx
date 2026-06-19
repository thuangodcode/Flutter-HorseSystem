import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { Mail, User as UserIcon, Calendar, Info, Check, X } from 'lucide-react-native';
import * as api from '../../api';
import { Invite } from '../../types';

export default function InvitesScreen() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const data = await api.getInvites();
      setInvites(data);
    } catch (error) {
      console.error('Failed to fetch invites', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleResponse = (id: string, action: 'accept' | 'reject') => {
    Alert.alert(
      action === 'accept' ? 'Chấp nhận lời mời' : 'Từ chối lời mời',
      `Bạn có chắc chắn muốn ${action === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: async () => {
            try {
              if (action === 'accept') {
                await api.acceptInvitation(id);
                Alert.alert('Thành công', 'Đã chấp nhận lời mời');
              } else {
                await api.rejectInvitation(id);
                Alert.alert('Thành công', 'Đã từ chối lời mời');
              }
              fetchInvites();
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xử lý yêu cầu. Vui lòng thử lại.');
            }
          }
        }
      ]
    );
  };

  const getStatusLabel = (status: string) => {
    const s = (status || '').toLowerCase();
    switch(s) {
      case 'pending': return 'Đang chờ';
      case 'accepted': return 'Đã chấp nhận';
      case 'rejected': case 'declined': return 'Đã từ chối';
      default: return status.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'accepted') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'rejected' || s === 'declined') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa rõ';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10 flex-row items-center">
        <Text className="text-xl font-bold text-slate-800">Lời mời thi đấu</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchInvites} />}
      >
        {loading && invites.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : invites.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <Mail size={48} color="#cbd5e1" />
            <Text className="text-slate-800 font-bold text-lg mt-4">Không có lời mời</Text>
            <Text className="text-slate-500 text-sm mt-1">Bạn chưa nhận được lời mời nào từ chủ ngựa.</Text>
          </View>
        ) : (
          <View>
            <Text className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
              {invites.length} LỜI MỜI MỚI
            </Text>
            
            {invites.map(invite => {
              const statusColor = getStatusColor(invite.status);
              const isPending = invite.status?.toLowerCase() === 'pending';

              return (
                <View key={invite.id} className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-100">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center flex-1 pr-2">
                      <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                        <UserIcon size={20} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-800">{invite.ownerName || 'Chủ ngựa'}</Text>
                        <Text className="text-xs text-slate-500">{formatDate(invite.sentAt)}</Text>
                      </View>
                    </View>
                    <View className={`px-2 py-1 rounded border ${statusColor}`}>
                      <Text className={`text-[10px] font-bold uppercase ${statusColor.split(' ')[1]}`}>
                        {getStatusLabel(invite.status)}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                    {invite.message ? (
                      <View className="flex-row items-start mb-2">
                        <Info size={14} color="#94a3b8" className="mr-2 mt-0.5" />
                        <Text className="text-sm text-slate-700 italic flex-1">"{invite.message}"</Text>
                      </View>
                    ) : null}
                    
                    <View className="flex-row mt-1">
                      <View className="flex-1">
                        <Text className="text-[10px] uppercase font-bold text-slate-400">Ngựa thi đấu</Text>
                        <Text className="text-sm font-semibold text-slate-800 mt-0.5">{invite.horseName}</Text>
                      </View>
                      <View className="flex-1 border-l border-slate-200 pl-3">
                        <Text className="text-[10px] uppercase font-bold text-slate-400">Trận đấu</Text>
                        <Text className="text-sm font-semibold text-slate-800 mt-0.5" numberOfLines={1}>{invite.raceName}</Text>
                      </View>
                    </View>
                  </View>

                  {isPending && (
                    <View className="flex-row gap-3 mt-2">
                      <TouchableOpacity 
                        className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg border border-rose-200 bg-rose-50"
                        onPress={() => handleResponse(invite.id, 'reject')}
                      >
                        <X size={16} color="#e11d48" className="mr-1" />
                        <Text className="text-rose-600 font-bold">Từ chối</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg bg-blue-600 shadow-sm"
                        onPress={() => handleResponse(invite.id, 'accept')}
                      >
                        <Check size={16} color="white" className="mr-1" />
                        <Text className="text-white font-bold">Chấp nhận</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
