import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity,  Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Moon, Target, Award, Shield, Activity, CheckSquare, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-md bg-blue-600 items-center justify-center">
              <Trophy color="white" size={16} />
            </View>
            <Text className="text-lg font-extrabold tracking-tight text-slate-800">ERMS</Text>
          </View>
          
          <View className="flex-row items-center gap-3">
            <TouchableOpacity>
              <Moon color="#64748b" size={20} />
            </TouchableOpacity>
            <TouchableOpacity 
              className="border border-slate-300 px-3 py-1.5 rounded-md"
              onPress={() => router.push('/(auth)/login')}
            >
              <Text className="text-xs font-semibold text-slate-700">Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero */}
        <View className="mx-5 my-2 h-[380px] rounded-2xl overflow-hidden bg-slate-800 shadow-xl relative">
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBm_LN5oeZeYaR3sYCdiQp6wzE_iWsWveVll_Ty41EfiWwU-zloTjxlOrDuWhh8UcZq5RUBXDfQrzdK6z0hCt8XMLs9vxLE651q0OW2AjqnW9slOprPaxlJ1W2sA-Vo3lA8AfgS816nNMQxr9kuDMewIOpEk2tRlfXJss2ULlLp-fh_jjhhw-Y2fquvCd7biikftJIBaqQqYLhuJgBDQBkr6XhHUPPdZ38n2ovi-7eQu9xXNgEiYxKKaSIoPiW0L3DHdB1SVS9Pnddm' }}
            className="w-full h-full absolute"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/40" />
          <View className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
          
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <View className="self-start px-3 py-1 rounded-full border border-blue-500/50 bg-blue-600/30 mb-3">
              <Text className="text-white text-[10px] font-bold uppercase tracking-wider">NỀN TẢNG ERMS</Text>
            </View>
            <Text className="text-white text-3xl font-bold leading-tight mb-2">
              Nâng Tầm Đẳng Cấp{'\n'}Đua Ngựa
            </Text>
            <Text className="text-white/70 text-sm leading-relaxed mb-5">
              Hệ thống quản lý chuyên nghiệp, minh bạch và hiện đại hàng đầu dành cho các giải đua ngựa quốc tế.
            </Text>
            <TouchableOpacity 
              className="bg-blue-600 flex-row items-center justify-center py-3 rounded-xl gap-2"
              onPress={() => router.push('/(auth)/register')}
            >
              <Text className="text-white font-semibold">Khám Phá Ngay</Text>
              <Target color="white" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 mt-8">
          {/* Stats */}
          <View className="flex-row gap-2">
            {[
              { icon: Target, value: '128+', label: 'Giải đua tổ chức', color: '#2563eb' },
              { icon: Activity, value: '500+', label: 'Chiến mã tinh anh', color: '#9333ea' },
              { icon: Award, value: '10+', label: 'Giải đấu lớn', color: '#f59e0b' }
            ].map((stat, i) => (
              <View key={i} className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-slate-100 items-center">
                <stat.icon color={stat.color} size={22} />
                <Text className="text-lg font-bold mt-2 text-slate-800">{stat.value}</Text>
                <Text className="text-[9px] uppercase font-bold text-slate-500 text-center mt-1">{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Features */}
          <View className="mt-10">
            <Text className="text-xl font-bold text-slate-800 mb-4">Tính Năng Ưu Việt</Text>
            {[
              { title: 'Quản lý chuyên nghiệp', desc: 'Quy trình vận hành chuẩn quốc tế, bảo mật tuyệt đối.', icon: Shield, color: 'bg-blue-100 text-blue-600' },
              { title: 'Kết quả trực tiếp', desc: 'Cập nhật kết quả tức thì với độ trễ gần như bằng không.', icon: Activity, color: 'bg-emerald-100 text-emerald-600' },
              { title: 'Đăng ký dễ dàng', desc: 'Đăng ký tham gia dễ dàng qua nền tảng trực tuyến.', icon: CheckSquare, color: 'bg-purple-100 text-purple-600' }
            ].map((f, i) => (
              <View key={i} className="flex-row bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3 items-start">
                <View className={`w-10 h-10 rounded-lg items-center justify-center ${f.color.split(' ')[0]}`}>
                  <f.icon color={f.color.includes('blue') ? '#2563eb' : f.color.includes('emerald') ? '#059669' : '#9333ea'} size={20} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-slate-800">{f.title}</Text>
                  <Text className="text-xs text-slate-500 mt-1">{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Featured Races */}
          <View className="mt-10">
            <Text className="text-xl font-bold text-slate-800 mb-4">Giải Đua Nổi Bật</Text>
            {[
              { title: 'Cúp Quốc gia Grand National', desc: 'Giải đấu quy mô lớn nhất năm với sự góp mặt của các chiến mã huyền thoại.', status: 'Sắp diễn ra', date: '25/12/2024', badge: 'bg-blue-600', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_-LGsB-NXPY1FIQ9-AbkVAt0zjgOABU7YKQ3ba_wNEuLWH8uT1grak3vUg1zP_bPSt1phKpPf1-c56j6uyW3rMrrNnI07jgQiIZDcH9JqZ_fu9GnjqN5iCZHHGoY1vtQLG6mgelbIjW5tGR5TZScEO7IBBd0UrzNrlFL0HfmUzGr1Eow0MTKTrvS280R8xk7kqHXUJon_UGFBIXvcOVS0tq4I-X6EaM9kzWl0eEK57MZ3Ssf8IzVenxJyTyLIBI0O3M_P18EqyCa1' },
              { title: 'Giải đua Glacier Sprint', desc: 'Tốc độ là tất cả. Những vòng chạy kịch tính trên mặt sân cỏ tiêu chuẩn.', status: 'Trực tiếp', date: 'Đang diễn ra', badge: 'bg-purple-600', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1SbKBCegDjoAWAIpTG4fa2rNVldov6CYPM5etTwDVtMu5AQcdWaGqwvO1j7d-GD2lo_reMvtY7gTV3CGhYNxmnng_7PTHOROqMoQgHCU8EjXzO06jpfV3Qoom6RRJp9DVgNI8141aOuRAgOZmW7LfZ_el_f9-5VZj0QyhrYOdE7tLgdCEswrWsjvx_qtoXvSW5JtMmI_Zpw9-qxLP217biu7Ws3AAZ6KXcYPMAgK9w1JD40pb0rvDwg-AfLCnWrzInBw6h7NOdxkw' }
            ].map((r, i) => (
              <View key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 mb-4">
                <View className="h-36 relative bg-slate-200">
                  <Image source={{ uri: r.img }} className="w-full h-full" resizeMode="cover" />
                  <View className={`absolute top-3 right-3 px-3 py-1 rounded-full ${r.badge}`}>
                    <Text className="text-white text-[10px] font-bold">{r.status}</Text>
                  </View>
                </View>
                <View className="p-4">
                  <Text className="text-base font-bold text-slate-800">{r.title}</Text>
                  <Text className="text-xs text-slate-500 mt-1">{r.desc}</Text>
                  <View className="h-px bg-slate-100 my-3" />
                  <View className="flex-row justify-between items-center">
                    <Text className={`text-xs font-bold ${r.badge.replace('bg-', 'text-')}`}>{r.date}</Text>
                    <TouchableOpacity className="flex-row items-center gap-1" onPress={() => router.push('/(auth)/login')}>
                      <Text className="text-xs font-bold text-slate-800">Chi tiết</Text>
                      <ArrowRight size={14} color="#1e293b" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* CTA */}
          <View className="mt-8 bg-white p-6 rounded-2xl items-center shadow-sm border border-slate-100">
            <Text className="text-lg font-bold text-slate-800 text-center">Sẵn Sàng Nâng Tầm Hệ Thống Của Bạn?</Text>
            <Text className="text-xs text-slate-500 text-center mt-2 mb-5">
              Gia nhập cộng đồng quản trị viên chuyên nghiệp và trải nghiệm công nghệ hàng đầu thế giới ngay hôm nay.
            </Text>
            <TouchableOpacity 
              className="bg-blue-600 flex-row items-center justify-center py-3 px-6 rounded-xl w-full"
              onPress={() => router.push('/(auth)/register')}
            >
              <Text className="text-white font-semibold">Bắt Đầu Miễn Phí</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
