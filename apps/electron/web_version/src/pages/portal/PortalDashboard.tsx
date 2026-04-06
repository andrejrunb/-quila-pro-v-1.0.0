import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Shield, LogOut, User, Bell, BarChart3, GraduationCap,
  Clock, CheckCircle2, XCircle, AlertTriangle, Calendar,
  ChevronRight, Settings, Link2, Eye, TrendingUp, Home,
  BookOpen, MapPin
} from "lucide-react";

export default function PortalDashboard() {
  const [, navigate] = useLocation();
  const [token] = useState(() => localStorage.getItem("parentToken") || "");
  const [parentData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("parentData") || "{}");
    } catch {
      return {};
    }
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [linkStudentCode, setLinkStudentCode] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!token) {
      navigate("/portal-pais/login");
    }
  }, [token, navigate]);

  // Queries
  const meQuery = trpc.parentPortal.me.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const studentsQuery = trpc.parentPortal.myStudents.useQuery(
    { token },
    { enabled: !!token }
  );

  const notificationsQuery = trpc.parentPortal.myNotifications.useQuery(
    { token, limit: 10, unreadOnly: false },
    { enabled: !!token }
  );

  const unreadNotificationsQuery = trpc.parentPortal.myNotifications.useQuery(
    { token, limit: 50, unreadOnly: true },
    { enabled: !!token }
  );

  // Mutations
  const logoutMutation = trpc.parentPortal.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem("parentToken");
      localStorage.removeItem("parentData");
      toast.success("Logout realizado com sucesso");
      navigate("/portal-pais/login");
    },
  });

  const linkStudentMutation = trpc.parentPortal.linkStudent.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setLinkStudentCode("");
      studentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const markReadMutation = trpc.parentPortal.markNotificationRead.useMutation({
    onSuccess: () => {
      notificationsQuery.refetch();
      unreadNotificationsQuery.refetch();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate({ token });
  };

  const handleLinkStudent = () => {
    if (!linkStudentCode.trim()) {
      toast.error("Informe o código de matrícula");
      return;
    }
    linkStudentMutation.mutate({ token, studentCode: linkStudentCode });
  };

  const handleMarkRead = (notificationId: number) => {
    markReadMutation.mutate({ token, notificationId });
  };

  const unreadCount = unreadNotificationsQuery.data?.length || 0;
  const studentsList = studentsQuery.data || [];
  const notifications = notificationsQuery.data || [];

  const parent = meQuery.data || parentData;

  const relationshipLabels: Record<string, string> = {
    father: "Pai",
    mother: "Mãe",
    guardian: "Responsável",
    grandparent: "Avô/Avó",
    other: "Outro",
  };

  const notificationTypeLabels: Record<string, { label: string; color: string; icon: typeof Bell }> = {
    attendance: { label: "Presença", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    absence: { label: "Ausência", color: "bg-red-100 text-red-700", icon: XCircle },
    late_arrival: { label: "Atraso", color: "bg-orange-100 text-orange-700", icon: Clock },
    early_exit: { label: "Saída Antecipada", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
    behavior: { label: "Comportamento", color: "bg-purple-100 text-purple-700", icon: User },
    security: { label: "Segurança", color: "bg-red-100 text-red-700", icon: Shield },
    report: { label: "Relatório", color: "bg-blue-100 text-blue-700", icon: BarChart3 },
    system: { label: "Sistema", color: "bg-gray-100 text-gray-700", icon: Settings },
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Portal dos Pais</h1>
                <p className="text-xs text-gray-500">Áquila Pro</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications Bell */}
              <button
                onClick={() => setActiveTab("notifications")}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{parent.name}</p>
                  <p className="text-xs text-gray-500">
                    {relationshipLabels[parent.relationship] || "Responsável"}
                  </p>
                </div>
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Olá, {parent.name?.split(" ")[0] || "Responsável"}!
              </h2>
              <p className="text-blue-100 mt-1">
                {studentsList.length > 0
                  ? `Acompanhando ${studentsList.length} aluno(s)`
                  : "Vincule seus filhos para começar a acompanhar"}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/15 rounded-lg px-4 py-2 backdrop-blur-sm">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border border-gray-200 p-1 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Meus Filhos
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 relative">
              <Bell className="w-4 h-4" />
              Notificações
              {unreadCount > 0 && (
                <span className="ml-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{studentsList.length}</p>
                      <p className="text-xs text-gray-500">Filhos Vinculados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {studentsList.length > 0 ? "95%" : "--"}
                      </p>
                      <p className="text-xs text-gray-500">Frequência Média</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                      <p className="text-xs text-gray-500">Alertas Não Lidos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {studentsList.length > 0 ? "Bom" : "--"}
                      </p>
                      <p className="text-xs text-gray-500">Engajamento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Students Cards */}
            {studentsList.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Seus Filhos Hoje</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {studentsList.map((student: any) => (
                    <Card key={student.studentId} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {student.studentName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{student.studentName}</h4>
                              <p className="text-sm text-gray-500">
                                {student.className} - {student.grade}
                              </p>
                              <p className="text-xs text-gray-400">
                                Matrícula: {student.studentCode}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Presente
                          </Badge>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900">07:15</p>
                            <p className="text-xs text-gray-500">Entrada</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900">4/5</p>
                            <p className="text-xs text-gray-500">Aulas</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded-lg">
                            <p className="text-sm font-semibold text-gray-900">96%</p>
                            <p className="text-xs text-gray-500">Frequência</p>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Ver Detalhes
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-xs">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Relatórios
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Link2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Vincule seus filhos
                  </h3>
                  <p className="text-gray-500 mb-4 max-w-md mx-auto">
                    Para acompanhar a presença e receber alertas, vincule seus filhos usando o código de matrícula fornecido pela escola.
                  </p>
                  <div className="flex gap-2 max-w-sm mx-auto">
                    <Input
                      placeholder="Código de matrícula"
                      value={linkStudentCode}
                      onChange={(e) => setLinkStudentCode(e.target.value)}
                      className="h-10"
                    />
                    <Button
                      onClick={handleLinkStudent}
                      disabled={linkStudentMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {linkStudentMutation.isPending ? "..." : "Vincular"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Notifications */}
            {notifications.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notificações Recentes</h3>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Ver todas <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notif: any) => {
                    const typeInfo = notificationTypeLabels[notif.notificationType] || notificationTypeLabels.system;
                    const Icon = typeInfo.icon;
                    return (
                      <Card
                        key={notif.id}
                        className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                          !notif.isRead ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{notif.title}</h4>
                              {!notif.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notif.message}</p>
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Meus Filhos</h3>
            </div>

            {/* Link Student Form */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-blue-600" />
                  Vincular Novo Aluno
                </CardTitle>
                <CardDescription>
                  Informe o código de matrícula fornecido pela escola
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Código de matrícula (ex: 2024001)"
                    value={linkStudentCode}
                    onChange={(e) => setLinkStudentCode(e.target.value)}
                    className="h-10"
                  />
                  <Button
                    onClick={handleLinkStudent}
                    disabled={linkStudentMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {linkStudentMutation.isPending ? "Vinculando..." : "Vincular"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Students List */}
            {studentsList.length > 0 ? (
              <div className="space-y-4">
                {studentsList.map((student: any) => (
                  <Card key={student.studentId} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                          {student.studentName?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">{student.studentName}</h4>
                              <p className="text-sm text-gray-500">
                                {student.className} - {student.grade}
                              </p>
                            </div>
                            <Badge className="bg-green-100 text-green-700 border-0">
                              Ativo
                            </Badge>
                          </div>

                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500">Matrícula</p>
                              <p className="text-sm font-semibold text-gray-900">{student.studentCode}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500">Parentesco</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {relationshipLabels[student.relationship] || "Responsável"}
                              </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500">Alertas</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.canReceiveAlerts ? "Ativados" : "Desativados"}
                              </p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500">Relatórios</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {student.canViewReports ? "Liberados" : "Bloqueados"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Presença Hoje
                            </Button>
                            <Button variant="outline" size="sm">
                              <BarChart3 className="w-4 h-4 mr-1" />
                              Histórico
                            </Button>
                            <Button variant="outline" size="sm">
                              <BookOpen className="w-4 h-4 mr-1" />
                              Relatório Bimestral
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum aluno vinculado
                  </h3>
                  <p className="text-gray-500">
                    Use o formulário acima para vincular seus filhos pelo código de matrícula.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red-100 text-red-700 border-0">
                  {unreadCount} não lida(s)
                </Badge>
              )}
            </div>

            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notif: any) => {
                  const typeInfo = notificationTypeLabels[notif.notificationType] || notificationTypeLabels.system;
                  const Icon = typeInfo.icon;
                  return (
                    <Card
                      key={notif.id}
                      className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-all ${
                        !notif.isRead ? "bg-blue-50/50 border-l-4 border-l-blue-500" : ""
                      }`}
                      onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{notif.title}</h4>
                                <Badge variant="outline" className={`text-xs ${typeInfo.color} border-0`}>
                                  {typeInfo.label}
                                </Badge>
                              </div>
                              <span className="text-xs text-gray-400">
                                {new Date(notif.createdAt).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            {notif.severity === "critical" && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="w-3 h-3" />
                                Alerta Crítico
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma notificação
                  </h3>
                  <p className="text-gray-500">
                    Você receberá notificações sobre presença, alertas e relatórios dos seus filhos.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Configurações da Conta</h3>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nome</label>
                    <Input value={parent.name || ""} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input value={parent.email || ""} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Telefone</label>
                    <Input value={parent.phone || ""} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Parentesco</label>
                    <Input
                      value={relationshipLabels[parent.relationship] || "Responsável"}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Para alterar seus dados, entre em contato com a escola.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  Preferências de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Entrada na escola", desc: "Receber alerta quando seu filho entrar na escola" },
                  { label: "Saída da escola", desc: "Receber alerta quando seu filho sair da escola" },
                  { label: "Ausência", desc: "Receber alerta de ausência em aulas" },
                  { label: "Atraso", desc: "Receber alerta de chegada atrasada" },
                  { label: "Relatórios semanais", desc: "Receber resumo semanal de presença" },
                ].map((pref, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                      <p className="text-xs text-gray-500">{pref.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-green-100">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  Privacidade e LGPD
                </CardTitle>
                <CardDescription>
                  Gerencie seus consentimentos de dados e exerça seus direitos como titular.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/portal-pais/lgpd">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Shield className="w-4 h-4 mr-2" />
                    Gerenciar Consentimentos LGPD
                  </Button>
                </Link>
                <p className="text-xs text-gray-400">
                  Visualize, conceda ou revogue consentimentos de coleta de dados, solicite acesso, correção, portabilidade ou exclusão de dados.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm border-red-100">
              <CardHeader>
                <CardTitle className="text-base text-red-600">Zona de Perigo</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/portal-pais/lgpd">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Solicitar Exclusão de Dados (LGPD)
                  </Button>
                </Link>
                <p className="text-xs text-gray-400 mt-2">
                  Conforme a LGPD, você pode solicitar a exclusão dos seus dados pessoais a qualquer momento.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            Sistema Áquila Pro - Portal dos Pais | Contato: (61) 99962-3099 | andrejrunb@yahoo.com.br
          </p>
        </div>
      </footer>
    </div>
  );
}
