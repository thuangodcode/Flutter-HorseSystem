import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useMemo } from 'react';
import { View, Text,  ScrollView, TextInput, TouchableOpacity, RefreshControl, Image, ImageBackground } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../api';
import { Tournament, Race, Role } from '../../types';
import { Search, MapPin, Trophy, Wallet, LogOut, Moon } from 'lucide-react-native';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, rData] = await Promise.all([
        api.getTournaments(),
        api.getRaces(),
      ]);
      setTournaments(tData);
      setRaces(rData);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTournaments = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return tournaments;
    return tournaments.filter(t => {
      const matchName = t.name.toLowerCase().includes(query);
      const matchLocation = t.venue?.toLowerCase().includes(query);
      const hasMatchingRace = races.some(r => r.tournamentId === t.id && r.name.toLowerCase().includes(query));
      return matchName || matchLocation || hasMatchingRace;
    });
  }, [tournaments, races, searchQuery]);

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    switch(s) {
      case 'open': return 'ĐANG MỞ';
      case 'active': return 'HOẠT ĐỘNG';
      case 'scheduled': return 'LÊN LỊCH';
      case 'completed': return 'HOÀN THÀNH';
      default: return status.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (['open', 'active', 'scheduled'].includes(s)) return 'bg-emerald-500 text-emerald-50';
    return 'bg-slate-700 text-slate-100';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 bg-white border-b border-slate-100 shadow-sm z-10">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-md bg-blue-600 items-center justify-center">
            <Trophy color="white" size={16} />
          </View>
          <Text className="text-lg font-extrabold tracking-tight text-slate-800">ERMS</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity>
            <Moon color="#64748b" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout}>
            <LogOut color="#64748b" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {/* Wallet for Spectator */}
        {user?.role === 'SPECTATOR' && (
          <View className="mx-5 mt-5 p-5 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-blue-100 text-[10px] font-bold tracking-widest mb-1">SỐ DƯ ĐIỂM ẢO</Text>
                <Text className="text-white text-2xl font-bold">100,000 Điểm</Text>
              </View>
              <View className="bg-white/20 p-2.5 rounded-full">
                <Wallet color="white" size={28} />
              </View>
            </View>
          </View>
        )}

        {/* Search Bar */}
        <View className="px-5 py-4">
          <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Search size={20} color="#94a3b8" />
            <TextInput 
              className="flex-1 ml-2 h-8 text-slate-800"
              placeholder="Tìm kiếm giải đấu, vòng đua..."
              placeholderTextColor="#cbd5e1"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Tournaments List */}
        <View className="px-5 pb-10">
          {filteredTournaments.length === 0 && !loading ? (
            <View className="py-10 items-center justify-center">
              <Search size={48} color="#cbd5e1" />
              <Text className="text-slate-500 font-medium mt-4 text-center">Không tìm thấy giải đấu</Text>
              <Text className="text-slate-400 text-xs mt-1 text-center">Thử tìm kiếm bằng từ khóa khác</Text>
            </View>
          ) : (
            filteredTournaments.map(tournament => {
              const tRaces = races.filter(r => r.tournamentId === tournament.id);
              return (
                <View key={tournament.id} className="mb-8">
                  {/* Tournament Header */}
                  <View className="flex-row justify-between items-end mb-4">
                    <View className="flex-1 pr-4">
                      <Text className="text-xl font-bold text-slate-800 mb-1" numberOfLines={1}>{tournament.name}</Text>
                      <View className="flex-row items-center">
                        <MapPin size={14} color="#64748b" />
                        <Text className="text-xs font-semibold text-slate-500 ml-1 tracking-wide" numberOfLines={1}>{tournament.venue}</Text>
                      </View>
                    </View>
                    <TouchableOpacity>
                      <Text className="text-blue-600 font-bold text-xs">XEM TẤT CẢ</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Horizontal Races List */}
                  {tRaces.length === 0 ? (
                    <Text className="text-slate-400 text-sm">Không có vòng đua nào.</Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                      {tRaces.map(race => {
                        const isPredictable = ['open', 'active', 'scheduled'].includes((race.status || '').toLowerCase());
                        return (
                          <View key={race.id} className="w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 mr-4">
                            <View className="h-40 relative bg-slate-200">
                              <Image 
                                source={{ uri: 'https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80&w=800' }} 
                                className="w-full h-full absolute"
                                resizeMode="cover"
                              />
                              <View className={`absolute top-3 right-3 px-3 py-1.5 rounded-full flex-row items-center ${getStatusColor(race.status || '').split(' ')[0]}`}>
                                {isPredictable && <View className="w-2 h-2 rounded-full bg-emerald-300 mr-1.5" />}
                                <Text className={`text-[10px] font-bold tracking-wider ${getStatusColor(race.status || '').split(' ')[1]}`}>
                                  {getStatusLabel(race.status || '')}
                                </Text>
                              </View>
                            </View>
                            <View className="p-4">
                              <Text className="text-lg font-bold text-slate-800 mb-1" numberOfLines={1}>{race.name}</Text>
                              <Text className="text-xs text-slate-500 mb-4">Khoảng cách: {race.distance}m • {race.maxHorses} Chiến mã</Text>
                              
                              {isPredictable && (
                                <TouchableOpacity className="bg-blue-600/10 border border-blue-600/20 py-3 rounded-lg items-center">
                                  <Text className="text-blue-600 font-bold tracking-wider">DỰ ĐOÁN NGAY</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
