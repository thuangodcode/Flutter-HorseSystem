import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Flag, Clock, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as api from '../../api';
import { Race } from '../../types';

export default function RacesScreen() {
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const data = await api.getRaces();
      setRaces(data);
    } catch (error) {
      console.error('Failed to fetch races', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  const getStatusLabel = (status: string) => {
    const s = (status || '').toLowerCase();
    switch(s) {
      case 'pending': return 'Đang chờ';
      case 'open': return 'Đang mở';
      case 'active': return 'Hoạt động';
      case 'completed': return 'Hoàn thành';
      case 'approved': return 'Đã duyệt';
      case 'confirmed': return 'Xác nhận';
      case 'scheduled': return 'Lên lịch';
      default: return status.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (['completed', 'confirmed'].includes(s)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (['open', 'active', 'scheduled'].includes(s)) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa có lịch';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-800">Tất cả vòng đua</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRaces} />}
      >
        {loading && races.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : races.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <Flag size={48} color="#cbd5e1" />
            <Text className="text-slate-800 font-bold text-lg mt-4">Không có vòng đua</Text>
            <Text className="text-slate-500 text-sm mt-1">Hiện chưa có vòng đua nào được lên lịch.</Text>
          </View>
        ) : (
          <View>
            <Text className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
              TÌM THẤY {races.length} VÒNG ĐUA
            </Text>
            
            {races.map(race => {
              const statusColor = getStatusColor(race.status || '');
              return (
                <TouchableOpacity 
                  key={race.id}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-slate-100"
                  onPress={() => router.push(`/${race.id}`)}
                >
                  <View className="flex-row items-center mb-3">
                    <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mr-3 border border-orange-100">
                      <Text className="text-lg">🏇</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-bold text-slate-800 mb-1" numberOfLines={1}>{race.name}</Text>
                      <View className={`self-start px-2 py-0.5 rounded border ${statusColor}`}>
                        <Text className={`text-[10px] font-bold uppercase ${statusColor.split(' ')[1]}`}>
                          {getStatusLabel(race.status || '')}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </View>

                  <View className="h-px w-full bg-slate-100 mb-3" />

                  <View className="flex-row items-center">
                    <Clock size={14} color="#64748b" className="mr-1.5" />
                    <Text className="text-xs text-slate-500 font-medium">{formatDate(race.scheduledAt || '')}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
