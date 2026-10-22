import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import {
  Bell, MapPin, UserCheck, Car, BookOpen, AlertTriangle,
  LogOut, ChevronRight, Filter,
} from 'lucide-react-native';

// ─── Types ─────────────────────────────────────────────────
type EventCategory = 'entry' | 'exit' | 'grade' | 'behavior' | 'pickup' | 'alert';

interface TimelineEvent {
  id: number;
  type: EventCategory;
  time: string;
  location: string;
  title?: string;
  detail?: string;       // Ex: "Nota 8.5 — Matemática" ou "Comportamento positivo"
  severity?: 'info' | 'warning' | 'success';
}

interface TimelineScreenProps {
  navigation: { replace: (screen: string) => void; navigate: (screen: string) => void };
}

// ─── Category Config ───────────────────────────────────────
const CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; bgColor: string }> = {
  entry:    { label: 'Entrada',       color: '#10b981', bgColor: 'bg-emerald-500/10' },
  exit:     { label: 'Saída',         color: '#f59e0b', bgColor: 'bg-amber-500/10' },
  grade:    { label: 'Nota',          color: '#3b82f6', bgColor: 'bg-blue-500/10' },
  behavior: { label: 'Comportamento', color: '#8b5cf6', bgColor: 'bg-violet-500/10' },
  pickup:  { label: 'Busca',         color: '#6366f1', bgColor: 'bg-indigo-500/10' },
  alert:   { label: 'Comunicado',    color: '#ef4444', bgColor: 'bg-red-500/10' },
};

const ALL_CATEGORIES: EventCategory[] = ['entry', 'exit', 'grade', 'behavior', 'pickup', 'alert'];

// ─── Helpers ───────────────────────────────────────────────
const getStoreItem = async (key: string) => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

function getEventIcon(type: EventCategory) {
  const size = 22;
  const color = CATEGORY_CONFIG[type]?.color ?? '#94a3b8';
  switch (type) {
    case 'entry': return <UserCheck color={color} size={size} />;
    case 'exit': return <LogOut color={color} size={size} />;
    case 'grade': return <BookOpen color={color} size={size} />;
    case 'behavior': return <AlertTriangle color={color} size={size} />;
    case 'pickup': return <Car color={color} size={size} />;
    case 'alert': return <Bell color={color} size={size} />;
    default: return <Bell color={color} size={size} />;
  }
}

function getEventTitle(event: TimelineEvent): string {
  if (event.title) return event.title;
  switch (event.type) {
    case 'entry': return 'Entrada Registrada';
    case 'exit': return 'Saída Registrada';
    case 'grade': return 'Nota Lançada';
    case 'behavior': return 'Registro Comportamental';
    case 'pickup': return 'Busca/Pickup';
    case 'alert': return 'Comunicado da Escola';
    default: return 'Evento';
  }
}

function getBorderColor(type: EventCategory): string {
  switch (type) {
    case 'entry': return 'border-emerald-500';
    case 'exit': return 'border-amber-500';
    case 'grade': return 'border-blue-500';
    case 'behavior': return 'border-violet-500';
    case 'pickup': return 'border-indigo-500';
    case 'alert': return 'border-red-500';
    default: return 'border-gray-500';
  }
}

