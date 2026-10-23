import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { 
  ShieldCheck, MapPin, CheckCircle2, AlertTriangle, 
  Car, UserCheck, RefreshCw, QrCode, Bell, ShieldAlert
} from 'lucide-react-native';
import { API_CONFIG } from '../services/apiConfig';

interface DismissalQueueItem {
  studentId: string;
  studentName: string;
  studentClass: string;
  parentName: string;
  vehiclePlate: string;
  etaMinutes: number;
  distanceMeters: number;
  status: 'APPROACHING' | 'AT_GATE' | 'RELEASED';
  timestamp: number;
}

export default function PortariaTab() {
  const [queue, setQueue] = useState<DismissalQueueItem[]>([
    {
      studentId: 'stu-9a-02',
      studentName: 'João Gabriel Mendes',
      studentClass: '8º Ano B — Sala 12',
      parentName: 'Mariana Mendes (Mãe)',
      vehiclePlate: 'BRA-2E19',
      etaMinutes: 1,
      distanceMeters: 180,
      status: 'APPROACHING',
      timestamp: Date.now() - 60000,
    },
    {
      studentId: 'stu-9a-01',
      studentName: 'Ana Beatriz Souza',
      studentClass: '8º Ano B — Sala 12',
      parentName: 'Carlos Souza (Pai)',
      vehiclePlate: 'ABC-4412',
      etaMinutes: 0,
      distanceMeters: 25,
      status: 'AT_GATE',
      timestamp: Date.now() - 120000,
    },
  ]);
  const [releasedCount, setReleasedCount] = useState(418);
  const [isConnected, setIsConnected] = useState(false);
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [wsClient, setWsClient] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(API_CONFIG.GATEWAY_WS_URL);

    ws.onopen = () => {
      setIsConnected(true);
      setWsClient(ws);
      ws.send(JSON.stringify({ type: 'GET_GATE_QUEUE' }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'GATE_QUEUE_RESPONSE') {
          if (Array.isArray(payload.data?.queue) && payload.data.queue.length > 0) {
            setQueue(payload.data.queue);
          }
        } else if (payload.type === 'PARENT_ARRIVAL_ALERT') {
          const alertData = payload.data;
          setActiveNotification(alertData.message || 'Novo responsável aproximando da portaria!');
          setTimeout(() => setActiveNotification(null), 6000);

          setQueue((prev) => {
            const exists = prev.find((item) => item.studentId === alertData.studentId);
            if (exists) {
              return prev.map((item) =>
                item.studentId === alertData.studentId
                  ? {
                      ...item,
                      etaMinutes: alertData.etaMinutes,
                      distanceMeters: alertData.distanceMeters || item.distanceMeters,
                      status: alertData.etaMinutes === 0 || alertData.distanceMeters <= 40 ? 'AT_GATE' : 'APPROACHING',
                    }
                  : item
              );
            }
            return [
              {
                studentId: alertData.studentId || `stu-${Date.now()}`,
                studentName: alertData.studentName || 'João Gabriel Mendes',
                studentClass: '8º Ano B — Sala 12',
                parentName: alertData.parentName || 'Responsável',
                vehiclePlate: 'BRA-2E19',
                etaMinutes: alertData.etaMinutes || 2,
                distanceMeters: alertData.distanceMeters || 350,
                status: alertData.etaMinutes === 0 ? 'AT_GATE' : 'APPROACHING',
                timestamp: Date.now(),
              },
              ...prev,
            ];
          });
        }
      } catch (err) {
        console.error('Erro ao processar mensagem do gateway na portaria', err);
      }
    };

    ws.onclose = () => setIsConnected(false);
    return () => ws.close();
  }, []);

  const handleReleaseStudent = (studentId: string, studentName: string) => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(
        JSON.stringify({
          type: 'CONFIRM_GATE_DISMISSAL',
          payload: {
            studentId,
            guardName: 'Agente Silva (Portaria Principal)',
          },
        })
      );
    }

    setQueue((prev) => prev.filter((item) => item.studentId !== studentId));
    setReleasedCount((prev) => prev + 1);
  };

  const handleRefresh = () => {
    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(JSON.stringify({ type: 'GET_GATE_QUEUE' }));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADER TÁTICO */}
      <View style={styles.header}>
        <View>
          <Text style={styles.badge}>SEGURANÇA TÁTICA & DISPATCHER</Text>
          <Text style={styles.title}>Portaria & Saída Segura</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.subtitle}>
              {isConnected ? 'Portão Principal • NPU 100% Online' : 'Modo Offline Seguro'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} activeOpacity={0.8}>
          <RefreshCw color="#00f0ff" size={18} />
        </TouchableOpacity>
      </View>

      {/* BANNER DE ALERTA DE CHEGADA EM TEMPO REAL */}
      {activeNotification && (
        <View style={styles.toastCard}>
          <Car color="#ffffff" size={20} />
          <Text style={styles.toastText}>{activeNotification}</Text>
        </View>
      )}

      {/* STRIP DE KPIS DA PORTARIA */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Aguardando Saída</Text>
          <Text style={[styles.kpiVal, { color: '#f59e0b' }]}>{queue.length}</Text>
          <Text style={styles.kpiSub}>Pais notificados</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Liberados Hoje</Text>
          <Text style={[styles.kpiVal, { color: '#10b981' }]}>{releasedCount}</Text>
          <Text style={styles.kpiSub}>Auditoria 100%</Text>
        </View>
      </View>

      {/* FILA DE LIBERAÇÃO DE ALUNOS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fila de Liberação por Proximidade (GPS/ETA)</Text>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>RADAR ATIVO</Text>
        </View>
      </View>

      {queue.length === 0 ? (
        <View style={styles.emptyCard}>
          <CheckCircle2 color="#10b981" size={36} />
          <Text style={styles.emptyTitle}>Nenhum aluno pendente no portão</Text>
          <Text style={styles.emptySub}>
            Os responsáveis que acionarem "Estou Chegando" aparecerão instantaneamente aqui.
          </Text>
        </View>
      ) : (
        <View style={styles.queueList}>
          {queue.map((item) => (
            <View
              key={item.studentId}
              style={[
                styles.queueCard,
                item.status === 'AT_GATE' ? styles.cardAtGate : styles.cardApproaching,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.studentName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.studentClass}>{item.studentClass}</Text>
                </View>
                <View
                  style={[
                    styles.etaPill,
                    item.status === 'AT_GATE' ? styles.etaPillGreen : styles.etaPillAmber,
                  ]}
                >
                  <Text
                    style={[
                      styles.etaPillText,
                      item.status === 'AT_GATE' ? { color: '#10b981' } : { color: '#f59e0b' },
                    ]}
                  >
                    {item.status === 'AT_GATE' ? 'NA PORTARIA' : `ETA ${item.etaMinutes} min`}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Responsável Autorizado</Text>
                  <Text style={styles.detailVal}>{item.parentName}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Placa Veículo</Text>
                  <Text style={styles.detailValMono}>{item.vehiclePlate}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.releaseBtn}
                onPress={() => handleReleaseStudent(item.studentId, item.studentName)}
                activeOpacity={0.85}
              >
                <UserCheck color="#ffffff" size={18} />
                <Text style={styles.releaseBtnText}>Liberar Saída do Aluno</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* QUICK ACTIONS SEGURANÇA */}
      <Text style={styles.sectionTitle}>Ferramentas Táticas da Borda</Text>
      <View style={styles.toolsGrid}>
        <View style={styles.toolCard}>
          <QrCode color="#8b5cf6" size={24} />
          <Text style={styles.toolTitle}>Validar Crachá Digital</Text>
          <Text style={styles.toolSub}>Leitura de QR Code com token ICP</Text>
        </View>
        <View style={styles.toolCard}>
          <ShieldAlert color="#ef4444" size={24} />
          <Text style={styles.toolTitle}>Alerta Silencioso (Ronda)</Text>
          <Text style={styles.toolSub}>Aciona suporte tático de pátio</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b18',
  },
  content: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00f0ff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#059669',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#0a1020',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  kpiVal: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },
  queueList: {
    gap: 12,
    marginBottom: 24,
  },
  queueCard: {
    backgroundColor: '#0a1020',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  cardAtGate: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  cardApproaching: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  studentClass: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  etaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  etaPillGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  etaPillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  etaPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
    marginTop: 2,
  },
  detailValMono: {
    fontSize: 13,
    color: '#00f0ff',
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  releaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
  },
  releaseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#0a1020',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  toolsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  toolCard: {
    flex: 1,
    backgroundColor: '#0a1020',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  toolTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  toolSub: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
});
