import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Shield, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, AlertTriangle, KeyRound
} from "lucide-react";

export default function PortalResetSenha() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetMutation = trpc.parentPortal.resetPassword.useMutation({
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Senha alterada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao redefinir senha");
    },
  });

  const passwordStrength = () => {
    const p = newPassword;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    await resetMutation.mutateAsync({
      token,
      newPassword,
      confirmPassword,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-md w-full">
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Link Inválido</h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                O link de recuperação de senha é inválido ou está incompleto. Por favor, solicite um novo link.
              </p>
            </div>
            <Button
              onClick={() => navigate("/portal-pais/login")}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm max-w-md w-full">
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Senha Alterada!</h2>
              <p className="text-gray-500 max-w-sm mx-auto">
                Sua senha foi redefinida com sucesso. Agora você pode fazer login com a nova senha.
              </p>
            </div>
            <Button
              onClick={() => navigate("/portal-pais/login")}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/25"
            >
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-7 h-7 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 text-center">
              Redefinir Senha
            </CardTitle>
            <CardDescription className="text-gray-500 text-center">
              Escolha uma nova senha segura para sua conta no Portal dos Pais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    required
                    minLength={6}
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
                {newPassword && (
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
                <label className="text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">As senhas não coincidem</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Senhas coincidem
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-700">
                    <p className="font-medium mb-1">Dicas para uma senha segura:</p>
                    <ul className="space-y-0.5 list-disc list-inside">
                      <li>Use pelo menos 8 caracteres</li>
                      <li>Inclua letras maiúsculas e minúsculas</li>
                      <li>Adicione números e caracteres especiais</li>
                      <li>Evite informações pessoais (nome, data de nascimento)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-600/25"
                disabled={resetMutation.isPending || !newPassword || !confirmPassword}
              >
                {resetMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Redefinindo...
                  </div>
                ) : (
                  "Redefinir Senha"
                )}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 text-center">
                <Lock className="w-3 h-3 inline mr-1" />
                Conexão segura com criptografia de ponta a ponta
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Contato: (61) 99962-3099 | andrejrunb@yahoo.com.br
        </p>
      </div>
    </div>
  );
}
