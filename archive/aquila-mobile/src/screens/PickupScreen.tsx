import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, MapPin, CheckCircle, Clock, ArrowLeft, Navigation, XCircle } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { PickupAPI } from '../services/api';
import { LocationService } from '../services/LocationService';

type PickupStatus = 'none' | 'requested' | 'preparing' | 'at_gate' | 'completed';

interface PickupScreenProps {
  navigation: { goBack: () => void; replace: (screen: string) => void };
}

const STATUS_STEPS: { key: PickupStatus; label: string; emoji: string }[] = [
  { key: 'requested', label: 'Solicitado', emoji: '📡' },
  { key: 'preparing', label: 'Preparando Aluno', emoji: '🎒' },
  { key: 'at_gate', label: 'Na Portaria', emoji: '🚪' },
  { key: 'completed', label: 'Concluído', emoji: '✅' },
];

const getStoreItem = async (key: string) => {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
};

export default function PickupScreen({ navigation }: PickupScreenProps) {
  const [status, setStatus] = useState<PickupStatus>('none');
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const schoolConfig = LocationService.getSchoolConfig();

  const fetchStatus = useCallback(async () => {
    try {
      const schoolId = await getStoreItem('school_id');
      const studentHash = await getStoreItem('student_hash');
      if (!schoolId || !studentHash) return;

      const result = await PickupAPI.getPickupStatus(schoolId, studentHash);
      setStatus(result.status);
      if (result.estimatedMinutes) setEstimatedMinutes(result.estimatedMinutes);

      if (result.status === 'completed' && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {
      // silently fail — polling will retry
    }
  }, []);

  const updateDistance = useCallback(async () => {
    const d = await LocationService.getDistanceToSchool();
    setDistance(d);
  }, []);

  useEffect(() => {
    fetchStatus();
    updateDistance();
    LocationService.startPickupGeofencing();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStatus, updateDistance]);

  const handleRequestPickup = async () => {
    setLoading(true);
    try {
      const schoolId = await getStoreItem('school_id');
      const studentHash = await getStoreItem('student_hash');
      if (!schoolId || !studentHash) {
        Alert.alert('Erro', 'Dados de sessão não encontrados. Faça login novamente.');
        return;
      }

      const result = await PickupAPI.requestPickup(schoolId, studentHash);
      if (result.success) {
        setStatus('requested');
        if (result.estimatedMinutes) setEstimatedMinutes(result.estimatedMinutes);

        // Start polling every 5s
        pollRef.current = setInterval(fetchStatus, 5000);

        Alert.alert('Solicitado!', 'A escola foi notificada. Acompanhe o status abaixo.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      Alert.alert('Erro', `Falha ao solicitar busca: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      const schoolId = await getStoreItem('school_id');
      const studentHash = await getStoreItem('student_hash');
      if (schoolId && studentHash) {
        await PickupAPI.cancelPickup(schoolId, studentHash);
      }
      setStatus('none');
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível cancelar.');
    }
  };

  const formatDistance = (meters: number | null): string => {
    if (meters === null) return 'Calculando...';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getStepIndex = (s: PickupStatus): number => {
    return STATUS_STEPS.findIndex((step) => step.key === s);
  };

  const currentStepIndex = getStepIndex(status);

  return (
    <SafeAreaView className="flex-1 bg-[#030712]">
      <View className="px-6 pt-4">
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text className="text-gray-400 font-bold uppercase tracking-[2px] text-[10px]">
              Pickup Seguro
            </Text>
            <Text className="text-2xl font-extrabold text-white">Buscar Aluno</Text>
          </View>
        </View>

        {/* Distance Card */}
        <View className="bg-[#111827] p-5 rounded-3xl border border-[#1e293b] mb-6">
          <View className="flex-row items-center">
            <View className="bg-blue-500/10 w-12 h-12 rounded-xl items-center justify-center mr-4">
              <Navigation size={22} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 text-xs font-bold uppercase">
                Distância até {schoolConfig.pickupPointName}
              </Text>
              <Text className="text-white text-2xl font-bold mt-1">{formatDistance(distance)}</Text>
            </View>
            {estimatedMinutes && (
              <View className="items-center">
                <Clock size={16} color="#94a3b8" />
                <Text className="text-gray-400 text-xs mt-1">~{estimatedMinutes}min</Text>
              </View>
            )}
          </View>
        </View>

        {/* Main Action */}
        {status === 'none' ? (
          <TouchableOpacity
            className={`bg-indigo-600 p-6 rounded-3xl flex-row items-center justify-center shadow-xl shadow-indigo-500/30 mb-8 ${loading ? 'opacity-70' : ''}`}
            onPress={handleRequestPickup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <>
                <Car color="#fff" size={28} />
                <View className="ml-4">
                  <Text className="text-white text-xl font-bold">Estou Chegando</Text>
                  <Text className="text-indigo-200 text-sm">
                    Notificar portaria para preparar o aluno
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        ) : status !== 'completed' ? (
          <TouchableOpacity
            className="bg-red-500/10 p-4 rounded-2xl flex-row items-center justify-center border border-red-500/20 mb-8"
            onPress={handleCancel}
          >
            <XCircle size={20} color="#ef4444" />
            <Text className="text-red-400 font-bold ml-2">Cancelar Solicitação</Text>
          </TouchableOpacity>
        ) : null}

        {/* Status Steps */}
        {status !== 'none' && (
          <View className="bg-[#111827] p-6 rounded-3xl border border-[#1e293b]">
            <Text className="text-white font-bold text-lg mb-6">Acompanhamento</Text>
            {STATUS_STEPS.map((step, i) => {
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              const isPending = i > currentStepIndex;

              return (
                <View key={step.key} className="flex-row items-center mb-5">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                      isDone
                        ? 'bg-emerald-500/20'
                        : isActive
                          ? 'bg-indigo-500/20'
                          : 'bg-gray-800'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle size={20} color="#10b981" />
                    ) : (
                      <Text className="text-lg">{step.emoji}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`font-bold ${
                        isDone
                          ? 'text-emerald-400'
                          : isActive
                            ? 'text-white text-base'
                            : 'text-gray-600'
                      }`}
                    >
                      {step.label}
                    </Text>
                    {isActive && (
                      <Text className="text-indigo-300 text-xs mt-0.5">Em andamento...</Text>
                    )}
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View
                      className={`absolute left-[26px] top-[44px] w-[2px] h-4 ${
                        isDone ? 'bg-emerald-500/30' : 'bg-gray-800'
                      }`}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Completed */}
        {status === 'completed' && (
          <View className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20 mt-6 items-center">
            <CheckCircle size={48} color="#10b981" />
            <Text className="text-emerald-400 text-xl font-bold mt-4">Aluno Entregue!</Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              O processo de busca foi concluído com sucesso.
            </Text>
            <TouchableOpacity
              className="bg-emerald-600 px-8 py-3 rounded-xl mt-6"
              onPress={() => navigation.goBack()}
            >
              <Text className="text-white font-bold">Voltar ao Painel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
