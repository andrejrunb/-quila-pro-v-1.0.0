import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Shield, ArrowLeft, ArrowRight, User, Mail, Phone, Lock,
  Eye, EyeOff, CheckCircle2, GraduationCap, FileText
} from "lucide-react";

type Step = 1 | 2 | 3;

export default function PortalCadastro() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [lgpdSigned, setLgpdSigned] = useState(false);
  const [lgpdHash, setLgpdHash] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    password: "",
    confirmPassword: "",
    relationship: "guardian" as "father" | "mother" | "guardian" | "grandparent" | "other",
    schoolId: 1,
    studentCode: "",
  });

  // Verificar se o Termo LGPD foi assinado (ao voltar da página do termo)
  useEffect(() => {
    const signature = localStorage.getItem("lgpd_signature");
    if (signature) {
      try {
        const data = JSON.parse(signature);
        if (data.hash && data.signedAt) {
          setLgpdSigned(true);
          setLgpdHash(data.hash);
          setAcceptedTerms(true);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const registerMutation = trpc.parentPortal.register.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setStep(3);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar");
    },
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const formatPhone = (value: string) => {
    const nums = value.replace(/\D/g, "");
    if (nums.length <= 2) return `(${nums}`;
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
  };

  const formatCPF = (value: string) => {
    const nums = value.replace(/\D/g, "");
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9, 11)}`;
  };

  const validateStep1 = () => {
    if (!formData.name || formData.name.length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres");
      return false;
    }
    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Email inválido");
      return false;
    }
    if (!formData.phone || formData.phone.replace(/\D/g, "").length < 10) {
      toast.error("Telefone deve ter pelo menos 10 dígitos");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.password || formData.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return false;
    }
    if (!acceptedTerms && !lgpdSigned) {
      toast.error("Você precisa aceitar os termos de uso e assinar o Termo LGPD");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      await registerMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        cpf: formData.cpf ? formData.cpf.replace(/\D/g, "") : undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        relationship: formData.relationship,
        schoolId: formData.schoolId,
        studentCode: formData.studentCode || undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = formData.password;
    if (!p) return { level: 0, text: "", color: "" };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 1) return { level: 1, text: "Fraca", color: "bg-red-500" };
    if (score <= 2) return { level: 2, text: "Razoável", color: "bg-orange-500" };
    if (score <= 3) return { level: 3, text: "Boa", color: "bg-yellow-500" };
    if (score <= 4) return { level: 4, text: "Forte", color: "bg-green-500" };
    return { level: 5, text: "Muito Forte", color: "bg-emerald-500" };
  };

  const strength = passwordStrength();

  const relationshipLabels: Record<string, string> = {
    father: "Pai",
    mother: "Mãe",
    guardian: "Responsável Legal",
    grandparent: "Avô/Avó",
    other: "Outro",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/portal-pais/login">
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-700">Áquila Pro</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  s < step
                    ? "bg-green-500 text-white"
                    : s === step
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                    s < step ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between text-xs text-gray-500 mb-6 px-1">
          <span className={step >= 1 ? "text-blue-600 font-medium" : ""}>Dados Pessoais</span>
          <span className={step >= 2 ? "text-blue-600 font-medium" : ""}>Segurança</span>
          <span className={step >= 3 ? "text-green-600 font-medium" : ""}>Concluído</span>
        </div>

        {/* Step 1: Dados Pessoais */}
        {step === 1 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Preencha seus dados para criar sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nome Completo *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Telefone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="(61) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => updateField("phone", formatPhone(e.target.value))}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">CPF</label>
                  <Input
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => updateField("cpf", formatCPF(e.target.value))}
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                    maxLength={14}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Parentesco *</label>
                <Select
                  value={formData.relationship}
                  onValueChange={(v) => updateField("relationship", v)}
                >
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                    <SelectValue placeholder="Selecione o parentesco" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(relationshipLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Código de Matrícula do Aluno
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Ex: 2024001 (opcional, pode vincular depois)"
                    value={formData.studentCode}
                    onChange={(e) => updateField("studentCode", e.target.value)}
                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Informe o código de matrícula para vincular automaticamente ao aluno
                </p>
              </div>

              <Button
                onClick={handleNext}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Segurança */}
        {step === 2 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>Defina uma senha segura para sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i <= strength.level ? strength.color : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Força da senha: <span className="font-medium">{strength.text}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirmar Senha *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita a senha"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500">As senhas não coincidem</p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Senhas coincidem
                    </p>
                  )}
                </div>

                {/* Termos LGPD */}
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  {lgpdSigned ? (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <div className="text-sm text-green-700">
                        <p className="font-medium">Termo LGPD assinado digitalmente</p>
                        <p className="text-xs text-green-600 mt-1">
                          Hash: <code className="bg-green-100 px-1 rounded">{lgpdHash}</code>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="text-sm text-gray-600">
                          <p>
                            Li e aceito os{" "}
                            <Link href="/portal-pais/termo-lgpd?returnTo=/portal-pais/cadastro">
                              <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                                Termos de Uso, Política de Privacidade e Termo LGPD
                              </span>
                            </Link>{" "}
                            do Sistema Áquila Pro, incluindo o tratamento de dados pessoais e biométricos conforme a LGPD.
                          </p>
                        </div>
                      </div>
                      <Link href="/portal-pais/termo-lgpd?returnTo=/portal-pais/cadastro">
                        <button className="w-full mt-2 py-2 px-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium transition-colors flex items-center justify-center gap-2">
                          <FileText className="w-4 h-4" />
                          Ler e Assinar Termo LGPD (Assinatura Digital)
                        </button>
                      </Link>
                    </>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FileText className="w-3 h-3" />
                    <span>Seus dados são protegidos pela Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 h-11"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/25"
                    disabled={isLoading || !acceptedTerms}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Cadastrando...
                      </div>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Sucesso */}
        {step === 3 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm text-center">
            <CardContent className="pt-10 pb-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Cadastro Realizado!</h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Sua conta foi criada com sucesso. Agora você pode acessar o Portal dos Pais e acompanhar a vida escolar do seu filho.
                </p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg text-left space-y-2">
                <h3 className="text-sm font-semibold text-blue-800">Próximos Passos:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    Faça login com seu email e senha
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    Vincule seus filhos pelo código de matrícula
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    Configure suas preferências de notificação
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => navigate("/portal-pais/login")}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/25"
              >
                Ir para o Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Contato: (61) 99962-3099 | andrejrunb@yahoo.com.br
        </p>
      </div>
    </div>
  );
}
