import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Bell, Trophy, XCircle, Flag, CheckCircle, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as api from '../../api';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIconConfig = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('won')) return { Icon: Trophy, bg: 'bg-emerald-100', color: '#10b981' };
    if (t.includes('lost')) return { Icon: XCircle, bg: 'bg-rose-100', color: '#f43f5e' };
    if (t.includes('started')) return { Icon: Flag, bg: 'bg-blue-100', color: '#3b82f6' };
    if (t.includes('completed')) return { Icon: CheckCircle, bg: 'bg-emerald-100', color: '#10b981' };
    if (t.includes('system')) return { Icon: Info, bg: 'bg-slate-200', color: '#64748b' };
    return { Icon: Bell, bg: 'bg-slate-200', color: '#64748b' };
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10 flex-row items-center">
        <Text className="text-xl font-bold text-slate-800">Thông báo</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} />}
      >
        {loading && notifications.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : notifications.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
              <Bell size={32} color="#94a3b8" />
            </View>
            <Text className="text-slate-800 font-bold text-lg">Không có thông báo</Text>
            <Text className="text-slate-500 text-sm mt-1">Bạn không có thông báo nào mới.</Text>
          </View>
        ) : (
          <View>
            <Text className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
              CÓ {notifications.length} THÔNG BÁO
            </Text>
            
            {notifications.map((notif, i) => {
              const type = notif.type || '';
              const title = notif.title || type || 'Thông báo';
              const message = notif.message || '';
              const { Icon, bg, color } = getIconConfig(type);
              
              const rawRaceId = notif.raceId || notif.race?.id || notif.data?.raceId || notif.prediction?.raceId;
              const hasRaceId = !!rawRaceId;

              const content = (
                <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-slate-100 flex-row items-start">
                  <View className={`w-10 h-10 rounded-xl items-center justify-center ${bg}`}>
                    <Icon size={20} color={color} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-bold text-slate-800 mb-1">{title}</Text>
                    {message ? <Text className="text-sm text-slate-500" numberOfLines={3}>{message}</Text> : null}
                  </View>
                </View>
              );

              return (
                <View key={notif.id || notif._id || i}>
                  {hasRaceId ? (
                    <TouchableOpacity onPress={() => router.push(`/${rawRaceId}`)}>
                      {content}
                    </TouchableOpacity>
                  ) : content}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
