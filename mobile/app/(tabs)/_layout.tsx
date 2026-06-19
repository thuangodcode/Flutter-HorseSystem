import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BarChart2, List, Bell, Flag, User as UserIcon, Calendar, Mail, Gavel, Users } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Role } from '../../src/types';

export default function TabsLayout() {
  const { user } = useAuth();
  const role = user?.role || 'SPECTATOR';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb', // blue-600
        tabBarInactiveTintColor: '#94a3b8', // slate-400
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9', // slate-100
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      
      {/* SPECTATOR TABS */}
      <Tabs.Screen
        name="predictions"
        options={{
          title: 'Dự đoán',
          tabBarIcon: ({ color }) => <BarChart2 color={color} size={24} />,
          href: role === 'SPECTATOR' ? '/(tabs)/predictions' : null,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Kết quả',
          tabBarIcon: ({ color }) => <List color={color} size={24} />,
          href: role === 'SPECTATOR' ? '/(tabs)/results' : null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color }) => <Bell color={color} size={24} />,
          href: role === 'SPECTATOR' ? '/(tabs)/notifications' : null,
        }}
      />

      {/* OWNER TABS */}
      <Tabs.Screen
        name="races"
        options={{
          title: 'Vòng đua',
          tabBarIcon: ({ color }) => <Flag color={color} size={24} />,
          href: ['OWNER', 'REFEREE', 'ADMIN'].includes(role) ? '/(tabs)/races' : null,
        }}
      />
      <Tabs.Screen
        name="horses"
        options={{
          title: 'Ngựa đua',
          tabBarIcon: ({ color }) => <UserIcon color={color} size={24} />, // use Pets icon equivalent
          href: role === 'OWNER' ? '/(tabs)/horses' : null,
        }}
      />

      {/* JOCKEY TABS */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lịch trình',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          href: role === 'JOCKEY' ? '/(tabs)/schedule' : null,
        }}
      />
      <Tabs.Screen
        name="invites"
        options={{
          title: 'Lời mời',
          tabBarIcon: ({ color }) => <Mail color={color} size={24} />,
          href: role === 'JOCKEY' ? '/(tabs)/invites' : null,
        }}
      />

      {/* REFEREE TABS */}
      <Tabs.Screen
        name="referee_races"
        options={{
          title: 'Trận của tôi',
          tabBarIcon: ({ color }) => <Gavel color={color} size={24} />,
          href: role === 'REFEREE' ? '/(tabs)/referee_races' : null,
        }}
      />

      {/* ADMIN TABS */}
      <Tabs.Screen
        name="admin_users"
        options={{
          title: 'Thành viên',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          href: role === 'ADMIN' ? '/(tabs)/admin_users' : null,
        }}
      />
    </Tabs>
  );
}
