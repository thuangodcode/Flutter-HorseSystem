import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Flag, MapPin, Award, Activity, DollarSign, ListOrdered, Calendar } from 'lucide-react-native';
import * as api from '../../api';
import { Race, Prediction } from '../../types';

export default function RaceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [race, setRace] = useState<Race | null>(null);
  const [horses, setHorses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Prediction State
  const [showPrediction, setShowPrediction] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState<string>('');
  const [betAmount, setBetAmount] = useState<string>('');
  const [predictedPosition, setPredictedPosition] = useState<string>('1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchRaceDetails();
  }, [id]);

  const fetchRaceDetails = async () => {
    setLoading(true);
    try {
      const [raceData, horsesData] = await Promise.all([
        api.getRace(id as string),
        api.getRaceHorses(id as string)
      ]);
      setRace(raceData);
      setHorses(horsesData);
    } catch (error) {
      console.error('Failed to fetch race details', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết trận đấu');
    } finally {
      setLoading(false);
    }
  };

  const handlePlacePrediction = async () => {
    if (!selectedHorseId || !betAmount) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn chiến mã và nhập số điểm cược.');
      return;
    }
    setSubmitting(true);
    try {
      await api.placePrediction(
        id as string, 
        selectedHorseId, 
        parseInt(betAmount), 
        parseInt(predictedPosition) || 1
      );
      Alert.alert('Thành công', 'Đặt cược thành công!');
      setShowPrediction(false);
      setBetAmount('');
      setSelectedHorseId('');
    } catch (error: any) {
      Alert.alert('Thất bại', error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status?: string) => {
    const s = (status || '').toLowerCase();
    switch(s) {
      case 'open': return 'ĐANG MỞ';
      case 'active': return 'HOẠT ĐỘNG';
      case 'completed': return 'HOÀN THÀNH';
      case 'scheduled': return 'LÊN LỊCH';
      case 'confirmed': return 'ĐÃ XÁC NHẬN';
      default: return s.toUpperCase();
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!race) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <Text>Không tìm thấy trận đấu</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-blue-600">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isPredictable = ['open', 'active', 'scheduled'].includes((race.status || '').toLowerCase());

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header Back */}
      <View className="px-5 py-3 flex-row items-center border-b border-slate-100 bg-white z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-lg bg-slate-50">
          <ChevronLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-800 ml-2" numberOfLines={1}>Chi tiết vòng đua</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Race Hero Info */}
          <View className="bg-white px-5 pt-4 pb-6 border-b border-slate-100">
            <View className="flex-row items-center justify-between mb-3">
              <View className="bg-blue-100 px-3 py-1.5 rounded-md border border-blue-200">
                <Text className="text-blue-700 text-[10px] font-bold tracking-wider">{getStatusLabel(race.status || '')}</Text>
              </View>
              {race.scheduledAt && (
                <View className="flex-row items-center">
                  <Calendar size={14} color="#64748b" className="mr-1" />
                  <Text className="text-xs font-semibold text-slate-500">
                    {new Date(race.scheduledAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-2xl font-bold text-slate-800 mb-2">{race.name}</Text>
            
            <View className="flex-row items-center gap-4 mt-2">
              <View className="flex-row items-center bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <Flag size={14} color="#64748b" />
                <Text className="text-xs text-slate-600 font-medium ml-1">{race.distance}m</Text>
              </View>
              <View className="flex-row items-center bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <Activity size={14} color="#64748b" />
                <Text className="text-xs text-slate-600 font-medium ml-1">{race.maxHorses} Ngựa tối đa</Text>
              </View>
            </View>
          </View>

          {/* Prize Info */}
          <View className="px-5 mt-6">
            <Text className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Giải thưởng</Text>
            <View className="flex-row justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <View className="items-center flex-1 border-r border-slate-100">
                <Text className="text-[10px] font-bold text-amber-500 uppercase">Top 1</Text>
                <Text className="text-lg font-extrabold text-slate-800 mt-1">{race.prizeFirst || 0}</Text>
              </View>
              <View className="items-center flex-1 border-r border-slate-100">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Top 2</Text>
                <Text className="text-lg font-extrabold text-slate-800 mt-1">{race.prizeSecond || 0}</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-[10px] font-bold text-orange-400 uppercase">Top 3</Text>
                <Text className="text-lg font-extrabold text-slate-800 mt-1">{race.prizeThird || 0}</Text>
              </View>
            </View>
          </View>

          {/* Horses List */}
          <View className="px-5 mt-8">
            <Text className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              Danh sách Chiến mã ({horses.length})
            </Text>
            
            {horses.length === 0 ? (
              <View className="bg-white p-6 rounded-xl border border-slate-100 items-center">
                <Text className="text-slate-500">Chưa có ngựa đua nào tham gia.</Text>
              </View>
            ) : (
              horses.map((item, idx) => (
                <View key={item.id || idx} className="bg-white p-4 rounded-xl mb-3 border border-slate-100 shadow-sm flex-row items-center">
                  <View className="w-12 h-12 bg-slate-100 rounded-lg mr-4 overflow-hidden items-center justify-center border border-slate-200">
                    <Text className="font-bold text-slate-400">{idx + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-800 mb-1">{item.horse?.name || item.horseName || 'Ngựa thi đấu'}</Text>
                    <Text className="text-xs text-slate-500">Nài ngựa: {item.jockey?.user?.fullName || item.jockeyName || 'Chưa rõ'}</Text>
                  </View>
                  {isPredictable && (
                    <TouchableOpacity 
                      className={`px-3 py-1.5 rounded-lg border ${selectedHorseId === item.horseId ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
                      onPress={() => {
                        setSelectedHorseId(item.horseId);
                        setShowPrediction(true);
                      }}
                    >
                      <Text className={`text-xs font-bold ${selectedHorseId === item.horseId ? 'text-white' : 'text-blue-600'}`}>
                        {selectedHorseId === item.horseId ? 'ĐÃ CHỌN' : 'CHỌN'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Results Block */}
          {race.results && race.results.length > 0 && (
            <View className="px-5 mt-8">
              <Text className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
                Kết Quả Về Đích
              </Text>
              {race.results.map((res: any, idx: number) => (
                <View key={idx} className="bg-emerald-50 p-4 rounded-xl mb-2 border border-emerald-100 flex-row items-center">
                  <View className="w-8 h-8 bg-emerald-200 rounded-full mr-3 items-center justify-center">
                    <Text className="font-extrabold text-emerald-800">{idx + 1}</Text>
                  </View>
                  <Text className="text-base font-bold text-slate-800 flex-1">{res.horseName || 'Ngựa thi đấu'}</Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Place Prediction Sticky Bottom */}
      {showPrediction && isPredictable && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-5 pt-4 pb-8 shadow-2xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-slate-800">Đặt cược dự đoán</Text>
            <TouchableOpacity onPress={() => setShowPrediction(false)} className="p-1">
              <Text className="text-slate-400 font-bold">X</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Mức cược</Text>
              <View className="flex-row items-center border border-slate-300 rounded-lg px-3 h-12 bg-slate-50">
                <DollarSign size={16} color="#64748b" />
                <TextInput 
                  className="flex-1 ml-2 text-slate-800 font-semibold"
                  placeholder="VD: 1000"
                  keyboardType="numeric"
                  value={betAmount}
                  onChangeText={setBetAmount}
                />
              </View>
            </View>
            <View className="w-1/3">
              <Text className="text-xs font-semibold text-slate-500 uppercase mb-1">Dự đoán top</Text>
              <View className="flex-row items-center border border-slate-300 rounded-lg px-3 h-12 bg-slate-50">
                <ListOrdered size={16} color="#64748b" />
                <TextInput 
                  className="flex-1 ml-2 text-slate-800 font-semibold text-center"
                  placeholder="1"
                  keyboardType="numeric"
                  value={predictedPosition}
                  onChangeText={setPredictedPosition}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity 
            className={`bg-blue-600 h-12 rounded-xl items-center justify-center ${submitting ? 'opacity-70' : ''}`}
            onPress={handlePlacePrediction}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">Xác Nhận Đặt Cược</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Floating CTA if prediction is open but not shown */}
      {!showPrediction && isPredictable && (
        <View className="absolute bottom-6 left-5 right-5">
          <TouchableOpacity 
            className="bg-blue-600 h-14 rounded-2xl items-center justify-center shadow-lg shadow-blue-600/30 flex-row"
            onPress={() => setShowPrediction(true)}
          >
            <Award color="white" size={20} className="mr-2" />
            <Text className="text-white font-bold text-lg tracking-wide">THAM GIA DỰ ĐOÁN</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
