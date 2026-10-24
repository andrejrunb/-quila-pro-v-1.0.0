import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Sparkles, Send, Brain, BookOpen, CheckCircle2, Lightbulb,
  Zap, Flame, Trophy, Radio, RotateCcw, HelpCircle, XCircle
} from 'lucide-react-native';
import { API_CONFIG } from '../services/apiConfig';

interface StudyMessage {
  id: string;
  sender: 'student' | 'albus';
  text: string;
  timestamp: number;
}

interface KumonMobileDrill {
  id: string;
  level: string;
  question: string;
  ans: string;
  hint: string;
}

const DAILY_KUMON_DRILLS: KumonMobileDrill[] = [
  {
    id: 'kd-1',
    level: 'NÍVEL L1 • AUTOMATICIDADE',
    question: 'Multiplique potências de 10: 10^(-11) · 10^(24) =',
    ans: '10^13',
    hint: 'Some os expoentes: (-11) + 24 = 13',
  },
  {
    id: 'kd-2',
    level: 'NÍVEL L1 • CONVERSÃO RÁPIDA',
    question: 'Converta 15 minutos em fração decimal de hora (15/60):',
    ans: '0.25',
    hint: '15 dividido por 60 é 1/4 = 0,25',
  },
  {
    id: 'kd-3',
    level: 'NÍVEL L2 • PROPORÇÃO ALGÉBRICA',
    question: 'Em F = G·M·m / d², se d duplica (2x), a força é dividida por:',
    ans: '4',
    hint: 'A distância está ao quadrado no denominador: (2)^2 = 4',
  },
];

