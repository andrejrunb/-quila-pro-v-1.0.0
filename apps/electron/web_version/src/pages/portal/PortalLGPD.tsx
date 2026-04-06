import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Shield, ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  Eye, Brain, Bell, Clock, Lock, Database, FileText,
  Download, Trash2, Edit, ChevronRight, Info, Loader2
} from "lucide-react";

// Tipos de consentimento
const CONSENT_TYPES = [
  {
    key: "facial_recognition",
    label: "Reconhecimento Facial",
    icon: Eye,
    description: "Coleta e processamento de dados biométricos faciais para identificação do aluno nas dependências da escola.",
    impact: "Sem este consentimento, o aluno não será identificado automaticamente pelo sistema de câmeras.",
    legalBasis: "Art. 11, II, 'a' da LGPD - Consentimento do titular",
  },
  {
    key: "presence_tracking",
    label: "Rastreamento de Presença",
    icon: Clock,
    description: "Registro automático de entrada, saída e permanência do aluno em cada sala de aula e áreas comuns.",
    impact: "Sem este consentimento, a presença será registrada manualmente pelo professor.",
    legalBasis: "Art. 7, V da LGPD - Execução de contrato",
  },
  {
    key: "behavior_analysis",
    label: "Análise Comportamental",
    icon: Brain,
    description: "Análise de padrões de comportamento como frequência de saídas de sala, tempo no banheiro e engajamento.",
    impact: "Sem este consentimento, relatórios comportamentais não serão gerados para o aluno.",
    legalBasis: "Art. 11, II, 'a' da LGPD - Consentimento do titular",
  },
  {
    key: "security_monitoring",
    label: "Monitoramento de Segurança",
    icon: Shield,
    description: "Monitoramento em tempo real para detectar situações de risco como saída não autorizada da escola.",
    impact: "Sem este consentimento, alertas de segurança não serão emitidos para o aluno.",
    legalBasis: "Art. 7, VII da LGPD - Proteção da vida",
  },
  {
    key: "parent_alerts",
    label: "Alertas para Responsáveis",
    icon: Bell,
    description: "Envio de notificações automáticas sobre entrada, saída, ausências e alertas de segurança do aluno.",
    impact: "Sem este consentimento, você não receberá notificações automáticas sobre seu filho.",
    legalBasis: "Art. 7, V da LGPD - Execução de contrato",
  },
  {
    key: "data_retention",
    label: "Retenção de Dados",
    icon: Database,
    description: "Armazenamento de dados históricos de presença e comportamento por até 5 anos para fins acadêmicos.",
    impact: "Sem este consentimento, os dados serão deletados ao final de cada período letivo.",
    legalBasis: "Art. 16, I da LGPD - Cumprimento de obrigação legal",
  },
];

interface ConsentState {
  key: string;
  status: "granted" | "revoked" | "pending";
  grantedAt?: string;
  revokedAt?: string;
}

