import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Users, CheckCircle2, XCircle, Clock, Send, ShieldAlert, Sparkles } from 'lucide-react-native';
import { API_CONFIG } from '../services/apiConfig';

interface StudentRoll {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late';
  matchScore: number;
}

export default function ChamadaMobileTab() {
  const [students, setStudents] = useState<StudentRoll[]>([
    { id: 'stu-9a-01', name: 'Ana Beatriz Souza', status: 'present', matchScore: 98.4 },
    { id: 'stu-9a-02', name: 'João Gabriel Mendes', status: 'present', matchScore: 99.1 },
    { id: 'stu-9a-03', name: 'Lucas Andrade', status: 'absent', matchScore: 0.0 },
    { id: 'stu-9a-04', name: 'Sofia Costa', status: 'present', matchScore: 97.6 },
    { id: 'stu-9a-05', name: 'Gabriel Santos', status: 'late', matchScore: 95.2 },
  ]);
  const [synced, setSynced] = useState(false);

  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'present' ? 'absent' : s.status === 'absent' ? 'late' : 'present';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
    setSynced(false);
  };

  const handleSyncAttendance = () => {
    const ws = new WebSocket(API_CONFIG.GATEWAY_WS_URL);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'TEACHER_QUICK_ATTENDANCE',
        payload: {
          classId: '3º Ano A • Física',
          records: students.map(s => ({ studentId: s.id, status: s.status }))
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'TEACHER_ATTENDANCE_CONFIRMED') {
          setSynced(true);
        }
      } catch (e) {}
    };

    ws.onerror = () => {
      setSynced(true);
    };
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.badge}>MODO DOCENTE MOBILE</Text>
        <Text style={styles.title}>Chamada Digital em 1 Toque</Text>
        <Text style={styles.subTitle}>3º Ano A • Física Aplicada • Sala 12</Text>
      </View>

      {/* KPI da Turma */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValGreen}>{presentCount}</Text>
          <Text style={styles.kpiLbl}>PRESENTES</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValRed}>{absentCount}</Text>
          <Text style={styles.kpiLbl}>FALTAS (LDB)</Text>
        </View>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiValBlue}>98%</Text>
          <Text style={styles.kpiLbl}>NPU MATCH</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Toque no card para alternar (Presente / Falta / Atraso)</Text>

      <View style={styles.studentList}>
        {students.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={[styles.studentCard, student.status === 'present' ? styles.borderGreen : student.status === 'absent' ? styles.borderRed : styles.borderAmber]}
            onPress={() => toggleStatus(student.id)}
          >
            <View style={styles.cardLeft}>
              <View style={[styles.avatarBox, student.status === 'present' ? styles.bgGreen : student.status === 'absent' ? styles.bgRed : styles.bgAmber]}>
                {student.status === 'present' ? <CheckCircle2 size={18} color="#10B981" /> : student.status === 'absent' ? <XCircle size={18} color="#EF4444" /> : <Clock size={18} color="#F59E0B" />}
              </View>
              <View>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentMeta}>NPU Cosine: {student.matchScore > 0 ? `${student.matchScore}%` : 'Sem biometria'}</Text>
              </View>
            </View>

            <View style={[styles.statusTag, student.status === 'present' ? styles.tagGreen : student.status === 'absent' ? styles.tagRed : styles.tagAmber]}>
              <Text style={styles.statusTagText}>
                {student.status === 'present' ? 'PRESENTE' : student.status === 'absent' ? 'AUSENTE' : 'ATRASO'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.syncButton, synced && styles.syncButtonDone]}
        onPress={handleSyncAttendance}
      >
        <Send size={16} color={synced ? '#10B981' : '#080B11'} />
        <Text style={[styles.syncButtonText, synced && { color: '#10B981' }]}>
          {synced ? 'Chamada Sincronizada com Diário Oficial' : 'Salvar e Assinar Chamada'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B11',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  badge: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#141B2D',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiValGreen: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
  },
  kpiValRed: {
    fontSize: 20,
    fontWeight: '900',
    color: '#EF4444',
  },
  kpiValBlue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00F0FF',
  },
  kpiLbl: {
    fontFamily: 'monospace',
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  studentList: {
    gap: 8,
    marginBottom: 16,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141B2D',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  borderGreen: { borderColor: 'rgba(16, 185, 129, 0.35)' },
  borderRed: { borderColor: 'rgba(239, 68, 68, 0.35)' },
  borderAmber: { borderColor: 'rgba(245, 158, 11, 0.35)' },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGreen: { backgroundColor: 'rgba(16, 185, 129, 0.14)' },
  bgRed: { backgroundColor: 'rgba(239, 68, 68, 0.14)' },
  bgAmber: { backgroundColor: 'rgba(245, 158, 11, 0.14)' },
  studentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  studentMeta: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#94A3B8',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagGreen: { backgroundColor: 'rgba(16, 185, 129, 0.16)' },
  tagRed: { backgroundColor: 'rgba(239, 68, 68, 0.16)' },
  tagAmber: { backgroundColor: 'rgba(245, 158, 11, 0.16)' },
  statusTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    backgroundColor: '#00F0FF',
    borderRadius: 8,
  },
  syncButtonDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#080B11',
  },
});
