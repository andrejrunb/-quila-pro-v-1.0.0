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
  Zap, Flame, Trophy, Radio, RotateCcw, HelpCircle, XCircle, Box, FileText
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

interface MobileWordwallBox {
  id: number;
  term: string;
  badge: string;
  challenge: string;
  answer: string;
  hint: string;
}

const MOBILE_WORDWALL_BOXES: MobileWordwallBox[] = [
  { id: 1, term: '⚡ Lei de Ohm', badge: 'Física', challenge: 'Na equação U = R · i, para U = 220 V e R = 11 Ω, qual a corrente i (em A)?', answer: '20', hint: 'i = 220 / 11' },
  { id: 2, term: '🍎 1ª Lei de Newton', badge: 'Mecânica', challenge: 'A inércia de um corpo depende exclusivamente de qual grandeza física fundamental?', answer: 'massa', hint: 'Quanto mais pesado o corpo, mais difícil acelerá-lo.' },
  { id: 3, term: '🧪 Lei de Proust', badge: 'Química', challenge: 'Se 2g de H₂ reagem com 16g de O₂ formando 18g de água, 4g de H₂ formam quantos gramas de água?', answer: '36', hint: 'Dobre a proporção fixa (18 x 2).' },
  { id: 4, term: '🌊 Onda Sonora', badge: 'Ondulatória', challenge: 'Em v = λ · f, com v = 340 m/s e f = 170 Hz, qual o comprimento de onda em metros?', answer: '2', hint: 'λ = 340 / 170' }
];

const DEFAULT_MOBILE_EXAM_ITEMS = [
  {
    id: 1,
    exam: 'ENEM 2023',
    subject: 'Física',
    topic: 'Eletrodinâmica & Consumo',
    statement: 'Um chuveiro elétrico de 4.400 W opera em 220 V por 15 min diários. A corrente exigida e o consumo mensal (30 dias) são:',
    alternatives: {
      A: '10 A e 16,5 kWh',
      B: '20 A e 33,0 kWh',
      C: '20 A e 22,0 kWh',
      D: '22 A e 33,0 kWh',
      E: '44 A e 66,0 kWh'
    },
    correct: 'B',
    explanation: 'i = P / U = 4400 / 220 = 20 A. Tempo mensal: 0,25 h × 30 = 7,5 h. Energia: 4,4 kW × 7,5 h = 33 kWh.'
  },
  {
    id: 2,
    exam: 'UnB / PAS 2024',
    subject: 'Física',
    topic: 'Ondulatória & Telecomunicações',
    statement: 'Sinal de 1,5 GHz (1,5 × 10⁹ Hz) viaja no vácuo a c = 3,0 × 10⁸ m/s. O comprimento de onda λ é:',
    alternatives: {
      A: '5 cm',
      B: '20 cm (0,20 m)',
      C: '50 cm',
      D: '2,0 m',
      E: '5,0 m'
    },
    correct: 'B',
    explanation: 'λ = c / f = 3,0 × 10⁸ / 1,5 × 10⁹ = 0,20 m = 20 cm.'
  },
  {
    id: 3,
    exam: 'UFG 2021',
    subject: 'Física',
    topic: 'Calorimetria & Cerrado',
    statement: 'Aquecem-se 50 kg de água (c = 4200 J/kg°C) de 20 °C a 60 °C em 1000 s. O calor absorvido em MJ e a potência em kW são:',
    alternatives: {
      A: '4,2 MJ e 4,2 kW',
      B: '8,4 MJ e 8,4 kW',
      C: '8,4 MJ e 4,2 kW',
      D: '12,6 MJ e 12,6 kW',
      E: '16,8 MJ e 8,4 kW'
    },
    correct: 'B',
    explanation: 'Q = 50 × 4200 × 40 = 8.400.000 J = 8,4 MJ. Potência P = 8.400.000 / 1000 = 8,4 kW.'
  },
  {
    id: 4,
    exam: 'UniRV 2024',
    subject: 'Medicina',
    topic: 'Óptica & Dioptrias',
    statement: 'Uma lente convergente para hipermetropia tem vergência V = +2,5 dioptrias. Sua distância focal é:',
    alternatives: {
      A: '20 cm',
      B: '25 cm',
      C: '40 cm',
      D: '50 cm',
      E: '80 cm'
    },
    correct: 'C',
    explanation: 'f = 1 / V = 1 / 2,5 = 0,40 m = 40 cm.'
  }
];

