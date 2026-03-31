import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { User, Bell, MapPin, Calendar, CheckCircle2 } from 'lucide-react-native';

const ParentDashboard = () => {
  const checkins = [
    { time: '07:15', status: 'Entrada Confirmada', zone: 'Portaria Principal' },
    { time: '07:22', status: 'Presença em Sala', zone: 'Sala 4 - B' },
    { time: '10:30', status: 'Saída para Intervalo', zone: 'Pátio Central' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Olá, Sr. Silva</Text>
          <Text style={styles.statusText}>João está em aula agora.</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Bell color={theme.colors.text} size={24} />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      <View style={styles.studentCard}>
        <View style={styles.avatarContainer}>
          <User color={theme.colors.primary} size={32} />
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>João Silva</Text>
          <Text style={styles.studentClass}>9º Ano - Turma A</Text>
        </View>
        <View style={styles.activeLabel}>
          <View style={styles.pulse} />
          <Text style={styles.activeText}>EM SALA</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Atividade de Hoje</Text>
      <View style={styles.timeline}>
        {checkins.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineLine}>
              <View style={styles.timelineDot} />
              {index !== checkins.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                <Text style={styles.timelineStatus}>{item.status}</Text>
              </View>
              <View style={styles.locationContainer}>
                <MapPin size={12} color={theme.colors.textSecondary} />
                <Text style={styles.timelineZone}>{item.zone}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Destaque Pedagógico</Text>
        <View style={styles.highlightRow}>
          <CheckCircle2 color={theme.colors.success} size={20} />
          <Text style={styles.highlightText}>Participação excelente em Matemática hoje.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  studentCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  studentClass: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeText: {
    color: theme.colors.success,
    fontSize: 10,
    fontWeight: 'bold',
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLine: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    zIndex: 1,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 16,
    paddingBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  timelineStatus: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineZone: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: 8,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  highlightText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
});

export default ParentDashboard;
