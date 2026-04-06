import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { ShieldAlert, Activity, Lock, AlertTriangle, Eye, ArrowRight } from 'lucide-react-native';

const GuardDashboard = () => {
  const alerts = [
    { type: 'restricted', location: 'Pátio Norte', time: 'Agora', priority: 'high', label: 'Indivíduo em Zona Restrita' },
    { type: 'loitering', location: 'Banheiro B', time: '10min', priority: 'medium', label: 'Aglomeração Detectada' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.roleLabel}>OPERADOR DE SEGURANÇA</Text>
          <Text style={styles.statusText}>Monitoramento Ativo: 12 Câmeras</Text>
        </View>
        <Activity color={theme.colors.success} size={24} />
      </View>

      <TouchableOpacity style={styles.panicButton}>
        <ShieldAlert color="white" size={32} />
        <Text style={styles.panicText}>ACIONAR LOCKDOWN</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Alertas Críticos</Text>
        <Text style={styles.alertCount}>{alerts.length} Ativos</Text>
      </View>

      {alerts.map((alert, index) => (
        <View 
          key={index} 
          style={[
            styles.alertCard, 
            alert.priority === 'high' ? styles.highBorder : styles.mediumBorder
          ]}
        >
          <View style={styles.alertIconContainer}>
            <AlertTriangle color={alert.priority === 'high' ? theme.colors.error : theme.colors.warning} size={24} />
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertLabel}>{alert.label}</Text>
            <Text style={styles.alertLocation}>{alert.location} • {alert.time}</Text>
          </View>
          <TouchableOpacity style={styles.viewBtn}>
            <Eye color={theme.colors.primary} size={20} />
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Ações Rápidas</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard}>
          <Lock color={theme.colors.text} size={24} />
          <Text style={styles.actionText}>Zonas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <ShieldAlert color={theme.colors.text} size={24} />
          <Text style={styles.actionText}>Protocolos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard}>
          <ArrowRight color={theme.colors.text} size={24} />
          <Text style={styles.actionText}>Escala</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.auditCard}>
        <Text style={styles.auditTitle}>Status do Nó Local</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>CPU NPU</Text>
          <Text style={styles.statValue}>24%</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Latency</Text>
          <Text style={styles.statValue}>18ms</Text>
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
  roleLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  statusText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  panicButton: {
    backgroundColor: '#ef4444',
    height: 100,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  panicText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  alertCount: {
    fontSize: 12,
    color: theme.colors.error,
    fontWeight: 'bold',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  alertCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  highBorder: {
    borderLeftColor: theme.colors.error,
  },
  mediumBorder: {
    borderLeftColor: theme.colors.warning,
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertLabel: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertLocation: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  viewBtn: {
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  auditCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: 16,
    borderRadius: theme.borderRadius.md,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  auditTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  statValue: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default GuardDashboard;
