import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme/theme';
import { Trophy, Star, Zap, Target, Award, Rocket } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const StudentDashboard = () => {
  const medals = [
    { id: 1, title: 'Sempre Presente', icon: <Trophy color="#f59e0b" size={24} />, xp: '+500 XP' },
    { id: 2, title: 'Foco Total', icon: <Target color="#3b82f6" size={24} />, xp: '+200 XP' },
    { id: 3, title: 'Colaborador', icon: <Users color="#10b981" size={24} />, xp: '+350 XP' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header com Level */}
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Rocket color="white" size={20} />
          <Text style={styles.levelText}>Nível 12</Text>
        </View>
        <Text style={styles.welcome}>Jornada de João</Text>
        <View style={styles.xpBar}>
          <View style={styles.xpFill} />
          <Text style={styles.xpText}>2,450 / 3,000 XP para Nível 13</Text>
        </View>
      </View>

      {/* Estatísticas Rápidas */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Zap color="#8b5cf6" size={20} />
          <Text style={styles.statValue}>88%</Text>
          <Text style={styles.statLabel}>Engajamento</Text>
        </View>
        <View style={styles.statCard}>
          <Star color="#f59e0b" size={20} />
          <Text style={styles.statValue}>1,2k</Text>
          <Text style={styles.statLabel}>Moedas Áquila</Text>
        </View>
      </View>

      {/* Medalhas e Conquistas */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Suas Conquistas</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>Ver Todas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.medalsScroll}>
        {medals.map(medal => (
          <View key={medal.id} style={styles.medalCard}>
            <View style={styles.medalIcon}>{medal.icon}</View>
            <Text style={styles.medalTitle}>{medal.title}</Text>
            <Text style={styles.medalXP}>{medal.xp}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Missão do Dia */}
      <View style={styles.missionCard}>
        <View style={styles.missionHeader}>
          <Award color="#8b5cf6" size={24} />
          <Text style={styles.missionTitle}>Missão do Dia</Text>
        </div>
        <Text style={styles.missionDesc}>
          Mantenha o foco absoluto na aula de Física para liberar a medalha "Mestre do Vácuo".
        </Text>
        <TouchableOpacity style={styles.missionBtn}>
          <Text style={styles.missionBtnText}>Aceitar Desafio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
  header: { marginTop: 40, marginBottom: 24 },
  levelBadge: {
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    width: 110,
    marginBottom: 12,
  },
  levelText: { color: 'white', fontWeight: '900', fontSize: 13 },
  welcome: { fontSize: 24, fontWeight: '900', color: 'white', marginBottom: 16 },
  xpBar: { 
    height: 30, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 8, 
    justifyContent: 'center',
    overflow: 'hidden',
  },
  xpFill: { 
    position: 'absolute', 
    left: 0, 
    top: 0, 
    bottom: 0, 
    width: '75%', 
    backgroundColor: '#8b5cf6',
    opacity: 0.8,
  },
  xpText: { color: 'white', fontSize: 10, fontWeight: '700', textAlign: 'center', zIndex: 1 },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statValue: { fontSize: 20, fontWeight: '900', color: 'white' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: 'white' },
  viewAll: { color: '#8b5cf6', fontSize: 12, fontWeight: '700' },
  medalsScroll: { marginBottom: 24 },
  medalCard: { 
    width: 120, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  medalIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 8,
  },
  medalTitle: { fontSize: 12, fontWeight: '700', color: 'white', textAlign: 'center' },
  medalXP: { fontSize: 10, color: '#10b981', fontWeight: '800', marginTop: 4 },
  missionCard: { 
    backgroundColor: 'rgba(139, 92, 246, 0.1)', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginBottom: 40,
  },
  missionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  missionTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  missionDesc: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  missionBtn: { backgroundColor: '#8b5cf6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  missionBtnText: { color: 'white', fontWeight: '800' },
});

export default StudentDashboard;
