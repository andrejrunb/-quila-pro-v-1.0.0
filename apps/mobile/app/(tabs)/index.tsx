import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Shield, Bell, BookOpen, Activity, ChevronRight, 
  MapPin, Wallet, AlertTriangle, UserCheck, Sparkles, CheckCircle2,
  Flame, Trophy, Brain, Radio, Copy, Check
} from 'lucide-react-native';
import { API_CONFIG } from '../services/apiConfig';

export default function HomeTab() {
  const router = useRouter();
  const [parentData, setParentData] = useState<{ student: any, recentEvents: any[] } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ type: string, message: string } | null>(null);
  const [chegueiActive, setChegueiActive] = useState(false);
  const [distance, setDistance] = useState(1000);
  const [eta, setEta] = useState(4);
  const [wsClient, setWsClient] = useState<WebSocket | null>(null);
  const [dinnerCopied, setDinnerCopied] = useState(false);

  useEffect(() => {
    // Conecta ao Gateway Soberano no host detectado ou LAN IP
    const ws = new WebSocket(API_CONFIG.GATEWAY_WS_URL);

    ws.onopen = () => {
      setIsConnected(true);
      setWsClient(ws);
      ws.send(JSON.stringify({
        type: 'GET_PARENT_DATA',
        deviceId: 'parent-mobile-v2',
        studentId: 'stu-9a-02',
      }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'PARENT_DATA_RESPONSE') {
          setParentData(payload.data);
        } else if (payload.type === 'NEW_ALERT') {
          const alertData = payload.data;
          setActiveAlert({ type: alertData.type || 'alert', message: alertData.message });
          setTimeout(() => setActiveAlert(null), 5000);

          setParentData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              recentEvents: [
                {
                  action: alertData.message,
                  timestamp: alertData.timestamp || Date.now(),
                },
                ...(prev.recentEvents || []),
              ],
            };
          });
        }
        } else if (payload.type === 'GRADE_DISPATCH') {
          const g = payload.payload || {};
          setActiveAlert({
            type: 'success',
            message: `🎓 Nova nota lançada no Diário: ${g.subject || 'Simulado'} — Nota ${Number(g.score || 0).toFixed(1)} / 10.0 (TRI: ${g.triScore || 720} pts)`
          });
          setTimeout(() => setActiveAlert(null), 6000);

          setParentData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              recentEvents: [
                {
                  action: `Nota lançada em ${g.subject || 'Simulado'}: ${Number(g.score || 0).toFixed(1)} (TRI ${g.triScore || 720} pts)`,
                  timestamp: Date.now(),
                },
                ...(prev.recentEvents || []),
              ],
            };
          });
        } else if (payload.type === 'PEDAGOGICAL_PACK_DISPATCH') {
          const p = payload.payload || {};
          setActiveAlert({
            type: 'info',
            message: `📝 Novo Simulado Regional disponibilizado para o aluno: ${p.title || 'Simulado Oficial'}`
          });
          setTimeout(() => setActiveAlert(null), 5000);
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setWsClient(null);
    };

    return () => ws.close();
  }, []);

  const handleCheguei = () => {
    setChegueiActive(true);
    setDistance(1000);
    setEta(4);

    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
      wsClient.send(
        JSON.stringify({
          type: 'PARENT_CHEGUEI',
          studentId: 'stu-9a-02',
          parentName: 'Responsável (App Mobile)',
          etaMinutes: 4,
          distanceMeters: 1000,
        })
      );
    }

    let step = 0;
    const steps = [
      { dist: 750, eta: 3 },
      { dist: 450, eta: 2 },
      { dist: 200, eta: 1 },
      { dist: 30, eta: 0 },
    ];

    const timer = setInterval(() => {
      if (step >= steps.length) {
        clearInterval(timer);
        return;
      }
      const next = steps[step];
      setDistance(next.dist);
      setEta(next.eta);

      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(
          JSON.stringify({
            type: 'PARENT_CHEGUEI',
            studentId: 'stu-9a-02',
            parentName: 'Responsável (App Mobile)',
            etaMinutes: next.eta,
            distanceMeters: next.dist,
          })
        );
      }
      step++;
    }, 3500);
  };

  const studentName = parentData?.student?.name || 'João Gabriel Mendes';
  const studentClass = parentData?.student?.class || '8º Ano B — Turma A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, Família 👋</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.subtitle}>
              {isConnected ? 'LAN Soberana (Porta 9000)' : 'Modo Offline Seguro'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.8}>
          <Bell color="#8b5cf6" size={20} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      {/* STUDENT PROFILE CARD */}
      <View style={styles.studentCard}>
        <View style={styles.studentAvatar}>
          <Text style={styles.studentAvatarText}>{studentName.charAt(0)}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentNameText}>{studentName}</Text>
          <Text style={styles.studentMetaText}>{studentClass}</Text>
        </View>
        <View style={styles.presencePill}>
          <View style={styles.presencePillDot} />
          <Text style={styles.presencePillText}>Na Escola</Text>
        </View>
      </View>

      {/* STATUS DE SEGURANÇA */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Shield color="#10b981" size={20} />
          <Text style={styles.statusTitle}>Monitoramento Soberano Ativo</Text>
        </View>
        <Text style={styles.statusDesc}>
          {parentData?.recentEvents?.[0]
            ? `Último registro às ${new Date(parentData.recentEvents[0].timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}: ${parentData.recentEvents[0].action || 'Entrada registrada com sucesso'}.`
            : 'Entrada biométrica autorizada às 07:18 via NPU Edge.'}
        </Text>
      </View>

      {/* REAL-TIME ALERT TOAST */}
      {activeAlert && (
        <View style={[styles.toast, activeAlert.type === 'alert' ? styles.toastAlert : styles.toastEvent]}>
          <Bell color="#fff" size={18} />
          <Text style={styles.toastText}>{activeAlert.message}</Text>
        </View>
      )}

      {/* GEOFENCING "ESTOU CHEGANDO" */}
      <View style={styles.geofenceContainer}>
        {chegueiActive ? (
          <View style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <MapPin color="#10b981" size={22} />
              <View style={{ flex: 1 }}>
                <Text style={styles.trackingTitle}>
                  {distance <= 40 ? 'Aluno em Liberação na Portaria!' : 'Navegação GPS Ativa'}
                </Text>
                <Text style={styles.trackingSub}>
                  {distance <= 40
                    ? `${studentName.split(' ')[0]} chamado para o portão principal`
                    : `Aproximando do colégio • ETA ${eta} min`}
                </Text>
              </View>
            </View>

            <View style={styles.trackBar}>
              <View
                style={[
                  styles.trackFill,
                  { width: `${Math.max(10, 100 - (distance / 1000) * 100)}%` },
                ]}
              />
            </View>

            <View style={styles.trackMetrics}>
              <View>
                <Text style={styles.metricLabel}>Distância</Text>
                <Text style={styles.metricVal}>{distance}m</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metricLabel}>Status Portaria</Text>
                <Text style={[styles.metricVal, { color: distance <= 40 ? '#10b981' : '#f59e0b' }]}>
                  {distance <= 40 ? 'NA PORTARIA' : 'APROXIMANDO'}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.chegueiButton} onPress={handleCheguei} activeOpacity={0.85}>
            <MapPin color="#ffffff" size={24} />
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.chegueiButtonText}>ESTOU CHEGANDO</Text>
              <Text style={styles.chegueiButtonSub}>
                Notificar portaria para adiantar a saída do aluno
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* RADAR NEURO-PEDAGÓGICO & EBBINGHAUS (PAIS) */}
      <View style={styles.neuroSection}>
        <View style={styles.neuroHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Flame color="#f97316" size={20} />
            <Text style={styles.neuroSectionTitle}>Radar Neuro-Pedagógico & Retenção</Text>
          </View>
          <View style={styles.neuroActiveBadge}>
            <Text style={styles.neuroActiveBadgeText}>12 DIAS 🔥</Text>
          </View>
        </View>

        {/* 4 KPIS */}
        <View style={styles.neuroKpiGrid}>
          <View style={styles.neuroKpiCard}>
            <Text style={styles.neuroKpiLabel}>RETENÇÃO ESTIMADA</Text>
            <Text style={[styles.neuroKpiVal, { color: '#10b981' }]}>92.4%</Text>
            <Text style={styles.neuroKpiSub}>Curva de Ebbinghaus</Text>
          </View>

          <View style={styles.neuroKpiCard}>
            <Text style={styles.neuroKpiLabel}>PODCASTS OUVIDOS</Text>
            <Text style={[styles.neuroKpiVal, { color: '#8b5cf6' }]}>4 Eps</Text>
            <Text style={styles.neuroKpiSub}>Sofia & Lucas</Text>
          </View>

          <View style={styles.neuroKpiCard}>
            <Text style={styles.neuroKpiLabel}>MAESTRIA REGIONAL</Text>
            <Text style={[styles.neuroKpiVal, { color: '#38bdf8' }]}>850 XP</Text>
            <Text style={styles.neuroKpiSub}>PAS / ENEM / UFG</Text>
          </View>

          <View style={styles.neuroKpiCard}>
            <Text style={styles.neuroKpiLabel}>CICLO ATIVO</Text>
            <Text style={[styles.neuroKpiVal, { color: '#f59e0b' }]}>D+4 Hoje</Text>
            <Text style={styles.neuroKpiSub}>Desafio Wordwall</Text>
          </View>
        </View>

        {/* PERGUNTA DE OURO PARA O JANTAR EM FAMÍLIA */}
        <View style={styles.dinnerCard}>
          <View style={styles.dinnerTagRow}>
            <Sparkles color="#f59e0b" size={14} />
            <Text style={styles.dinnerTagText}>PERGUNTA DE OURO PARA O JANTAR EM FAMÍLIA</Text>
          </View>

          <Text style={styles.dinnerQuestion}>
            "Filho, me explica: quando você esfrega um balão no casaco de lã e encosta ele na parede, por que ele gruda se a parede é neutra?"
          </Text>

          <Text style={styles.dinnerExplanation}>
            💡 <Text style={{ fontWeight: '700' }}>Dica Pedagógica:</Text> O balão polariza a parede neutra. Deixar o aluno explicar com as próprias palavras fixa até 90% da memória (Pirâmide de Glasser).
          </Text>

          <TouchableOpacity
            style={[styles.dinnerCopyBtn, dinnerCopied && styles.dinnerCopyBtnSuccess]}
            activeOpacity={0.8}
            onPress={() => {
              setDinnerCopied(true);
              setTimeout(() => setDinnerCopied(false), 3000);
            }}
          >
            {dinnerCopied ? <Check color="#10b981" size={14} /> : <Copy color="#f59e0b" size={14} />}
            <Text style={[styles.dinnerCopyBtnText, dinnerCopied && { color: '#10b981' }]}>
              {dinnerCopied ? 'Copiado para o WhatsApp!' : 'Copiar Pergunta para o WhatsApp'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ACESSO RÁPIDO AOS MÓDULOS */}
      <Text style={styles.sectionTitle}>Módulos Soberanos</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/boletim')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <BookOpen color="#3b82f6" size={22} />
          </View>
          <Text style={styles.actionTitle}>Boletim</Text>
          <Text style={styles.actionSub}>Notas & TRI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/financeiro')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Wallet color="#10b981" size={22} />
          </View>
          <Text style={styles.actionTitle}>Financeiro</Text>
          <Text style={styles.actionSub}>PIX & Faturas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/ocorrencias')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <AlertTriangle color="#ef4444" size={22} />
          </View>
          <Text style={styles.actionTitle}>Ocorrências</Text>
          <Text style={styles.actionSub}>Assinatura Digital</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/chamada')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <UserCheck color="#f59e0b" size={22} />
          </View>
          <Text style={styles.actionTitle}>Chamada</Text>
          <Text style={styles.actionSub}>1-Toque Docente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/portaria')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBox, { backgroundColor: 'rgba(0, 240, 255, 0.15)' }]}>
            <Shield color="#00f0ff" size={22} />
          </View>
          <Text style={styles.actionTitle}>Portaria</Text>
          <Text style={styles.actionSub}>Ronda & Liberação</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { width: '100%' }]}
          onPress={() => router.push('/student')}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Sparkles color="#8b5cf6" size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Albus IA — Laboratório de Estudos</Text>
              <Text style={styles.actionSub}>Tutor socrático particular com memória pedagógica</Text>
            </View>
            <ChevronRight color="#64748b" size={18} />
          </View>
        </TouchableOpacity>
      </View>

      {/* FEED DE EVENTOS RECENTES */}
      <Text style={styles.sectionTitle}>Últimas Atualizações</Text>
      <View style={styles.feed}>
        {parentData?.recentEvents && parentData.recentEvents.length > 0 ? (
          parentData.recentEvents.map((ev, index) => (
            <View key={index} style={styles.feedItem}>
              <View style={styles.feedIconBox}>
                <Activity color="#8b5cf6" size={16} />
              </View>
              <View style={styles.feedContent}>
                <Text style={styles.feedTitle}>{ev.action}</Text>
                <Text style={styles.feedTime}>
                  {new Date(ev.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <ChevronRight color="#64748b" size={16} />
            </View>
          ))
        ) : (
          <View style={styles.feedItem}>
            <View style={styles.feedIconBox}>
              <CheckCircle2 color="#10b981" size={16} />
            </View>
            <View style={styles.feedContent}>
              <Text style={styles.feedTitle}>Entrada no Colégio Registrada</Text>
              <Text style={styles.feedTime}>Hoje, 07:18 • Catraca Principal</Text>
            </View>
            <ChevronRight color="#64748b" size={16} />
          </View>
        )}
      </View>

      {/* FOOTER LGPD & LDB */}
      <View style={styles.footerNote}>
        <Shield color="#64748b" size={14} />
        <Text style={styles.footerText}>
          Áquila Pro Mobile v2.1 • LDB Art. 12 VII • 100% Offline Soberano
        </Text>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
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
    fontWeight: '500',
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 18,
    padding: 16,
    gap: 14,
    marginBottom: 16,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  studentInfo: {
    flex: 1,
  },
  studentNameText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  studentMetaText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  presencePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  presencePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  presencePillText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusTitle: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 14,
  },
  statusDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    gap: 10,
  },
  toastAlert: {
    backgroundColor: '#dc2626',
  },
  toastEvent: {
    backgroundColor: '#2563eb',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  geofenceContainer: {
    marginBottom: 24,
  },
  chegueiButton: {
    backgroundColor: '#059669',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  chegueiButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chegueiButtonSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  trackingCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 18,
    padding: 16,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  trackingTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  trackingSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  trackBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  trackMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  metricVal: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#0a1020',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  actionSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  feed: {
    gap: 10,
    marginBottom: 24,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a1020',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  feedIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedContent: {
    flex: 1,
  },
  feedTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  feedTime: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  footerText: {
    color: '#64748b',
    fontSize: 11,
  },
  neuroSection: {
    marginBottom: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    borderRadius: 16,
    padding: 16,
  },
  neuroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  neuroSectionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  neuroActiveBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  neuroActiveBadgeText: {
    color: '#f97316',
    fontSize: 10,
    fontWeight: '800',
  },
  neuroKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  neuroKpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 10,
  },
  neuroKpiLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
  },
  neuroKpiVal: {
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2,
  },
  neuroKpiSub: {
    color: '#94a3b8',
    fontSize: 10,
  },
  dinnerCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  dinnerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dinnerTagText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dinnerQuestion: {
    color: '#fffbeb',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  dinnerExplanation: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 16,
  },
  dinnerCopyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  dinnerCopyBtnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  dinnerCopyBtnText: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '700',
  },
});
