import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text,  ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { BarChart2, Hash, DollarSign } from 'lucide-react-native';
import * as api from '../../api';
import { Prediction } from '../../types';

export default function PredictionsScreen() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const data = await api.getMyPredictions();
      setPredictions(data);
    } catch (error) {
      console.error('Failed to fetch predictions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  const formatAmount = (amount?: number) => {
    if (!amount) return '0';
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'won') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (s === 'lost') return 'bg-rose-100 text-rose-700 border-rose-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'won') return 'THẮNG';
    if (s === 'lost') return 'THUA';
    if (s === 'pending') return 'ĐANG CHỜ';
    return status.toUpperCase();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 py-4 bg-white border-b border-slate-100 shadow-sm z-10 flex-row items-center">
        <Text className="text-xl font-bold text-slate-800">Dự đoán của tôi</Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchPredictions} />}
      >
        {loading && predictions.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : predictions.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
              <BarChart2 size={32} color="#94a3b8" />
            </View>
            <Text className="text-slate-800 font-bold text-lg">Không có dự đoán</Text>
            <Text className="text-slate-500 text-sm mt-1">Bạn chưa thực hiện lượt dự đoán nào.</Text>
          </View>
        ) : (
          <View>
            <Text className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
              CÓ {predictions.length} LƯỢT DỰ ĐOÁN
            </Text>
            
            {predictions.map(pred => {
              const statusClasses = getStatusColor(pred.status);
              return (
                <View key={pred.id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-slate-100">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center flex-1 pr-2">
                      <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                        <BarChart2 size={20} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-bold text-slate-800" numberOfLines={1}>
                          {pred.raceId ? `Trận đấu ${pred.raceId.substring(0,8)}...` : 'Trận đấu'}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Text className="text-xs text-slate-500 font-medium">Chiến mã: {pred.pickedHorseName || 'Chưa rõ'}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View className={`px-2.5 py-1 rounded-md border ${statusClasses}`}>
                      <Text className={`text-[10px] font-bold ${statusClasses.split(' ')[1]}`}>
                        {getStatusLabel(pred.status)}
                      </Text>
                    </View>
                  </View>

                  <View className="h-px w-full bg-slate-100 my-3" />

                  <View className="flex-row">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Hash size={14} color="#94a3b8" className="mr-1" />
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vị trí dự đoán</Text>
                      </View>
                      <Text className="text-sm font-bold text-slate-700 ml-5">Hạng {pred.predictedPosition}</Text>
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <DollarSign size={14} color="#94a3b8" className="mr-1" />
                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mức cược</Text>
                      </View>
                      <Text className="text-sm font-bold text-slate-700 ml-5">{formatAmount(pred.betAmount)}</Text>
                    </View>
                  </View>
                  
                  {pred.status.toLowerCase() === 'won' && (
                    <View className="mt-3 bg-emerald-50 rounded-lg p-2.5 flex-row items-center justify-center">
                      <Text className="text-emerald-700 text-xs font-bold uppercase tracking-wide">
                        + {formatAmount(pred.prizeAmount)} Điểm Thưởng
                      </Text>
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
