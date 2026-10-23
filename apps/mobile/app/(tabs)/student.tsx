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
import { Sparkles, Send, Brain, BookOpen, CheckCircle2, Lightbulb } from 'lucide-react-native';
import { API_CONFIG } from '../services/apiConfig';

interface StudyMessage {
  id: string;
  sender: 'student' | 'albus';
  text: string;
  timestamp: number;
}

export default function StudentLabTab() {
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
      // Tenta conexão direta com Colab GPU A100 Tutor
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
          // Fallback socrático offline
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
            <Text style={styles.title}>Albus IA — Tutor Socrático</Text>
            <Text style={styles.subtitle}>Laboratório Pedagógico Soberano (Porta 9000)</Text>
          </View>
        </View>
      </View>

      {/* QUICK PROMPT PILLS */}
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

      {/* CHAT MESSAGES */}
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

      {/* INPUT BAR */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Tire sua dúvida ou envie um exercício..."
          placeholderTextColor="#64748b"
          value={topic}
          onChangeText={setTopic}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !topic.trim() && { opacity: 0.5 }]}
          onPress={() => handleSend()}
          disabled={!topic.trim() || loading}
          activeOpacity={0.8}
        >
          <Send color="#ffffff" size={18} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b18',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#070f24',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  quickBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0d1830',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  quickPillText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
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
    alignItems: 'flex-end',
  },
  albusWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
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
});
