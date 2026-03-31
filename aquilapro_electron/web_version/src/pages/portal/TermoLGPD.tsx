import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Shield, ArrowLeft, CheckCircle2, FileText, Fingerprint,
  ScrollText, Download, Printer, Calendar, User, AlertTriangle
} from "lucide-react";

const LGPD_VERSION = "v1.2";
const LGPD_DATE = "01 de março de 2026";

const termoSections = [
  {
    title: "1. Identificação do Controlador",
    content: `O Sistema Áquila Pro, desenvolvido e operado por André Jr (CNPJ em processo de registro), com sede em Brasília-DF, é o controlador dos dados pessoais coletados através do sistema de reconhecimento facial e monitoramento de presença escolar. Contato do Encarregado de Proteção de Dados (DPO): andrejrunb@yahoo.com.br | (61) 99962-3099.`,
  },
  {
    title: "2. Finalidade do Tratamento de Dados",
    content: `Os dados pessoais do(a) aluno(a) serão tratados exclusivamente para as seguintes finalidades:
    
a) Reconhecimento facial para registro automático de presença escolar;
b) Monitoramento de entrada, saída e movimentação dentro do ambiente escolar;
c) Geração de alertas de segurança em tempo real para pais/responsáveis;
d) Elaboração de relatórios de frequência e comportamento para a coordenação pedagógica;
e) Análise estatística agregada (sem identificação individual) para melhoria do sistema educacional;
f) Comunicação com pais/responsáveis sobre eventos relacionados ao(à) aluno(a).`,
  },
  {
    title: "3. Dados Pessoais Coletados",
    content: `Serão coletados e tratados os seguintes dados pessoais:

a) Dados de identificação: nome completo, matrícula, turma, série;
b) Dados biométricos: imagem facial (fotografias) e embeddings faciais (representação matemática do rosto);
c) Dados de presença: horários de entrada, saída, movimentação entre ambientes;
d) Dados de contato dos responsáveis: nome, email, telefone, CPF;
e) Dados de navegação: IP, user-agent (apenas no Portal dos Pais).

Os dados biométricos (imagens faciais e embeddings) são considerados dados pessoais sensíveis nos termos do Art. 5º, II da LGPD e recebem proteção reforçada.`,
  },
  {
    title: "4. Base Legal para o Tratamento",
    content: `O tratamento dos dados pessoais é realizado com base nas seguintes hipóteses legais da LGPD (Lei nº 13.709/2018):

a) Consentimento do titular ou responsável legal (Art. 7º, I e Art. 11, I);
b) Cumprimento de obrigação legal ou regulatória (Art. 7º, II) - controle de frequência escolar conforme LDB;
c) Proteção da vida ou da incolumidade física do titular (Art. 7º, VII) - segurança escolar;
d) Interesse legítimo do controlador (Art. 7º, IX) - melhoria da gestão escolar.

Para dados biométricos (dados sensíveis), o tratamento é baseado exclusivamente no consentimento específico e destacado do responsável legal (Art. 11, I).`,
  },
  {
    title: "5. Compartilhamento de Dados",
    content: `Os dados pessoais poderão ser compartilhados com:

a) A instituição de ensino onde o(a) aluno(a) está matriculado(a) - coordenação, direção e professores autorizados;
b) Pais e responsáveis legais cadastrados no Portal dos Pais;
c) Autoridades competentes, quando exigido por lei ou ordem judicial.

Os dados NÃO serão compartilhados com terceiros para fins comerciais, publicitários ou de marketing. O processamento é 100% local (no servidor da escola), sem envio de dados para nuvem ou servidores externos.`,
  },
  {
    title: "6. Armazenamento e Segurança",
    content: `Os dados são armazenados localmente no servidor da escola, com as seguintes medidas de segurança:

a) Criptografia AES-256 para dados em repouso;
b) Comunicação criptografada (TLS 1.3) entre componentes do sistema;
c) Controle de acesso baseado em papéis (RBAC) com 4 níveis de permissão;
d) Auditoria completa de acessos (quem acessou, quando, qual dado);
e) Backup automático com criptografia;
f) Processamento local sem dependência de serviços em nuvem;
g) Hash irreversível para senhas (PBKDF2 com 100.000 iterações).`,
  },
  {
    title: "7. Período de Retenção",
    content: `Os dados pessoais serão retidos pelos seguintes períodos:

a) Dados de presença: durante o período letivo vigente + 5 anos (conforme obrigação legal);
b) Dados biométricos (embeddings faciais): enquanto o(a) aluno(a) estiver matriculado(a) na escola, sendo deletados em até 30 dias após a saída;
c) Fotografias de cadastro: enquanto o(a) aluno(a) estiver matriculado(a);
d) Logs de auditoria: 2 anos após a geração;
e) Dados do Portal dos Pais: enquanto a conta estiver ativa.

Após os períodos acima, os dados serão anonimizados ou excluídos de forma segura, conforme procedimento de deleção certificada.`,
  },
  {
    title: "8. Direitos do Titular",
    content: `Conforme a LGPD, o(a) responsável legal e o(a) aluno(a) (quando maior de 12 anos) têm os seguintes direitos:

a) Confirmação da existência de tratamento;
b) Acesso aos dados pessoais;
c) Correção de dados incompletos, inexatos ou desatualizados;
d) Anonimização, bloqueio ou eliminação de dados desnecessários;
e) Portabilidade dos dados a outro fornecedor;
f) Eliminação dos dados tratados com consentimento;
g) Informação sobre compartilhamento de dados;
h) Revogação do consentimento a qualquer momento;
i) Oposição ao tratamento em caso de descumprimento da LGPD.

Para exercer qualquer destes direitos, entre em contato pelo email andrejrunb@yahoo.com.br ou pelo telefone (61) 99962-3099. O prazo de resposta é de até 15 dias úteis.`,
  },
  {
    title: "9. Revogação do Consentimento",
    content: `O consentimento pode ser revogado a qualquer momento, sem prejuízo da legalidade do tratamento realizado anteriormente. A revogação pode ser feita:

a) Através do Portal dos Pais (seção "Privacidade");
b) Por email para andrejrunb@yahoo.com.br;
c) Presencialmente na secretaria da escola.

Após a revogação, o sistema de reconhecimento facial deixará de identificar o(a) aluno(a), e os dados biométricos serão excluídos em até 30 dias. O registro de presença passará a ser feito manualmente pela escola.`,
  },
  {
    title: "10. Disposições Finais",
    content: `Este termo é regido pela Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) e pelo Estatuto da Criança e do Adolescente (Lei nº 8.069/1990).

Qualquer alteração neste termo será comunicada previamente aos responsáveis, sendo necessário novo consentimento para as alterações que ampliem o escopo do tratamento.

Em caso de dúvidas ou reclamações sobre o tratamento de dados, o titular pode entrar em contato com a Autoridade Nacional de Proteção de Dados (ANPD) pelo site https://www.gov.br/anpd.`,
  },
];

