import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { CreditCard, QrCode, Copy, CheckCircle2, ShieldCheck, Clock } from 'lucide-react-native';

interface Invoice {
  id: string;
  month: string;
  value: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'UPCOMING';
  pixCode?: string;
  paidAt?: string;
}

export default function FinanceiroTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: 'fat-2026-10', month: 'Outubro / 2026', value: 890.00, dueDate: '2026-10-25', status: 'PAID', paidAt: '2026-10-10' },
    { id: 'fat-2026-11', month: 'Novembro / 2026', value: 890.00, dueDate: '2026-11-25', status: 'PENDING', pixCode: '00020101021226840014br.gov.bcb.pix2562pix-qr.colegiovisao.edu.br/qr/v2/9b7e415204000053039865802BR5913Colegio Visao6008Brasilia62070503***6304E2D1' },
    { id: 'fat-2026-12', month: 'Dezembro / 2026', value: 890.00, dueDate: '2026-12-25', status: 'UPCOMING' },
  ]);
  const [copied, setCopied] = useState(false);

  const pendingInvoice = invoices.find(i => i.status === 'PENDING') || invoices[1];

  const handleCopyPix = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.badge}>FINANCEIRO ESCOLAR SOBERANO</Text>
        <Text style={styles.title}>Mensalidades & PIX</Text>
        <Text style={styles.subTitle}>Matrícula 2026 • Aluno: João Gabriel Mendes</Text>
      </View>

      {/* Card Destaque: Fatura Aberta com PIX */}
      {pendingInvoice && (
        <View style={styles.pixHighlightCard}>
          <View style={styles.pixHeader}>
            <View>
              <Text style={styles.pixMonth}>{pendingInvoice.month}</Text>
              <Text style={styles.pixDueDate}>Vencimento: 25/11/2026</Text>
            </View>
            <Text style={styles.pixValue}>R$ {pendingInvoice.value.toFixed(2)}</Text>
          </View>

          <View style={styles.qrPlaceholder}>
            <QrCode size={110} color="#00F0FF" />
            <Text style={styles.qrText}>PIX QR Dinâmico com Baixa Automática</Text>
          </View>

          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyPix}>
            {copied ? <CheckCircle2 size={16} color="#10B981" /> : <Copy size={16} color="#080B11" />}
            <Text style={[styles.copyBtnText, copied && { color: '#10B981' }]}>
              {copied ? 'Código PIX Copiado com Sucesso!' : 'Copiar Código PIX (Copia e Cola)'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Histórico de Mensalidades */}
      <Text style={styles.sectionTitle}>Histórico do Ano Letivo</Text>

      <View style={styles.invoiceList}>
        {invoices.map((inv) => (
          <View key={inv.id} style={styles.invoiceCard}>
            <View style={styles.invLeft}>
              <View style={[styles.invIcon, inv.status === 'PAID' ? styles.iconGreen : styles.iconAmber]}>
                {inv.status === 'PAID' ? <ShieldCheck size={18} color="#10B981" /> : <Clock size={18} color="#F59E0B" />}
              </View>
              <View>
                <Text style={styles.invTitle}>{inv.month}</Text>
                <Text style={styles.invMeta}>
                  {inv.status === 'PAID' ? `Pago em ${inv.paidAt}` : `Vence em ${inv.dueDate}`}
                </Text>
              </View>
            </View>

            <View style={styles.invRight}>
              <Text style={styles.invAmount}>R$ {inv.value.toFixed(2)}</Text>
              <View style={[styles.statusBadge, inv.status === 'PAID' ? styles.badgePaid : styles.badgePending]}>
                <Text style={styles.statusText}>{inv.status === 'PAID' ? 'QUITADO' : 'ABERTO'}</Text>
              </View>
            </View>
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
    color: '#00F0FF',
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
  pixHighlightCard: {
    backgroundColor: '#141B2D',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.4)',
    padding: 16,
    marginBottom: 20,
  },
  pixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  pixMonth: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  pixDueDate: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 2,
  },
  pixValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00F0FF',
  },
  qrPlaceholder: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  qrText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 10,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 42,
    backgroundColor: '#00F0FF',
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#080B11',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  invoiceList: {
    gap: 8,
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141B2D',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  invLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  invIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  iconAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  invTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  invMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  invRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  invAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgePaid: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F8FAFC',
  },
});