// ─── Component ─────────────────────────────────────────────
export default function TimelineScreen({ navigation }: TimelineScreenProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [arriving, setArriving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<EventCategory | 'all'>('all');

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const hash = await getStoreItem('student_hash');
      const response = await api.get(`/timeline?studentHash=${hash}`);
      if (response.data.success) {
        setEvents(response.data.timeline);
      }
    } catch (err: unknown) {
      console.error('[Timeline] Erro ao carregar:', err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  };

  const handleDriveThru = async () => {
    try {
      setArriving(true);
      const schoolId = await getStoreItem('school_id');
      const studentHash = await getStoreItem('student_hash');

      const response = await api.post('/arrive', { schoolId, studentHash });
      if (response.data.success) {
        Alert.alert('Sucesso', 'A escola foi notificada! Estão preparando o aluno.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      Alert.alert('Erro', `Falha ao notificar chegada: ${msg}`);
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

  const filteredEvents = activeFilter === 'all'
    ? events
    : events.filter((e) => e.type === activeFilter);

  const renderFilterTab = useCallback(
    (cat: EventCategory | 'all') => {
      const isActive = activeFilter === cat;
      const label = cat === 'all' ? 'Todos' : CATEGORY_CONFIG[cat]?.label ?? cat;
      return (
        <TouchableOpacity
          key={cat}
          className={`px-4 py-2 rounded-full mr-2 ${
            isActive ? 'bg-indigo-600' : 'bg-[#111827] border border-[#1e293b]'
          }`}
          onPress={() => setActiveFilter(cat)}
        >
          <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeFilter],
  );

  return (
    <SafeAreaView className="flex-1 bg-[#030712]">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="flex-row justify-between items-center pt-6 mb-4">
          <View>
            <Text className="text-gray-400 font-bold uppercase tracking-[2px] text-[10px]">
              Córtex Pais
            </Text>
            <Text className="text-2xl font-extrabold text-white mt-1">Painel Diário</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-rose-500 font-bold">Sair</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="flex-row mb-6">
          <TouchableOpacity
            className={`flex-1 bg-indigo-600 p-5 rounded-2xl flex-row items-center shadow-xl shadow-indigo-500/30 mr-3 ${arriving ? 'opacity-70' : ''}`}
            onPress={handleDriveThru}
            disabled={arriving}
          >
            {arriving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Car color="#fff" size={24} />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-bold">Avisar Chegada</Text>
                  <Text className="text-indigo-200 text-[10px]">Drive-Thru</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-[#111827] p-5 rounded-2xl flex-row items-center border border-[#1e293b]"
            onPress={() => navigation.navigate('Pickup')}
          >
            <Car color="#6366f1" size={20} />
            <Text className="text-white font-bold ml-2 text-xs">Buscar</Text>
            <ChevronRight size={14} color="#6366f1" />
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <View className="flex-row items-center mb-4">
          <Filter size={14} color="#6b7280" />
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['all' as const, ...ALL_CATEGORIES]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => renderFilterTab(item)}
            contentContainerStyle={{ paddingLeft: 8 }}
          />
        </View>

        {/* Section Title */}
        <Text className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">
          {activeFilter === 'all'
            ? `Últimos Registros (${filteredEvents.length})`
            : `${CATEGORY_CONFIG[activeFilter]?.label} (${filteredEvents.length})`}
        </Text>

        {/* Timeline List */}
        {loading ? (
          <ActivityIndicator color="#4f46e5" size="large" className="mt-10" />
        ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View
                className={`bg-[#111827] rounded-xl p-4 mb-3 flex-row items-center border-l-4 ${getBorderColor(item.type)} shadow-sm`}
              >
                <View className="w-11 h-11 rounded-full bg-[#030712] justify-center items-center mr-4">
                  {getEventIcon(item.type)}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-bold text-sm flex-1">
                      {getEventTitle(item)}
                    </Text>
                    <View
                      className={`px-2 py-0.5 rounded-full ${CATEGORY_CONFIG[item.type]?.bgColor ?? 'bg-gray-500/10'}`}
                    >
                      <Text
                        style={{ color: CATEGORY_CONFIG[item.type]?.color ?? '#94a3b8' }}
                        className="text-[9px] font-bold uppercase"
                      >
                        {CATEGORY_CONFIG[item.type]?.label}
                      </Text>
                    </View>
                  </View>
                  {item.detail && (
                    <Text className="text-gray-300 text-xs mt-1">{item.detail}</Text>
                  )}
                  <View className="flex-row items-center mt-2">
                    <MapPin color="#6b7280" size={10} />
                    <Text className="text-gray-500 text-[10px] ml-1">
                      {new Date(item.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      {' • '}
                      {item.location}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="items-center mt-16">
                <Bell color="#374151" size={48} />
                <Text className="text-gray-600 text-center mt-4 font-bold">
                  Nenhum evento {activeFilter !== 'all' ? `de "${CATEGORY_CONFIG[activeFilter]?.label}"` : ''} registrado hoje.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
