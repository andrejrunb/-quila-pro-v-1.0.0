import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Bell, LayoutGrid, FileText, Camera } from 'lucide-react-native';

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#030712]">
      <StatusBar barStyle="light-content" />
      <ScrollView className="flex-1 px-6">
        <View className="py-10 flex-row justify-between items-center">
          <View>
            <Text className="text-gray-400 font-bold uppercase tracking-[2px] text-[10px]">Córtex Hub</Text>
            <Text className="text-3xl font-extrabold text-white mt-1">Dashboard</Text>
          </View>
          <TouchableOpacity className="bg-[#111827] p-3 rounded-full border border-[#1e293b]">
            <Bell size={24} className="text-blue-500" />
          </TouchableOpacity>
        </View>

        {/* Status Grid */}
        <View className="flex-row flex-wrap justify-between">
          <View className="bg-[#111827] p-5 rounded-3xl w-[48%] mb-4 border border-[#1e293b] shadow-2xl">
            <View className="bg-blue-500/10 w-10 h-10 rounded-xl items-center justify-center mb-4">
              <Shield size={20} className="text-blue-500" />
            </View>
            <Text className="text-gray-400 text-xs font-bold uppercase">Presentes</Text>
            <Text className="text-white text-3xl font-bold mt-1">96%</Text>
            <Text className="text-blue-400 text-[10px] mt-1 font-bold">242 de 250</Text>
          </View>

          <View className="bg-[#111827] p-5 rounded-3xl w-[48%] mb-4 border border-[#1e293b] shadow-2xl">
            <View className="bg-emerald-500/10 w-10 h-10 rounded-xl items-center justify-center mb-4">
              <Camera size={20} className="text-emerald-500" />
            </View>
            <Text className="text-gray-400 text-xs font-bold uppercase">Sensores</Text>
            <Text className="text-white text-3xl font-bold mt-1">100%</Text>
            <Text className="text-emerald-400 text-[10px] mt-1 font-bold">18 Ativos</Text>
          </View>
        </View>

        {/* Critical Alerts Section */}
        <View className="mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-xl font-extrabold tracking-tight">Protocolos S.O.C</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-xs font-bold uppercase">Ver Todos</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity className="bg-red-500/10 p-5 rounded-[24px] border border-red-500/20 mb-4 flex-row items-center">
            <View className="bg-red-500/20 w-12 h-12 rounded-full items-center justify-center mr-4">
              <Shield size={24} className="text-red-500" />
            </View>
            <View className="flex-1">
              <Text className="text-red-500 font-extrabold text-xs uppercase tracking-wider">Acesso Negado</Text>
              <Text className="text-white font-bold text-base mt-0.5">Indivíduo Externo — Bloco B</Text>
              <Text className="text-gray-500 text-xs mt-1 font-medium">Há 2 minutos</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Actions Grid */}
        <View className="mb-10">
          <Text className="text-white text-xl font-extrabold mb-6 tracking-tight">Ações de Comando</Text>
          <View className="space-y-4">
            <TouchableOpacity className="bg-blue-600 p-5 rounded-[24px] flex-row items-center justify-between shadow-xl shadow-blue-500/20">
              <View className="flex-row items-center">
                <LayoutGrid size={22} className="text-white mr-4" />
                <Text className="text-white font-bold text-lg">Mapeamento de Sala</Text>
              </View>
              <Shield size={18} className="text-white/50" />
            </TouchableOpacity>

            <TouchableOpacity className="bg-[#111827] p-5 rounded-[24px] border border-[#1e293b] flex-row items-center mt-4">
              <FileText size={22} className="text-gray-400 mr-4" />
              <Text className="text-white font-bold text-lg">Relatório Cognitivo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-gray-700 text-center text-[10px] mb-10 font-bold uppercase tracking-widest">
          Sovereign OS — Powered by Áquila Córtex
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