export default function PortalLGPD() {
  const [, navigate] = useLocation();
  const [token] = useState(() => localStorage.getItem("parentToken") || "");
  const [parentData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("parentData") || "{}");
    } catch {
      return {};
    }
  });

  // Simulated consent states (in production, would come from backend)
  const [consents, setConsents] = useState<ConsentState[]>(() => {
    // Try to load from localStorage (signed LGPD term)
    const lgpdSignature = localStorage.getItem("lgpd_signature");
    if (lgpdSignature) {
      try {
        const sig = JSON.parse(lgpdSignature);
        return CONSENT_TYPES.map((ct) => ({
          key: ct.key,
          status: sig.consents?.[ct.key] ? "granted" as const : "revoked" as const,
          grantedAt: sig.consents?.[ct.key] ? sig.signedAt : undefined,
        }));
      } catch {
        // fallback
      }
    }
    return CONSENT_TYPES.map((ct) => ({
      key: ct.key,
      status: "granted" as const,
      grantedAt: new Date().toISOString(),
    }));
  });

  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);
  const [grantConfirm, setGrantConfirm] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showDataRequest, setShowDataRequest] = useState(false);
  const [dataRequestType, setDataRequestType] = useState<string | null>(null);
  const [dataRequestReason, setDataRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/portal-pais/login");
    }
  }, [token, navigate]);

  const handleRevokeConsent = async (consentKey: string) => {
    setProcessing(consentKey);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setConsents((prev) =>
      prev.map((c) =>
        c.key === consentKey
          ? { ...c, status: "revoked" as const, revokedAt: new Date().toISOString() }
          : c
      )
    );
    
    // Update localStorage
    const lgpdSignature = localStorage.getItem("lgpd_signature");
    if (lgpdSignature) {
      try {
        const sig = JSON.parse(lgpdSignature);
        if (sig.consents) {
          sig.consents[consentKey] = false;
          localStorage.setItem("lgpd_signature", JSON.stringify(sig));
        }
      } catch {}
    }

    setProcessing(null);
    setRevokeConfirm(null);
    toast.success("Consentimento revogado com sucesso. A alteração será processada em até 24 horas.");
  };

  const handleGrantConsent = async (consentKey: string) => {
    setProcessing(consentKey);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setConsents((prev) =>
      prev.map((c) =>
        c.key === consentKey
          ? { ...c, status: "granted" as const, grantedAt: new Date().toISOString(), revokedAt: undefined }
          : c
      )
    );
    
    const lgpdSignature = localStorage.getItem("lgpd_signature");
    if (lgpdSignature) {
      try {
        const sig = JSON.parse(lgpdSignature);
        if (sig.consents) {
          sig.consents[consentKey] = true;
          localStorage.setItem("lgpd_signature", JSON.stringify(sig));
        }
      } catch {}
    }

    setProcessing(null);
    setGrantConfirm(null);
    toast.success("Consentimento concedido com sucesso.");
  };

  const handleSubmitDataRequest = async () => {
    if (!dataRequestType || !dataRequestReason.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSubmittingRequest(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSubmittingRequest(false);
    setShowDataRequest(false);
    setDataRequestType(null);
    setDataRequestReason("");
    toast.success("Solicitação registrada com sucesso! Você receberá uma resposta em até 15 dias úteis.");
  };

  const grantedCount = consents.filter((c) => c.status === "granted").length;
  const revokedCount = consents.filter((c) => c.status === "revoked").length;

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/portal-pais/dashboard">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Privacidade e LGPD</h1>
                <p className="text-xs text-gray-500">Gerencie seus consentimentos e dados</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold">Seus Consentimentos LGPD</h2>
              <p className="text-green-100 mt-1">
                Gerencie os consentimentos de coleta e processamento de dados do(s) seu(s) filho(s).
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/15 rounded-lg px-4 py-2 backdrop-blur-sm text-center">
                <p className="text-2xl font-bold">{grantedCount}</p>
                <p className="text-xs text-green-100">Ativos</p>
              </div>
              <div className="bg-white/15 rounded-lg px-4 py-2 backdrop-blur-sm text-center">
                <p className="text-2xl font-bold">{revokedCount}</p>
                <p className="text-xs text-green-100">Revogados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Seus direitos conforme a LGPD (Lei 13.709/2018):</p>
            <p className="mt-1">
              Você pode revogar ou conceder consentimentos a qualquer momento. A revogação não afeta
              o processamento realizado antes da data de revogação. Alterações são processadas em até 24 horas.
            </p>
          </div>
        </div>

        {/* Consent Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Consentimentos de Dados</h3>
          
          {CONSENT_TYPES.map((ct) => {
            const consent = consents.find((c) => c.key === ct.key);
            const isGranted = consent?.status === "granted";
            const isProcessing = processing === ct.key;
            const Icon = ct.icon;

            return (
              <Card key={ct.key} className={`border-0 shadow-sm transition-all ${isGranted ? "" : "bg-gray-50"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isGranted ? "bg-green-100" : "bg-red-100"
                    }`}>
                      <Icon className={`w-6 h-6 ${isGranted ? "text-green-600" : "text-red-500"}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{ct.label}</h4>
                          <Badge className={`border-0 ${
                            isGranted
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {isGranted ? "Ativo" : "Revogado"}
                          </Badge>
                        </div>
                        
                        {/* Action Buttons */}
                        <div>
                          {revokeConfirm === ct.key ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600 font-medium">Confirmar revogação?</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                onClick={() => handleRevokeConsent(ct.key)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Sim, revogar"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => setRevokeConfirm(null)}
                                disabled={isProcessing}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : grantConfirm === ct.key ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-green-600 font-medium">Confirmar concessão?</span>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-8"
                                onClick={() => handleGrantConsent(ct.key)}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  "Sim, conceder"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => setGrantConfirm(null)}
                                disabled={isProcessing}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : isGranted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                              onClick={() => setRevokeConfirm(ct.key)}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Revogar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 h-8"
                              onClick={() => setGrantConfirm(ct.key)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Conceder
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-2">{ct.description}</p>
                      
                      <div className="mt-3 grid sm:grid-cols-2 gap-2">
                        <div className="bg-amber-50 rounded-lg p-2.5">
                          <p className="text-xs font-medium text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Impacto da Revogação
                          </p>
                          <p className="text-xs text-amber-700 mt-0.5">{ct.impact}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2.5">
                          <p className="text-xs font-medium text-blue-800 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Base Legal
                          </p>
                          <p className="text-xs text-blue-700 mt-0.5">{ct.legalBasis}</p>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="mt-2 flex gap-4 text-xs text-gray-400">
                        {consent?.grantedAt && (
                          <span>
                            Concedido em: {new Date(consent.grantedAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        {consent?.revokedAt && (
                          <span className="text-red-400">
                            Revogado em: {new Date(consent.revokedAt).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Subject Rights Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Direitos do Titular de Dados</h3>
          
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                type: "access",
                label: "Solicitar Acesso",
                desc: "Obter cópia de todos os dados pessoais coletados",
                icon: Eye,
                color: "blue",
              },
              {
                type: "correction",
                label: "Solicitar Correção",
                desc: "Corrigir dados imprecisos ou incompletos",
                icon: Edit,
                color: "amber",
              },
              {
                type: "portability",
                label: "Portabilidade de Dados",
                desc: "Receber dados em formato estruturado (JSON/CSV)",
                icon: Download,
                color: "green",
              },
              {
                type: "deletion",
                label: "Solicitar Exclusão",
                desc: "Solicitar exclusão de todos os dados pessoais",
                icon: Trash2,
                color: "red",
              },
            ].map((right) => {
              const Icon = right.icon;
              const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
                blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
                amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
                green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
                red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
              };
              const colors = colorClasses[right.color];

              return (
                <Card
                  key={right.type}
                  className={`border shadow-sm cursor-pointer hover:shadow-md transition-all ${colors.border}`}
                  onClick={() => {
                    setDataRequestType(right.type);
                    setShowDataRequest(true);
                  }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{right.label}</p>
                      <p className="text-xs text-gray-500">{right.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Data Request Modal */}
        {showDataRequest && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {dataRequestType === "access" && "Solicitar Acesso aos Dados"}
                  {dataRequestType === "correction" && "Solicitar Correção de Dados"}
                  {dataRequestType === "portability" && "Solicitar Portabilidade de Dados"}
                  {dataRequestType === "deletion" && "Solicitar Exclusão de Dados"}
                </h3>
                <button
                  onClick={() => {
                    setShowDataRequest(false);
                    setDataRequestType(null);
                    setDataRequestReason("");
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {dataRequestType === "deletion" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Atenção: Esta ação é irreversível
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    A exclusão de dados inclui todas as informações biométricas, registros de presença
                    e dados comportamentais. O aluno passará a ter presença registrada manualmente.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo da Solicitação *
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  placeholder="Descreva o motivo da sua solicitação..."
                  value={dataRequestReason}
                  onChange={(e) => setDataRequestReason(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Prazo de resposta:</strong> Até 15 dias úteis conforme Art. 18 da LGPD.
                  Você receberá uma notificação por email quando a solicitação for processada.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDataRequest(false);
                    setDataRequestType(null);
                    setDataRequestReason("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitDataRequest}
                  disabled={submittingRequest || !dataRequestReason.trim()}
                  className={dataRequestType === "deletion" ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Solicitação"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* DPO Contact */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Encarregado de Proteção de Dados (DPO)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Para dúvidas sobre privacidade e proteção de dados, entre em contato com nosso DPO:
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong>{" "}
                    <a href="mailto:dpo@aquilapro.com.br" className="text-blue-600 hover:underline">
                      dpo@aquilapro.com.br
                    </a>
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Telefone:</strong> (61) 99962-3099
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link to Full LGPD Term */}
        <div className="text-center pb-8">
          <Link href="/portal-pais/termo-lgpd">
            <Button variant="outline" className="text-blue-600 border-blue-200">
              <FileText className="w-4 h-4 mr-2" />
              Ver Termo LGPD Completo
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            Sistema Áquila Pro - Portal dos Pais | Privacidade e LGPD
          </p>
        </div>
      </footer>
    </div>
  );
}
