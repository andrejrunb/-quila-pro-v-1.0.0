import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { Car } from 'lucide-react-native';

interface LoginScreenProps {
  navigation: { replace: (screen: string) => void };
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [schoolId, setSchoolId] = useState('');
  const [studentHash, setStudentHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!schoolId || !studentHash) {
      setError('Por favor, preencha o ID da Unidade e o Código do Aluno para continuar.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await api.post('/login', { schoolId, studentHash });

      if (response.data.success) {
        if (Platform.OS === 'web') {
          localStorage.setItem('parent_token', response.data.token);
          localStorage.setItem('student_hash', studentHash);
          localStorage.setItem('school_id', schoolId);
        } else {
          await SecureStore.setItemAsync('parent_token', response.data.token);
          await SecureStore.setItemAsync('student_hash', studentHash);
          await SecureStore.setItemAsync('school_id', schoolId);
        }
        navigation.replace('Timeline');
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const errorMessage = axiosErr.response?.data?.error || 'Erro de conexão com o servidor escolar. Verifique sua internet ou tente novamente em instantes.';
      setError(errorMessage);
      console.error('[Login Error]', { schoolId, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#030712] justify-center p-6">
      <View className="bg-[#111827] p-8 rounded-[32px] border border-[#1e293b] shadow-2xl">
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-blue-600/10 rounded-full items-center justify-center border border-blue-500/20">
            <Car className="text-blue-500" size={40} />
          </View>
          <Text className="text-4xl font-extrabold text-white mt-6 tracking-tight">ÁQUILA</Text>
          <Text className="text-blue-400 font-bold tracking-[2px] text-xs uppercase mt-1">Sovereign Intelligence</Text>
        </View>

        {error ? (
          <View className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl mb-6">
            <Text className="text-red-400 text-center text-sm">{error}</Text>
          </View>
        ) : null}

        <View className="space-y-4">
          <View>
            <Text className="text-gray-400 text-xs font-bold mb-2 ml-1 uppercase">ID da Unidade</Text>
            <TextInput
              className="bg-[#0f172a] border border-[#1e293b] text-white rounded-2xl p-4 text-base focus:border-blue-500"
              placeholder="Ex: BSB-01"
              placeholderTextColor="#475569"
              value={schoolId}
              onChangeText={setSchoolId}
              autoCapitalize="none"
            />
          </View>

          <View className="mt-4">
            <Text className="text-gray-400 text-xs font-bold mb-2 ml-1 uppercase">Código do Aluno</Text>
            <TextInput
              className="bg-[#0f172a] border border-[#1e293b] text-white rounded-2xl p-4 text-base focus:border-blue-500"
              placeholder="••••••••"
              placeholderTextColor="#475569"
              value={studentHash}
              onChangeText={setStudentHash}
              autoCapitalize="none"
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity 
          className="bg-blue-600 p-5 rounded-2xl items-center mt-8 shadow-xl shadow-blue-500/30" 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Acessar Portal</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          className="mt-6 items-center" 
          onPress={() => alert('Abrindo canal de suporte... (Em breve: Anexo automático de logs)')}
        >
          <Text className="text-gray-400 text-sm font-medium">
            Problemas com o acesso? <Text className="text-blue-400 underline">Fale com o Suporte</Text>
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-500 text-center text-xs mt-8">
          Versão 1.5.0 — Córtex Evolution
        </Text>
      </View>
    </View>
  );
}
