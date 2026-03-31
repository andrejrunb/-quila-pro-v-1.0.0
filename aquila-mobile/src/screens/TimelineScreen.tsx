import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { Bell, MapPin, UserCheck, Car } from 'lucide-react-native';
import * as Location from 'expo-location';

interface TimelineEvent {
  id: number;
  type: string;
  time: string;
  location: string;
}

export default function TimelineScreen({ navigation }: any) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [arriving, setArriving] = useState(false);
  const [studentName, setStudentName] = useState('Buscando...');

  useEffect(() => {
    fetchTimeline();
    setupGeolocation();
  }, []);

  const getStoreItem = async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  };

  const fetchTimeline = async () => {
    try {
      const hash = await getStoreItem('student_hash');
      const response = await api.get(`/timeline?studentHash=${hash}`);
      if (response.data.success) {
        setEvents(response.data.timeline);
        setStudentName('Aluno'); // No MVP é mockado "Aluno Oculto"
      }
    } catch (err) {
      console.log('Error fetching timeline', err);
    } finally {
      setLoading(false);
    }
  };

  const setupGeolocation = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permissão de GPS negada');
      }
    }
  };

  const handleDriveThru = async () => {
    try {
      setArriving(true);
      const schoolId = await getStoreItem('school_id');
      const studentHash = await getStoreItem('student_hash');
      
      const response = await api.post('/arrive', { schoolId, studentHash });
      if (response.data.success) {
        if (Platform.OS === 'web') alert('Sucesso: Escola notificada! Estão levando o aluno até a portaria.');
        else Alert.alert('Sucesso', 'A escola foi notificada! Estão preparando o aluno.');
      }
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Erro: ' + err.message);
      else Alert.alert('Erro', 'Falha ao notificar chegada.');
    } finally {
      setArriving(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      localStorage.clear();
    } else {
      await SecureStore.deleteItemAsync('parent_token');
    }
    navigation.replace('Login');
  };


  return (
    <View className="flex-1 bg-slate-950 p-6">
      <View className="flex-row justify-between items-center mt-10 mb-5">
        <Text className="text-2xl font-bold text-slate-50">Painel Diário</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text className="text-rose-500 font-bold">Sair</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        className={`bg-indigo-600 p-6 rounded-2xl flex-row items-center space-x-4 mb-8 shadow-xl shadow-indigo-500/30 ${arriving ? 'opacity-80' : ''}`}
        onPress={handleDriveThru}
        disabled={arriving}
      >
        {arriving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Car color="#fff" size={32} />
            <View className="ml-4">
              <Text className="text-white text-xl font-bold">Avisar Chegada</Text>
              <Text className="text-indigo-200 text-sm">Drive-Thru / Portaria</Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      <Text className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Últimos Registros</Text>

      {loading ? (
        <ActivityIndicator color="#4f46e5" size="large" className="mt-10" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View className="bg-slate-900 rounded-xl p-4 mb-3 flex-row items-center border-l-4 border-indigo-500 shadow-sm">
              <View className="w-12 h-12 rounded-full bg-slate-950 justify-center items-center mr-4">
                {item.type === 'entry' ? <UserCheck color="#10b981" size={24} /> : <Bell color="#f59e0b" size={24} />}
              </View>
              <View className="flex-1">
                <Text className="text-slate-50 text-base font-bold">{item.type === 'entry' ? 'Entrada Registrada' : 'Notificação'}</Text>
                <Text className="text-slate-400 text-xs mt-1">{new Date(item.time).toLocaleTimeString()} - {new Date(item.time).toLocaleDateString()}</Text>
                <View className="flex-row items-center mt-2 space-x-1">
                  <MapPin color="#94a3b8" size={12} />
                  <Text className="text-slate-400 text-xs ml-1">{item.location}</Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={<Text className="text-slate-500 text-center mt-10">Nenhum evento registrado hoje.</Text>}
        />
      )}
    </View>
  );
}
