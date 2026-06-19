import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { List, ChevronRight } from 'lucide-react-native';
import * as api from '../../api';
import { Race } from '../../types';

export default function ResultsScreen() {
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const data = await api.getRaces();
      setRaces(data);
    } catch (error) {
      console.error('Failed to fetch races for results', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    switch(s) {
      case 'pending': return 'Đang chờ';
      case 'open': return 'Đang mở';
      case 'active': return 'Hoạt động';
      case 'completed': return 'Hoàn thành';
      case 'approved': return 'Đã duyệt';
      case 'confirmed': return 'Xác nhận';
      case 'scheduled': return 'Lên lịch';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (['completed', 'confirmed'].includes(s)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (['open', 'active', 'scheduled'].includes(s)) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-800">Kết quả vòng đua</Text>
        <Text className="text-sm text-slate-500 mt-1">Chọn một vòng đua để xem thứ tự về đích.</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRaces} />}
      >
        <Text className="text-base font-bold text-slate-800 mb-4">Chọn vòng đua</Text>
        
        {loading && races.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : races.length === 0 ? (
          <View className="py-10 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
              <List size={32} color="#94a3b8" />
            </View>
            <Text className="text-slate-500 font-medium text-center">Không có vòng đua nào</Text>
          </View>
        ) : (
          <View>
            {races.map(race => {
              const statusClasses = getStatusColor(race.status || '');
              return (
                <TouchableOpacity 
                  key={race.id}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-slate-100 flex-row items-center justify-between"
                  onPress={() => router.push(`/${race.id}`)}
                >
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-bold text-slate-800 mb-1" numberOfLines={1}>{race.name}</Text>
                    <Text className="text-xs text-slate-500">{getStatusLabel(race.status || '')}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className={`px-2.5 py-1 rounded-md border mr-3 ${statusClasses}`}>
                      <Text className={`text-[10px] font-bold uppercase ${statusClasses.split(' ')[1]}`}>
                        {getStatusLabel(race.status || '')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#cbd5e1" />
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
