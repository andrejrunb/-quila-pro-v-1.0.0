import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, FlatList } from 'react-native';
import { theme } from '../theme/theme';
import { Calendar, CheckCircle, XCircle, User, Award, Users, BookOpen, Clock, ArrowLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Student {
  id: string;
  name: string;
  present: boolean;
}

export const TeacherDashboard = ({ navigation }: any) => {
  // Configuração inicial do Professor
  const [step, setStep] = useState<'setup' | 'dashboard' | 'attendance'>('setup');
  const [subject, setSubject] = useState('');
  const [front, setFront] = useState('');
  
  // Grade de Horários do Dia (Baseado no horário real do Colégio Visão)
  const scheduleToday = [
    { id: '1', period: '1º Horário', time: '07:30 - 08:20', className: '3 ANO A', classId: 'F-EF13A', room: 'Sala F-EF13A' },
    { id: '2', period: '2º Horário', time: '08:20 - 09:10', className: '3 ANO A', classId: 'F-EF13A', room: 'Sala F-EF13A' },
    { id: '3', period: '3º Horário', time: '09:10 - 10:00', className: '3 ANO B', classId: 'F-EF13B', room: 'Sala F-EF13B' },
    { id: '4', period: '4º Horário', time: '10:30 - 11:10', className: '4 ANO A', classId: 'F-EF14A', room: 'Sala F-EF14A' },
    { id: '5', period: '5º Horário', time: '11:10 - 12:00', className: '4 ANO B', classId: 'F-EF14B', room: 'Sala F-EF14B' },
  ];

  const [selectedClass, setSelectedClass] = useState<any>(null);

  // Alunos reais mockados para chamada
  const [students, setStudents] = useState<Student[]>([
    { id: '1', name: 'ANA CLARA ALMEIDA', present: true },
    { id: '2', name: 'BRUNO GOMES SILVA', present: true },
    { id: '3', name: 'CARLOS EDUARDO NETO', present: true },
    { id: '4', name: 'DANIEL MENDES LIMA', present: false },
    { id: '5', name: 'EMILY COSTA REIS', present: true },
    { id: '6', name: 'FELIPE NUNES ROCHA', present: true },
    { id: '7', name: 'GABRIELA SOUSA MELO', present: true },
    { id: '8', name: 'HENRIQUE PINTO DIAS', present: false },
    { id: '9', name: 'ISABELA SANTOS CRUZ', present: true },
    { id: '10', name: 'JOAO VITOR OLIVEIRA', present: true },
  ]);

  const handleStartSetup = () => {
    if (!subject || !front) {
      alert('Por favor, informe a Disciplina e a Frente.');
      return;
    }
    setStep('dashboard');
  };

  const handleOpenAttendance = (classItem: any) => {
    setSelectedClass(classItem);
    setStep('attendance');
  };

  const togglePresence = (studentId: string) => {
    setStudents(prev => 
      prev.map(s => s.id === studentId ? { ...s, present: !s.present } : s)
    );
  };

  const handleSaveAttendance = () => {
    alert(`Chamada da turma ${selectedClass.className} salva com sucesso no banco de dados da Áquila!`);
    setStep('dashboard');
  };

  if (step === 'setup') {
    return (
      <View style={styles.setupContainer}>
        <View style={styles.logoContainer}>
          <BookOpen color={theme.colors.primary} size={40} />
        </View>
        <Text style={styles.setupTitle}>Configuração Docente</Text>
        <Text style={styles.setupSubtitle}>Por favor, confirme seus dados de atuação de hoje.</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Disciplina</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Física, Matemática, Biologia"
              placeholderTextColor={theme.colors.textSecondary}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Frente (Módulo)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Frente A, Mecânica, Módulo I"
              placeholderTextColor={theme.colors.textSecondary}
              value={front}
              onChangeText={setFront}
            />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleStartSetup}>
            <Text style={styles.btnText}>Entrar no Diário de Classe</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'attendance') {
    return (
      <View style={styles.attendanceContainer}>
        <View style={styles.attHeader}>
          <TouchableOpacity onPress={() => setStep('dashboard')} style={styles.btnBack}>
            <ArrowLeft color="white" size={24} />
          </TouchableOpacity>
          <View>
            <Text style={styles.attClassTitle}>{selectedClass.className}</Text>
            <Text style={styles.attClassSubtitle}>{selectedClass.period} • {selectedClass.room}</Text>
          </View>
        </View>

        <View style={styles.attSummary}>
          <Text style={styles.summaryText}>
            Presenças: <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{students.filter(s=>s.present).length}</Text>
            {'  '}•{'  '}
            Faltas: <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>{students.filter(s=>!s.present).length}</Text>
          </Text>
        </View>

        <FlatList
          data={students}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.studentRow, item.present ? styles.rowPresent : styles.rowAbsent]}
              onPress={() => togglePresence(item.id)}
            >
              <View style={styles.studentInfo}>
                <View style={styles.userIconWrapper}>
                  <User color="#94a3b8" size={16} />
                </View>
                <Text style={styles.studentName}>{item.name}</Text>
              </View>
              <View>
                {item.present ? (
                  <CheckCircle color="#10b981" size={24} />
                ) : (
                  <XCircle color="#ef4444" size={24} />
                )}
              </View>
            </TouchableOpacity>
          )}
        />

        <View style={styles.floatingAction}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveAttendance}>
            <Text style={styles.btnText}>Finalizar Chamada</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header do Dashboard */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Diário de Classe</Text>
        <View style={styles.infoBadgeRow}>
          <View style={styles.infoBadge}>
            <BookOpen color="#3b82f6" size={14} />
            <Text style={styles.infoBadgeText}>{subject}</Text>
          </View>
          <View style={styles.infoBadge}>
            <Award color="#8b5cf6" size={14} />
            <Text style={styles.infoBadgeText}>{front}</Text>
          </View>
        </View>
      </View>

      {/* Estatísticas Rápidas */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Clock color="#f59e0b" size={20} />
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Aulas de Hoje</Text>
        </View>
        <View style={styles.statCard}>
          <Users color="#10b981" size={20} />
          <Text style={styles.statValue}>92%</Text>
          <Text style={styles.statLabel}>Frequência Geral</Text>
        </View>
      </View>

      {/* Agenda/Grade de Aulas de Hoje */}
      <Text style={styles.sectionTitle}>Grade de Hoje (Colégio Visão)</Text>
      
      <View style={styles.scheduleList}>
        {scheduleToday.map(item => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.scheduleCard}
            onPress={() => handleOpenAttendance(item)}
          >
            <View style={styles.scheduleTimeSection}>
              <Text style={styles.periodText}>{item.period}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            
            <View style={styles.scheduleMainSection}>
              <Text style={styles.classNameText}>{item.className}</Text>
              <Text style={styles.roomText}>{item.room}</Text>
            </View>

            <View style={styles.arrowSection}>
              <CheckCircle color={theme.colors.primary} size={20} />
              <Text style={styles.callLabel}>Chamada</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  setupContainer: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    justifyContent: 'center', 
    padding: 24 
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  setupTitle: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: 'white', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  setupSubtitle: { 
    fontSize: 14, 
    color: '#94a3b8', 
    textAlign: 'center', 
    marginBottom: 36,
    lineHeight: 20
  },
  form: { gap: 16 },
  inputContainer: { gap: 8 },
  label: { fontSize: 14, color: 'white', fontWeight: '600' },
  input: {
    height: 56,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  
  header: { marginTop: 40, marginBottom: 24 },
  welcome: { fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 12 },
  infoBadgeRow: { flexDirection: 'row', gap: 8 },
  infoBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  infoBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },

  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: { fontSize: 22, fontWeight: '900', color: 'white' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: 'white', marginBottom: 16 },
  scheduleList: { gap: 16, paddingBottom: 40 },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center'
  },
  scheduleTimeSection: {
    width: '30%',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
    paddingRight: 12,
  },
  periodText: { color: '#fbbf24', fontWeight: 'bold', fontSize: 13, marginBottom: 4 },
  timeText: { color: '#94a3b8', fontSize: 11 },
  scheduleMainSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  classNameText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  roomText: { color: '#64748b', fontSize: 12 },
  arrowSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  callLabel: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold' },

  // Chamada Styling
  attendanceContainer: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 20, paddingTop: 40 },
  attHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  btnBack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  attClassTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  attClassSubtitle: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  attSummary: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20
  },
  summaryText: { color: '#94a3b8', fontSize: 14, textAlign: 'center' },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  rowPresent: {
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  rowAbsent: {
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
    borderColor: 'rgba(239, 68, 68, 0.1)',
  },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center'
  },
  studentName: { color: 'white', fontWeight: '600', fontSize: 14 },
  floatingAction: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0f172a',
    paddingTop: 12
  }
});

export default TeacherDashboard;
