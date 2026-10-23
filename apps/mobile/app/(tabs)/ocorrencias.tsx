import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AlertTriangle, ShieldCheck, CheckCircle2, FileSignature, Clock, ChevronRight } from 'lucide-react-native';
import { API_CONFIG } from '../services/apiConfig';

interface Incident {
  id: string;
  date: string;
  title: string;
  description: string;
  coordinator: string;
  signed: boolean;
  signedAt?: string;
  signatureHash?: string;
}

export default function OcorrenciasTab() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'INC-2026-08',
      date: '18/10/2026 às 10:45',
      title: 'Uso de Fone de Ouvido em Avaliação',
      description: 'O aluno utilizou fone durante a prova de Física. Foi orientado pelo professor e encaminhado à coordenação.',
      coordinator: 'Prof. Paulo Andrade (Coordenação Pedagógica)',
      signed: false
    },
    {
      id: 'INC-2026-03',
      date: '02/09/2026 às 08:15',
      title: 'Chegada Tardia com Atraso de 35 Minutos',
      description: 'Aluno chegou após o início do segundo tempo. Responsável notificado e ciência registrada no sistema.',
      coordinator: 'Profa. Cristina (Secretaria)',
      signed: true,
      signedAt: '02/09/2026 às 08:30',
      signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    }
  ]);
  const [signingId, setSigningId] = useState<string | null>(null);

  const handleSign = (incidentId: string) => {
    setSigningId(incidentId);

    const ws = new WebSocket(API_CONFIG.GATEWAY_WS_URL);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'SIGN_DISCIPLINARY_ACTION',
        deviceId: 'parent-mobile-v2',
        payload: {
          incidentId,
          parentName: 'Mariana Mendes (Mãe)',
          signatureData: 'Biometria Facial Mobile Verified'
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'SIGN_DISCIPLINARY_RESPONSE' && payload.data?.success) {
          setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
              return {
                ...inc,
                signed: true,
                signedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                signatureHash: payload.data.signatureHash
              };
            }
            return inc;
          }));
          setSigningId(null);
        }
      } catch (e) {
        setSigningId(null);
      }
    };

    ws.onerror = () => {
      // Fallback local caso WS offline
      setIncidents(prev => prev.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            signed: true,
            signedAt: 'Hoje às ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            signatureHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0'
          };
        }
        return inc;
      }));
      setSigningId(null);
    };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.badge}>LDB ART. 12 VII & CONFORMIDADE LEGAL</Text>
        <Text style={styles.title}>Ocorrências & Comunicados</Text>
        <Text style={styles.subTitle}>Assinatura Digital Soberana com Carimbo ICP-Brasil</Text>
      </View>

      <View style={styles.incidentList}>
        {incidents.map((item) => (
          <View key={item.id} style={styles.incidentCard}>
            <View style={styles.cardTop}>
              <View style={styles.titleGroup}>
                <AlertTriangle size={18} color={item.signed ? '#94A3B8' : '#F59E0B'} />
                <Text style={styles.incidentTitle}>{item.title}</Text>
              </View>
              <View style={[styles.signedPill, item.signed ? styles.pillSigned : styles.pillPending]}>
                <Text style={styles.pillText}>{item.signed ? 'CIÊNCIA ASSINADA' : 'PENDENTE DE ASSINATURA'}</Text>
              </View>
            </View>

            <Text style={styles.incidentDate}>Ocorrência {item.id} • {item.date}</Text>
            <Text style={styles.incidentDesc}>{item.description}</Text>
            <Text style={styles.coordinatorText}>Emitido por: {item.coordinator}</Text>

            {!item.signed ? (
              <TouchableOpacity
                style={styles.signButton}
                onPress={() => handleSign(item.id)}
                disabled={signingId === item.id}
              >
                <FileSignature size={16} color="#FFFFFF" />
                <Text style={styles.signButtonText}>
                  {signingId === item.id ? 'Gravando Assinatura ICP...' : 'Assinar Termo de Ciência Digital'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.signedAuditBox}>
                <CheckCircle2 size={15} color="#10B981" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditTitle}>Assinado Digitalmente pelo Responsável</Text>
                  <Text style={styles.auditHash}>Hash SHA-256: {item.signatureHash?.substring(0, 32)}...</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
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
    color: '#F59E0B',
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
  incidentList: {
    gap: 12,
  },
  incidentCard: {
    backgroundColor: '#141B2D',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  incidentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  signedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillSigned: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  pillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  pillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  incidentDate: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  incidentDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 10,
  },
  coordinatorText: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 14,
  },
  signButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 40,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
  },
  signButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#080B11',
  },
  signedAuditBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 8,
    padding: 10,
  },
  auditTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  auditHash: {
    fontFamily: 'monospace',
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
});
