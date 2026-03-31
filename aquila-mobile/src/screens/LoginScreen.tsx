import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { Car } from 'lucide-react-native';

export default function LoginScreen({ navigation }: any) {
  const [schoolId, setSchoolId] = useState('');
  const [studentHash, setStudentHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!schoolId || !studentHash) {
      setError('Preencha os campos obrigatórios.');
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro de conexão com o servidor escolar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950 justify-center p-5">
      <View className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <View className="items-center mb-8">
          <Car className="text-indigo-500" size={48} />
          <Text className="text-3xl font-bold text-slate-50 mt-4">Áquila App</Text>
          <Text className="text-base text-slate-400 mt-1">Portal dos Pais</Text>
        </View>

        {error ? <Text className="text-rose-500 mb-4 text-center">{error}</Text> : null}

        <TextInput
          className="bg-slate-950 border border-slate-800 text-slate-50 rounded-xl p-4 mb-4 text-base"
          placeholder="ID da Escola"
          placeholderTextColor="#64748b"
          value={schoolId}
          onChangeText={setSchoolId}
          autoCapitalize="none"
        />

        <TextInput
          className="bg-slate-950 border border-slate-800 text-slate-50 rounded-xl p-4 mb-4 text-base"
          placeholder="Código Único do Aluno"
          placeholderTextColor="#64748b"
          value={studentHash}
          onChangeText={setStudentHash}
          autoCapitalize="none"
          secureTextEntry
        />

        <TouchableOpacity 
          className="bg-indigo-600 p-4 rounded-xl items-center mt-2 shadow-lg shadow-indigo-500/20" 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Acessar Portal</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