export default function StudentLabTab() {
  const [activeMode, setActiveMode] = useState<'chat' | 'kumon' | 'podcast'>('chat');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<StudyMessage[]>([
    {
      id: 'm1',
      sender: 'albus',
      text: 'Olá! Sou o Albus, seu tutor socrático particular. Não darei apenas respostas prontas, mas guiarei seu raciocínio passo a passo. Qual disciplina ou dúvida vamos explorar hoje?',
      timestamp: Date.now() - 60000,
    },
  ]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Estados Kumon Diário
  const [drillAnswers, setDrillAnswers] = useState<Record<string, string>>({});
  const [drillStatus, setDrillStatus] = useState<Record<string, 'correct' | 'incorrect'>>({});
  const [streakDays, setStreakDays] = useState(4);
  const [earnedXp, setEarnedXp] = useState(75);

  const quickPrompts = [
    '📐 Teorema de Pitágoras no cotidiano',
    '🧬 Diferença entre Meiose e Mitose',
    '⚡ Leis de Newton e aceleração',
    '✍️ Tese para redação nota 1000',
  ];

  useEffect(() => {
    const socket = new WebSocket(API_CONFIG.GATEWAY_WS_URL);

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'AUTH_PAIRING',
          deviceId: 'student-device-123',
          studentId: 'stu-9a-02',
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'STUDY_RESPONSE') {
          setLoading(false);
          const responseText =
            payload.data?.content ||
            payload.data?.answer ||
            'Excelente reflexão! Como você relacionaria isso com o que estudamos na última aula?';
          setMessages((prev) => [
            ...prev,
            {
              id: `albus-${Date.now()}`,
              sender: 'albus',
              text: responseText,
              timestamp: Date.now(),
            },
          ]);
        }
        if (payload.type === 'PEDAGOGICAL_PACK_DISPATCH') {
          const pack = payload.payload || {};
          setMessages((prev) => [
            ...prev,
            {
              id: `pack-${Date.now()}`,
              sender: 'albus',
              text: `📢 NOVO MATERIAL ENVIADO PELO PROFESSOR!

📌 ${pack.discipline || 'Estudos'}: ${pack.topic || 'Revisão'}
💡 "${pack.everydayHook || ''}"

🎙️ O Podcast com Sofia & Lucas e os desafios de retenção já estão sincronizados no seu app!`,
              timestamp: Date.now(),
            },
          ]);
        }
      } catch (err) {
        console.error('Erro no parser do Albus IA', err);
        setLoading(false);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || topic;
    if (!query.trim() || loading) return;

    const userMsg: StudyMessage = {
      id: `user-${Date.now()}`,
      sender: 'student',
      text: query.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setTopic('');
    setLoading(true);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'STUDY_QUERY',
          deviceId: 'student-device-123',
          payload: { topic: query.trim() },
        })
      );
    } else {
      fetch(`${API_CONFIG.COLAB_GPU_URL}/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query.trim(), student_level: 'Ensino Médio', subject: 'Geral' }),
      })
        .then((res) => res.json())
        .then((data) => {
          setLoading(false);
          const reply = data.response || data.text || 'Excelente reflexão! Como você avançaria agora?';
          setMessages((prev) => [
            ...prev,
            {
              id: `albus-${Date.now()}`,
              sender: 'albus',
              text: reply,
              timestamp: Date.now(),
            },
          ]);
        })
        .catch(() => {
          setLoading(false);
          setMessages((prev) => [
            ...prev,
            {
              id: `albus-${Date.now()}`,
              sender: 'albus',
              text: `[Modo Offline Socrático] Pensando sobre "${query.trim()}": o que você já sabe sobre a base desse conceito? Tente dividir o problema em duas partes fundamentais antes de tentar calcular ou concluir.`,
              timestamp: Date.now(),
            },
          ]);
        });
    }
  };

  const checkDrill = (drill: KumonMobileDrill) => {
    const user = (drillAnswers[drill.id] || '').trim().toLowerCase().replace(',', '.');
    const target = drill.ans.toLowerCase();
    const isOk = user === target || user === target.replace('.', ',');

    setDrillStatus((prev) => ({ ...prev, [drill.id]: isOk ? 'correct' : 'incorrect' }));
    if (isOk && drillStatus[drill.id] !== 'correct') {
      setEarnedXp((prev) => prev + 25);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Sparkles color="#8b5cf6" size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Áquila Lab — Aluno Soberano</Text>
            <Text style={styles.subtitle}>Tutor Socrático • Micro-Drills • Podcasts</Text>
          </View>
        </View>

        {/* MODE SELECTOR */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeBtn, activeMode === 'chat' && styles.modeBtnActive]}
            onPress={() => setActiveMode('chat')}
          >
            <Brain color={activeMode === 'chat' ? '#38bdf8' : '#94a3b8'} size={14} />
            <Text style={[styles.modeText, activeMode === 'chat' && styles.modeTextActive]}>Tutor Albus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, activeMode === 'kumon' && styles.modeBtnActive]}
            onPress={() => setActiveMode('kumon')}
          >
            <Zap color={activeMode === 'kumon' ? '#38bdf8' : '#94a3b8'} size={14} />
            <Text style={[styles.modeText, activeMode === 'kumon' && styles.modeTextActive]}>Kumon (3 min)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, activeMode === 'podcast' && styles.modeBtnActive]}
            onPress={() => setActiveMode('podcast')}
          >
            <Radio color={activeMode === 'podcast' ? '#38bdf8' : '#94a3b8'} size={14} />
            <Text style={[styles.modeText, activeMode === 'podcast' && styles.modeTextActive]}>Podcast</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODO 1: CHAT SOCRÁTICO */}
      {activeMode === 'chat' && (
        <>
          <View style={styles.quickBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
              {quickPrompts.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickPill}
                  onPress={() => handleSend(q)}
                  activeOpacity={0.7}
                >
                  <Lightbulb color="#a78bfa" size={14} />
                  <Text style={styles.quickPillText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.messageWrapper,
                  m.sender === 'student' ? styles.studentWrapper : styles.albusWrapper,
                ]}
              >
                {m.sender === 'albus' && (
                  <View style={styles.albusBadge}>
                    <Brain color="#8b5cf6" size={14} />
                    <Text style={styles.albusBadgeText}>Albus Socrático</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    m.sender === 'student' ? styles.studentBubble : styles.albusBubble,
                  ]}
                >
                  <Text style={styles.bubbleText}>{m.text}</Text>
                </View>
                <Text style={styles.messageTime}>
                  {new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ))}

            {loading && (
              <View style={[styles.messageWrapper, styles.albusWrapper]}>
                <View style={[styles.bubble, styles.albusBubble, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                  <ActivityIndicator color="#8b5cf6" size="small" />
                  <Text style={[styles.bubbleText, { color: '#94a3b8' }]}>Elaborando pergunta socrática...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite sua dúvida ou hipótese..."
              placeholderTextColor="#64748b"
              value={topic}
              onChangeText={setTopic}
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()} disabled={loading}>
              <Send color="#ffffff" size={18} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* MODO 2: MICRO-DRILLS KUMON */}
      {activeMode === 'kumon' && (
        <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 16 }}>
          {/* STREAK CARD */}
          <View style={styles.streakCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Flame color="#f59e0b" size={26} />
              <View>
                <Text style={styles.streakTitle}>{streakDays} Dias Consecutivos!</Text>
                <Text style={styles.streakSubtitle}>Protocolo Quinta-a-Quinta (Curva de Ebbinghaus Vencida)</Text>
              </View>
            </View>
            <View style={styles.xpBadge}>
              <Trophy color="#38bdf8" size={14} />
              <Text style={styles.xpText}>{earnedXp} XP</Text>
            </View>
          </View>

          {/* DRILLS LIST */}
          <Text style={styles.sectionHeader}>DESAFIO DE HOJE (3 MINUTOS)</Text>
          {DAILY_KUMON_DRILLS.map((d) => (
            <View key={d.id} style={styles.drillCard}>
              <Text style={styles.drillLevel}>{d.level}</Text>
              <Text style={styles.drillQuestion}>{d.question}</Text>

              <View style={styles.drillActionRow}>
                <TextInput
                  style={styles.drillInput}
                  placeholder="Resposta..."
                  placeholderTextColor="#64748b"
                  value={drillAnswers[d.id] || ''}
                  onChangeText={(val) => setDrillAnswers((prev) => ({ ...prev, [d.id]: val }))}
                />
                <TouchableOpacity style={styles.drillCheckBtn} onPress={() => checkDrill(d)}>
                  <Text style={styles.drillCheckBtnText}>OK</Text>
                </TouchableOpacity>

                {drillStatus[d.id] === 'correct' && (
                  <View style={styles.correctPill}>
                    <CheckCircle2 color="#34d399" size={14} />
                    <Text style={styles.correctPillText}>Correto!</Text>
                  </View>
                )}
                {drillStatus[d.id] === 'incorrect' && (
                  <View style={styles.incorrectPill}>
                    <XCircle color="#f87171" size={14} />
                    <Text style={styles.incorrectPillText}>Tente de novo</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODO 3: PODCAST NOTEBOOKLM */}
      {activeMode === 'podcast' && (
        <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 16 }}>
          <View style={styles.podcastMobileCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Radio color="#c084fc" size={28} />
              <View style={{ flex: 1 }}>
                <Text style={styles.podcastMobileTitle}>Deep Dive: Eletrodinâmica no Chuveiro</Text>
                <Text style={styles.podcastMobileSub}>Apresentadores: Sofia & Lucas • Áudio de 4 min</Text>
              </View>
            </View>

            <View style={styles.dialogueBox}>
              <Text style={styles.speakerSofia}>🎙️ Sofia:</Text>
              <Text style={styles.dialogueText}>"Lucas, por que todo mundo morre de medo de mudar a chave do chuveiro com o corpo molhado? É paranoia de mãe?"</Text>

              <Text style={[styles.speakerLucas, { marginTop: 12 }]}>🔬 Lucas:</Text>
              <Text style={styles.dialogueText}>"Sofia, sua mãe tá coberta de razão! Pele seca tem 100 mil ohms. Molhada com sabão cai para menos de 1000 ohms. A corrente elétrica dispara e é ela quem causa o choque!"</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#070f24',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  title: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeBtnActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  modeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  quickBar: {
    paddingVertical: 10,
    backgroundColor: '#050c1e',
  },
  quickScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  quickPillText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 14,
  },
  messageWrapper: {
    maxWidth: '85%',
  },
  studentWrapper: {
    alignSelf: 'flex-end',
  },
  albusWrapper: {
    alignSelf: 'flex-start',
  },
  albusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
    marginLeft: 4,
  },
  albusBadgeText: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '700',
  },
  bubble: {
    padding: 14,
    borderRadius: 18,
  },
  studentBubble: {
    backgroundColor: '#7c3aed',
    borderBottomRightRadius: 4,
  },
  albusBubble: {
    backgroundColor: '#0d1830',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 21,
  },
  messageTime: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#070f24',
  },
  input: {
    flex: 1,
    backgroundColor: '#0d1830',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  streakSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  xpText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  drillCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  drillLevel: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  drillQuestion: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  drillActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drillInput: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
  },
  drillCheckBtn: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  drillCheckBtnText: {
    color: '#0f172a',
    fontWeight: '800',
    fontSize: 12,
  },
  correctPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  correctPillText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  incorrectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  incorrectPillText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
  },
  podcastMobileCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 14,
    padding: 16,
  },
  podcastMobileTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  podcastMobileSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  dialogueBox: {
    marginTop: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 12,
  },
  speakerSofia: {
    color: '#f472b6',
    fontWeight: '800',
    fontSize: 11,
  },
  speakerLucas: {
    color: '#38bdf8',
    fontWeight: '800',
    fontSize: 11,
  },
  dialogueText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
});
