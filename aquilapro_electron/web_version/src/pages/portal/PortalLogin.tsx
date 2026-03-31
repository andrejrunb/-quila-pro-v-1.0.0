import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, Shield, Users, Bell, BarChart3, Lock, Mail, ArrowLeft } from "lucide-react";

export default function PortalLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const loginMutation = trpc.parentPortal.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("parentToken", data.token);
      localStorage.setItem("parentData", JSON.stringify(data.parent));
      toast.success(`Bem-vindo(a), ${data.parent.name}!`);
      navigate("/portal-pais/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const resetMutation = trpc.parentPortal.requestPasswordReset.useMutation({
    onSuccess: () => {
      toast.success("Se o email existir no sistema, você receberá um link de recuperação.");
      setShowForgotPassword(false);
      setResetEmail("");
    },
    onError: () => {
      toast.error("Erro ao solicitar recuperação de senha");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    setIsLoading(true);
    try {
      await loginMutation.mutateAsync({ email, password });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Informe seu email");
      return;
    }
    await resetMutation.mutateAsync({ email: resetEmail });
  };

  const features = [
    { icon: Shield, title: "Segurança", desc: "Acompanhe a presença do seu filho em tempo real" },
    { icon: Bell, title: "Alertas", desc: "Receba notificações de entrada, saída e ausências" },
    { icon: BarChart3, title: "Relatórios", desc: "Veja relatórios detalhados de frequência" },
    { icon: Users, title: "Vínculo", desc: "Gerencie múltiplos filhos em uma única conta" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Lado Esquerdo - Informações */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Padrão decorativo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full" />
          <div className="absolute bottom-20 right-10 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 border-2 border-white rounded-full" />
        </div>

        <div className="relative z-10">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao site
            </button>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Áquila Pro</h1>
              <p className="text-sm text-white/70">Portal dos Pais</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold mt-8 leading-tight">
            Acompanhe a vida escolar do seu filho
          </h2>
          <p className="text-lg text-white/80 mt-4 max-w-md">
            Acesse informações de presença, receba alertas em tempo real e acompanhe o desempenho escolar.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <feature.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <p className="text-sm text-white/50">
            Sistema Áquila Pro - Segurança e Engajamento Escolar
          </p>
          <p className="text-xs text-white/40 mt-1">
            Contato: (61) 99962-3099 | andrejrunb@yahoo.com.br
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Link href="/">
              <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Áquila Pro</h1>
              <p className="text-xs text-gray-500">Portal dos Pais</p>
            </div>
          </div>

          {!showForgotPassword ? (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Entrar no Portal
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Acesse com seu email e senha cadastrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Senha</label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-600/25"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Entrando...
                      </div>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-500">
                    Ainda não tem conta?{" "}
                    <Link href="/portal-pais/cadastro">
                      <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                        Cadastre-se aqui
                      </span>
                    </Link>
                  </p>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 text-center">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Conexão segura com criptografia de ponta a ponta
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Recuperar Senha
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Informe seu email para receber o link de recuperação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email cadastrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={resetMutation.isPending}
                  >
                    {resetMutation.isPending ? "Enviando..." : "Enviar Link de Recuperação"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
                  >
                    Voltar ao login
                  </button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
