import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { User as UserIcon, Tag, Weight, Hash, MapPin, AlignLeft } from 'lucide-react-native';
import * as api from '../../api';
import { Horse } from '../../types';

export default function HorsesScreen() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHorses = async () => {
    setLoading(true);
    try {
      const data = await api.getHorses();
      setHorses(data);
    } catch (error) {
      console.error('Failed to fetch horses', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorses();
  }, []);

  const getStatusLabel = (status: string) => {
    const s = (status || '').toLowerCase();
    switch(s) {
      case 'pending': return 'Đang chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Bị từ chối';
      case 'retired': return 'Nghỉ hưu';
      default: return status.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'rejected') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (s === 'retired') return 'bg-slate-200 text-slate-700 border-slate-300';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-800">Chiến mã của tôi</Text>
        <Text className="text-sm text-slate-500 mt-1">Quản lý hồ sơ và thông tin ngựa đua.</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchHorses} />}
      >
        {loading && horses.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : horses.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <UserIcon size={48} color="#cbd5e1" />
            <Text className="text-slate-800 font-bold text-lg mt-4">Không có ngựa đua</Text>
            <Text className="text-slate-500 text-sm mt-1">Bạn chưa đăng ký chiến mã nào.</Text>
          </View>
        ) : (
          <View>
            <Text className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
              SỞ HỮU {horses.length} CHIẾN MÃ
            </Text>
            
            {horses.map(horse => {
              const statusClasses = getStatusColor(horse.status || '');
              return (
                <View key={horse.id} className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-slate-100">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-slate-800 mb-1">{horse.name}</Text>
                      <View className="flex-row items-center">
                        <Tag size={12} color="#64748b" className="mr-1" />
                        <Text className="text-xs text-slate-500 font-medium">{horse.breed || 'Chưa rõ giống'}</Text>
                      </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-md border ${statusClasses}`}>
                      <Text className={`text-[10px] font-bold uppercase ${statusClasses.split(' ')[1]}`}>
                        {getStatusLabel(horse.status || '')}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <View className="w-1/2 flex-row items-center">
                      <Hash size={14} color="#94a3b8" className="mr-2" />
                      <Text className="text-xs text-slate-600"><Text className="font-bold">Tuổi:</Text> {horse.age}</Text>
                    </View>
                    <View className="w-1/2 flex-row items-center">
                      <Weight size={14} color="#94a3b8" className="mr-2" />
                      <Text className="text-xs text-slate-600"><Text className="font-bold">Cân nặng:</Text> {horse.weight} kg</Text>
                    </View>
                    <View className="w-1/2 flex-row items-center">
                      <AlignLeft size={14} color="#94a3b8" className="mr-2" />
                      <Text className="text-xs text-slate-600"><Text className="font-bold">Màu sắc:</Text> {horse.color || '—'}</Text>
                    </View>
                    <View className="w-1/2 flex-row items-center">
                      <MapPin size={14} color="#94a3b8" className="mr-2" />
                      <Text className="text-xs text-slate-600"><Text className="font-bold">Nguồn gốc:</Text> {horse.origin || '—'}</Text>
                    </View>
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
