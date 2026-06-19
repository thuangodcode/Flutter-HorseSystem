import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Calendar as CalendarIcon, Clock, MapPin, Flag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as api from '../../api';
import { Race } from '../../types';

export default function JockeyScheduleScreen() {
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const data = await api.getJockeyRaces();
      setRaces(data);
    } catch (error) {
      console.error('Failed to fetch jockey races', error);
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

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa có lịch';
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString('vi-VN'),
        time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10 flex-row items-center">
        <Text className="text-xl font-bold text-slate-800">Lịch trình thi đấu</Text>
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
            <CalendarIcon size={48} color="#cbd5e1" />
            <Text className="text-slate-800 font-bold text-lg mt-4">Lịch trình trống</Text>
            <Text className="text-slate-500 text-sm mt-1">Bạn chưa có lịch thi đấu nào sắp tới.</Text>
          </View>
        ) : (
          <View>
            <Text className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
              SẮP TỚI: {races.length} TRẬN
            </Text>
            
            {races.map(race => {
              const formatted = formatDate(race.scheduledAt || ''); const date = typeof formatted === 'string' ? formatted : formatted.date; const time = typeof formatted === 'string' ? '' : formatted.time;
              return (
                <TouchableOpacity 
                  key={race.id}
                  className="bg-white rounded-xl mb-4 shadow-sm border border-slate-100 flex-row overflow-hidden"
                  onPress={() => router.push(`/${race.id}`)}
                >
                  {/* Date Column */}
                  <View className="w-20 bg-blue-50 items-center justify-center border-r border-blue-100 py-4">
                    <Text className="text-blue-800 font-extrabold text-xl">{date.split('/')[0]}</Text>
                    <Text className="text-blue-600 font-bold text-[10px] uppercase">Tháng {date.split('/')[1]}</Text>
                  </View>
                  
                  {/* Content Column */}
                  <View className="flex-1 p-4 justify-center">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="text-base font-bold text-slate-800 flex-1 mr-2" numberOfLines={2}>
                        {race.name}
                      </Text>
                      <View className="bg-slate-100 px-2 py-0.5 rounded">
                        <Text className="text-[10px] font-bold text-slate-500 uppercase">{getStatusLabel(race.status || '')}</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mt-2">
                      <Clock size={12} color="#64748b" className="mr-1.5" />
                      <Text className="text-xs text-slate-500 font-medium">{time}</Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Flag size={12} color="#64748b" className="mr-1.5" />
                      <Text className="text-xs text-slate-500 font-medium">{race.distance}m</Text>
                    </View>
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