export default function StudentLabTab() {
  const [activeMode, setActiveMode] = useState<'chat' | 'kumon' | 'podcast' | 'wordwall' | 'simulado'>('chat');
  const [dispatchedSimulado, setDispatchedSimulado] = useState<any>(null);
  const [simuladoAnswers, setSimuladoAnswers] = useState<Record<number, string>>({});
  const [simuladoSubmitted, setSimuladoSubmitted] = useState(false);
  const [simuladoScore, setSimuladoScore] = useState<{ correct: number; total: number; xp: number } | null>(null);
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
  const [openedBoxes, setOpenedBoxes] = useState<Record<number, boolean>>({});
  const [wordwallAnswers, setWordwallAnswers] = useState<Record<number, string>>({});
  const [wordwallStatus, setWordwallStatus] = useState<Record<number, 'correct' | 'incorrect'>>({});

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
          if (Array.isArray(pack.items) && pack.items.length > 0) {
            setDispatchedSimulado(pack);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: `pack-${Date.now()}`,
              sender: 'albus',
              text: `📢 SIMULADO / MATERIAL ENVIADO PELO PROFESSOR!

📌 ${pack.school || 'Colégio Áquila Pro'}
📝 ${pack.title || pack.topic || 'Simulado Oficial Regional'}
💡 "${pack.everydayHook || 'Toque na aba Simulado para testar seus conhecimentos!'}"

🎙️ Podcast com Sofia & Lucas e Prova Digital já sincronizados!`,
              timestamp: Date.now(),
            },
          ]);
        }

        if (payload.type === 'GRADE_DISPATCH') {
          const g = payload.payload || {};
          setXp((prev) => prev + 100);
          setMessages((prev) => [
            ...prev,
            {
              id: `grade-${Date.now()}`,
              sender: 'albus',
              text: `🎉 NOTA OFICIAL DE SIMULADO LANÇADA NO DIÁRIO!

📚 Disciplina: ${g.subject || 'Simulado Regional TRI'}
🎯 Sua Nota: ${Number(g.score || 0).toFixed(1)} / 10.0
⚡ Escala TRI: ${g.triScore || 720} pts (ENEM/PAS)
📈 Precisão: ${g.accuracyPct || 85}%

Parabéns pelo empenho! Você recebeu +100 XP na Trilha de Maestria!`,
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

          <TouchableOpacity
            style={[styles.modeBtn, activeMode === 'wordwall' && styles.modeBtnActive]}
            onPress={() => setActiveMode('wordwall')}
          >
            <Box color={activeMode === 'wordwall' ? '#38bdf8' : '#94a3b8'} size={14} />
            <Text style={[styles.modeText, activeMode === 'wordwall' && styles.modeTextActive]}>Wordwall</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, activeMode === 'simulado' && styles.modeBtnActive]}
            onPress={() => setActiveMode('simulado')}
          >
            <FileText color={activeMode === 'simulado' ? '#38bdf8' : '#94a3b8'} size={14} />
            <Text style={[styles.modeText, activeMode === 'simulado' && styles.modeTextActive]}>Simulado</Text>
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

      {/* MODO 3: PODCAST NOTEBOOKLM EXPANDIDO */}
      {activeMode === 'podcast' && (
        <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 16 }}>
          <View style={styles.podcastMobileCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Radio color="#c084fc" size={28} />
              <View style={{ flex: 1 }}>
                <Text style={styles.podcastMobileTitle}>Deep Dive: Eletrodinâmica no Chuveiro</Text>
                <Text style={styles.podcastMobileSub}>Apresentadores: Sofia & Lucas • Áudio Completo</Text>
              </View>
            </View>

            <View style={styles.dialogueBox}>
              <Text style={styles.speakerSofia}>🎙️ Sofia (00:04):</Text>
              <Text style={styles.dialogueText}>"Lucas, por que todo mundo morre de medo de mudar a chave do chuveiro com o corpo molhado? É paranoia de mãe ou a física realmente explica isso?"</Text>

              <Text style={[styles.speakerLucas, { marginTop: 14 }]}>🔬 Lucas (00:15):</Text>
              <Text style={styles.dialogueText}>"Sofia, sua mãe tá coberta de razão! Quando nossa pele tá seca, ela tem uma resistência altíssima de quase 100 mil ohms. Mas quando você tá molhado e com sabão, essa resistência despenca para menos de 1000 ohms. E pela Primeira Lei de Ohm, se a resistência cai, a corrente elétrica que atravessa seu corpo dispara!"</Text>

              <Text style={[styles.speakerSofia, { marginTop: 14 }]}>🎙️ Sofia (00:32):</Text>
              <Text style={styles.dialogueText}>"E o que realmente machuca a gente? É a voltagem de 220 volts ou é a corrente elétrica?"</Text>

              <Text style={[styles.speakerLucas, { marginTop: 14 }]}>🔬 Lucas (00:44):</Text>
              <Text style={styles.dialogueText}>"É a corrente! A voltagem é só o empurrão do elétron. Mas são os elétrons passando — a corrente em ampères — que causam fibrilação ventricular. Uma corrente de apenas 50 miliampères já pode ser fatal! É por isso que o fio terra é obrigatório por lei!"</Text>

              <Text style={[styles.speakerSofia, { marginTop: 14 }]}>🎙️ Sofia (01:02):</Text>
              <Text style={styles.dialogueText}>"Caramba! E quando cai o disjuntor da casa inteira porque ligaram a fritadeira e o chuveiro ao mesmo tempo?"</Text>

              <Text style={[styles.speakerLucas, { marginTop: 14 }]}>🔬 Lucas (01:14):</Text>
              <Text style={styles.dialogueText}>"Aí é pura associação em paralelo! Tudo na casa recebe 220V, mas cada aparelho puxa mais corrente. Quando a soma passa do limite do fio, o disjuntor desarma termicamente para não incendiar a fiação!"</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* MODO 4: WORDWALL GAMIFICAÇÃO (ABRA A CAIXA) */}
      {activeMode === 'wordwall' && (
        <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 16 }}>
          <View style={styles.wordwallHeaderCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Box color="#34d399" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={styles.wordwallTitle}>Wordwall: Abra a Caixa (30s)</Text>
                <Text style={styles.wordwallSub}>Toque em uma caixa para destrancar o desafio (+30 XP)</Text>
              </View>
            </View>
          </View>

          <View style={styles.wordwallGrid}>
            {MOBILE_WORDWALL_BOXES.map((b) => {
              const isOpen = openedBoxes[b.id];
              const st = wordwallStatus[b.id];
              return (
                <View key={b.id} style={[styles.wordwallBoxCard, isOpen && styles.wordwallBoxCardOpen]}>
                  <TouchableOpacity
                    style={styles.boxHeaderRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!isOpen) {
                        setOpenedBoxes((prev) => ({ ...prev, [b.id]: true }));
                        setEarnedXp((prev) => prev + 30);
                      }
                    }}
                  >
                    <View style={styles.boxNumBadge}>
                      <Text style={styles.boxNumText}>CAIXA {b.id}</Text>
                    </View>
                    <Text style={styles.boxTermText}>{isOpen ? b.term : '❓ Destrancar Caixa'}</Text>
                    <Text style={styles.boxBadgeText}>{b.badge}</Text>
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.boxBody}>
                      <Text style={styles.boxChallengeText}>{b.challenge}</Text>
                      <View style={styles.boxActionRow}>
                        <TextInput
                          style={styles.boxInput}
                          placeholder="Digite a resposta..."
                          placeholderTextColor="#64748b"
                          value={wordwallAnswers[b.id] || ''}
                          onChangeText={(val) => setWordwallAnswers((prev) => ({ ...prev, [b.id]: val }))}
                        />
                        <TouchableOpacity
                          style={styles.boxCheckBtn}
                          onPress={() => {
                            const u = (wordwallAnswers[b.id] || '').trim().toLowerCase();
                            const isCorrect = u.includes(b.answer.toLowerCase());
                            setWordwallStatus((prev) => ({ ...prev, [b.id]: isCorrect ? 'correct' : 'incorrect' }));
                            if (isCorrect && wordwallStatus[b.id] !== 'correct') {
                              setEarnedXp((prev) => prev + 40);
                            }
                          }}
                        >
                          <Text style={styles.boxCheckBtnText}>OK</Text>
                        </TouchableOpacity>
                      </View>

                      {st === 'correct' && (
                        <View style={styles.boxCorrectAlert}>
                          <CheckCircle2 color="#34d399" size={14} />
                          <Text style={styles.boxCorrectText}>Mandou bem! +40 XP garantidos!</Text>
                        </View>
                      )}
                      {st === 'incorrect' && (
                        <View style={styles.boxIncorrectAlert}>
                          <XCircle color="#f87171" size={14} />
                          <Text style={styles.boxIncorrectText}>Dica: {b.hint}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* MODO 5: SIMULADO REGIONAL DIGITAL */}
      {activeMode === 'simulado' && (
        <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 16 }}>
          {/* HEADER DO SIMULADO */}
          <View style={styles.simuladoHeaderCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <FileText color="#38bdf8" size={24} />
              <View style={{ flex: 1 }}>
                <Text style={styles.simuladoCardTitle}>
                  {dispatchedSimulado?.title || 'Simulado Regional Vestibulares 2026'}
                </Text>
                <Text style={styles.simuladoCardSub}>
                  {dispatchedSimulado?.school || 'Colégio Áquila Pro'} • ENEM, UnB, UFG, UniRV
                </Text>
              </View>
            </View>
            {simuladoSubmitted && simuladoScore && (
              <View style={styles.simuladoScoreBadge}>
                <Trophy color="#10b981" size={16} />
                <Text style={styles.simuladoScoreText}>
                  {simuladoScore.correct} / {simuladoScore.total} Acertos (+{simuladoScore.xp} XP)
                </Text>
              </View>
            )}
          </View>

          {/* LISTA DE QUESTÕES */}
          {(dispatchedSimulado?.items || DEFAULT_MOBILE_EXAM_ITEMS).map((q: any, idx: number) => {
            const isCorrect = simuladoAnswers[idx] === q.correct;
            return (
              <View key={idx} style={styles.simuladoQuestionCard}>
                <View style={styles.simuladoQuestionMeta}>
                  <Text style={styles.simuladoQuestionNum}>QUESTÃO {String(idx + 1).padStart(2, '0')}</Text>
                  <Text style={styles.simuladoQuestionBanca}>{q.exam || 'VESTIBULAR REGIONAL'}</Text>
                </View>

                <Text style={styles.simuladoStatement}>{q.statement}</Text>

                {/* ALTERNATIVAS A, B, C, D, E */}
                <View style={{ gap: 8, marginTop: 10 }}>
                  {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                    const isSelected = simuladoAnswers[idx] === letter;
                    const isTheCorrectOne = letter === q.correct;
                    let altStyle = styles.simuladoAltBtn;
                    if (isSelected) altStyle = [styles.simuladoAltBtn, styles.simuladoAltSelected];
                    if (simuladoSubmitted) {
                      if (isTheCorrectOne) altStyle = [styles.simuladoAltBtn, styles.simuladoAltCorrect];
                      else if (isSelected && !isTheCorrectOne) altStyle = [styles.simuladoAltBtn, styles.simuladoAltIncorrect];
                    }

                    return (
                      <TouchableOpacity
                        key={letter}
                        style={altStyle}
                        disabled={simuladoSubmitted}
                        onPress={() => setSimuladoAnswers((prev) => ({ ...prev, [idx]: letter }))}
                      >
                        <View style={[styles.simuladoRadioCircle, isSelected && styles.simuladoRadioCircleActive]}>
                          <Text style={[styles.simuladoRadioLetter, isSelected && { color: '#ffffff' }]}>
                            {letter}
                          </Text>
                        </View>
                        <Text style={styles.simuladoAltText}>
                          {q.alternatives ? q.alternatives[letter] : `Opção (${letter})`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* RESOLUÇÃO APÓS ENTREGA */}
                {simuladoSubmitted && (
                  <View style={styles.simuladoExplanationBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {isCorrect ? (
                        <>
                          <CheckCircle2 color="#34d399" size={14} />
                          <Text style={{ color: '#34d399', fontWeight: '800', fontSize: 12 }}>ACERTOU! GABARITO ({q.correct})</Text>
                        </>
                      ) : (
                        <>
                          <XCircle color="#f87171" size={14} />
                          <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 12 }}>GABARITO OFICIAL: ({q.correct})</Text>
                        </>
                      )}
                    </View>
                    <Text style={styles.simuladoExplanationText}>{q.explanation}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* BOTÃO DE ENTREGA */}
          {!simuladoSubmitted ? (
            <TouchableOpacity
              style={styles.simuladoSubmitBtn}
              onPress={() => {
                const items = dispatchedSimulado?.items || DEFAULT_MOBILE_EXAM_ITEMS;
                let correctCount = 0;
                items.forEach((item: any, i: number) => {
                  if (simuladoAnswers[i] === item.correct) correctCount++;
                });
                const total = items.length;
                const earned = correctCount * 25;
                setSimuladoScore({ correct: correctCount, total, xp: earned });
                setSimuladoSubmitted(true);
                setEarnedXp((prev) => prev + earned);
                setStreakDays((prev) => prev + 1);
              }}
            >
              <CheckCircle2 color="#ffffff" size={18} />
              <Text style={styles.simuladoSubmitBtnText}>Entregar Prova Digital</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.simuladoResetBtn}
              onPress={() => {
                setSimuladoAnswers({});
                setSimuladoSubmitted(false);
                setSimuladoScore(null);
              }}
            >
              <RotateCcw color="#38bdf8" size={16} />
              <Text style={styles.simuladoResetBtnText}>Refazer Simulado</Text>
            </TouchableOpacity>
          )}
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
  wordwallHeaderCard: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  wordwallTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  wordwallSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  wordwallGrid: {
    gap: 12,
  },
  wordwallBoxCard: {
    backgroundColor: '#0a1024',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 14,
  },
  wordwallBoxCardOpen: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  boxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boxNumBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  boxNumText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  boxTermText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginLeft: 10,
  },
  boxBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  boxBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  boxChallengeText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  boxActionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  boxInput: {
    flex: 1,
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
  },
  boxCheckBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  boxCheckBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  boxCorrectAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  boxCorrectText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  boxIncorrectAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  boxIncorrectText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  simuladoHeaderCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  simuladoCardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  simuladoCardSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  simuladoScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  simuladoScoreText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
  },
  simuladoQuestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  simuladoQuestionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  simuladoQuestionNum: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  simuladoQuestionBanca: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
  },
  simuladoStatement: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 19,
  },
  simuladoAltBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  simuladoAltSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  simuladoAltCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  simuladoAltIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  simuladoRadioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simuladoRadioCircleActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0284c7',
  },
  simuladoRadioLetter: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
  },
  simuladoAltText: {
    color: '#cbd5e1',
    fontSize: 12,
    flex: 1,
  },
  simuladoExplanationBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  simuladoExplanationText: {
    color: '#94a3b8',
    fontSize: 11.5,
    lineHeight: 16,
  },
  simuladoSubmitBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 30,
  },
  simuladoSubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  simuladoResetBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38bdf8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 30,
  },
  simuladoResetBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
});
