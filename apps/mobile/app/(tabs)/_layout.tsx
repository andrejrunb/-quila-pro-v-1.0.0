import React from 'react';
import { Tabs } from 'expo-router';
import { Home, BookOpen, Wallet, AlertTriangle, UserCheck, Sparkles, ShieldCheck } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#050b18',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="portaria"
        options={{
          title: 'Portaria',
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="boletim"
        options={{
          title: 'Boletim',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="ocorrencias"
        options={{
          title: 'Ocorrências',
          tabBarIcon: ({ color, size }) => <AlertTriangle color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="chamada"
        options={{
          title: 'Chamada',
          tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="student"
        options={{
          title: 'Albus IA',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size || 20} />,
        }}
      />
    </Tabs>
  );
}
      <Tabs.Screen
        name="financeiro"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="ocorrencias"
        options={{
          title: 'Ocorrências',
          tabBarIcon: ({ color, size }) => <AlertTriangle color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="chamada"
        options={{
          title: 'Chamada',
          tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size || 20} />,
        }}
      />
      <Tabs.Screen
        name="student"
        options={{
          title: 'Albus IA',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size || 20} />,
        }}
      />
    </Tabs>
  );
}