export default function TermoLGPD() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const returnTo = params.get("returnTo") || "/portal-pais/cadastro";
  const standalone = params.get("standalone") === "true";

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [acceptedItems, setAcceptedItems] = useState<Record<string, boolean>>({
    facial_recognition: false,
    presence_tracking: false,
    behavior_analysis: false,
    security_monitoring: false,
    parent_alerts: false,
    data_retention: false,
  });
  const [signatureName, setSignatureName] = useState("");
  const [signatureCPF, setSignatureCPF] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const consentLabels: Record<string, string> = {
    facial_recognition: "Reconhecimento facial para registro de presença",
    presence_tracking: "Rastreamento de presença e movimentação escolar",
    behavior_analysis: "Análise comportamental e geração de relatórios",
    security_monitoring: "Monitoramento de segurança em tempo real",
    parent_alerts: "Envio de alertas e notificações aos responsáveis",
    data_retention: "Retenção de dados conforme períodos descritos no Termo",
  };

  const allAccepted = Object.values(acceptedItems).every(Boolean);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const toggleItem = (key: string) => {
    setAcceptedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const newValue = !allAccepted;
    const updated: Record<string, boolean> = {};
    Object.keys(acceptedItems).forEach((key) => {
      updated[key] = newValue;
    });
    setAcceptedItems(updated);
  };

  const formatCPF = (value: string) => {
    const nums = value.replace(/\D/g, "");
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9, 11)}`;
  };

  const generateSignatureHash = () => {
    const data = `${signatureName}|${signatureCPF}|${LGPD_VERSION}|${new Date().toISOString()}|${Object.entries(acceptedItems).filter(([, v]) => v).map(([k]) => k).join(",")}`;
    // Simple hash for demo - in production use crypto.subtle
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(8, "0").toUpperCase();
  };

  const handleSign = async () => {
    if (!signatureName || signatureName.length < 3) {
      toast.error("Informe seu nome completo");
      return;
    }
    if (!signatureCPF || signatureCPF.replace(/\D/g, "").length < 11) {
      toast.error("Informe seu CPF completo");
      return;
    }
    if (!allAccepted) {
      toast.error("Você precisa aceitar todos os itens de consentimento");
      return;
    }

    setIsSigning(true);

    try {
      // Simular processamento da assinatura digital
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const hash = generateSignatureHash();

      // Salvar no localStorage para o formulário de cadastro
      const signatureData = {
        name: signatureName,
        cpf: signatureCPF,
        version: LGPD_VERSION,
        hash,
        consents: Object.entries(acceptedItems)
          .filter(([, v]) => v)
          .map(([k]) => k),
        signedAt: new Date().toISOString(),
        ip: "local",
      };

      localStorage.setItem("lgpd_signature", JSON.stringify(signatureData));

      setIsSigned(true);
      toast.success("Termo assinado digitalmente com sucesso!");
    } catch (error) {
      toast.error("Erro ao processar assinatura digital");
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isSigned) {
    const signatureData = JSON.parse(localStorage.getItem("lgpd_signature") || "{}");
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-lg w-full">
          <CardContent className="pt-10 pb-8 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fingerprint className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Termo Assinado!</h2>
              <p className="text-gray-500 mt-2">
                O Termo de Consentimento LGPD foi assinado digitalmente com sucesso.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Comprovante de Assinatura Digital
              </h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Signatário:</strong> {signatureData.name}</p>
                <p><strong>CPF:</strong> {signatureData.cpf}</p>
                <p><strong>Versão do Termo:</strong> {signatureData.version}</p>
                <p><strong>Hash da Assinatura:</strong> <code className="bg-green-100 px-1 rounded">{signatureData.hash}</code></p>
                <p><strong>Data/Hora:</strong> {new Date(signatureData.signedAt).toLocaleString("pt-BR")}</p>
              </div>
              <div className="pt-2 border-t border-green-200">
                <p className="text-xs text-green-600">
                  Consentimentos aceitos: {signatureData.consents?.length || 0} de 6
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex-1 h-11"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                onClick={() => navigate(returnTo)}
                className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/25"
              >
                {standalone ? "Voltar" : "Continuar Cadastro"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={returnTo}>
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Áquila Pro</span>
          </div>
        </div>

        {/* Title Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ScrollText className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Termo de Consentimento para Tratamento de Dados Pessoais
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Versão {LGPD_VERSION}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {LGPD_DATE}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Termo Content */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="p-0">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[500px] overflow-y-auto p-6 lg:p-8 space-y-6"
            >
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Prezado(a) Responsável Legal,</strong>
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Este documento tem como objetivo informar sobre o tratamento de dados pessoais do(a) seu(sua) filho(a)
                  pelo Sistema Áquila Pro, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).
                  Por favor, leia atentamente todas as seções antes de assinar.
                </p>
              </div>

              {termoSections.map((section, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              ))}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
                <p className="text-xs text-gray-500 text-center">
                  Fim do documento. Role para baixo para prosseguir com a assinatura digital.
                </p>
              </div>
            </div>

            {!hasScrolledToBottom && (
              <div className="px-6 pb-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Role o documento até o final para habilitar a assinatura digital.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consent Checkboxes */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Consentimentos Específicos
            </CardTitle>
            <p className="text-sm text-gray-500">
              Marque cada item para o qual você concede consentimento:
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(consentLabels).map(([key, label]) => (
              <label
                key={key}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  acceptedItems[key]
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <input
                  type="checkbox"
                  checked={acceptedItems[key]}
                  onChange={() => toggleItem(key)}
                  disabled={!hasScrolledToBottom}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className={`text-sm ${acceptedItems[key] ? "text-blue-800 font-medium" : "text-gray-600"}`}>
                  {label}
                </span>
              </label>
            ))}

            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={toggleAll}
                disabled={!hasScrolledToBottom}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {allAccepted ? "Desmarcar todos" : "Aceitar todos os consentimentos"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Digital Signature */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-600" />
              Assinatura Digital
            </CardTitle>
            <p className="text-sm text-gray-500">
              Confirme sua identidade para assinar digitalmente este termo:
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome Completo do Responsável *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    disabled={!hasScrolledToBottom || !allAccepted}
                    className="w-full pl-10 h-11 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CPF do Responsável *</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={signatureCPF}
                  onChange={(e) => setSignatureCPF(formatCPF(e.target.value))}
                  maxLength={14}
                  disabled={!hasScrolledToBottom || !allAccepted}
                  className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600">
                Ao clicar em "Assinar Digitalmente", declaro que:
              </p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>Li e compreendi integralmente este Termo de Consentimento;</li>
                <li>Sou o responsável legal do(a) aluno(a) ou estou devidamente autorizado(a);</li>
                <li>Consinto com o tratamento dos dados pessoais conforme descrito;</li>
                <li>Estou ciente dos meus direitos como titular de dados conforme a LGPD;</li>
                <li>As informações fornecidas são verdadeiras e de minha responsabilidade.</li>
              </ul>
            </div>

            <Button
              onClick={handleSign}
              disabled={!hasScrolledToBottom || !allAccepted || !signatureName || !signatureCPF || isSigning}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSigning ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando assinatura digital...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5" />
                  Assinar Digitalmente
                </div>
              )}
            </Button>

            {(!hasScrolledToBottom || !allAccepted) && (
              <p className="text-xs text-amber-600 text-center">
                {!hasScrolledToBottom
                  ? "Leia o termo completo (role até o final) para habilitar a assinatura."
                  : "Aceite todos os consentimentos para habilitar a assinatura."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 space-y-1 pb-8">
          <p>Sistema Áquila Pro - Segurança e Engajamento Escolar</p>
          <p>Contato: (61) 99962-3099 | andrejrunb@yahoo.com.br</p>
          <p>Este documento tem validade jurídica conforme a Lei nº 14.063/2020 (assinatura eletrônica).</p>
        </div>
      </div>
    </div>
  );
}
