import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, MessageCircle, BarChart3, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function TemplatesPanel() {
  const [activeTab, setActiveTab] = useState("sms");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    variables: "",
  });

  const smsTemplates = [
    {
      id: 1,
      name: "Saída não autorizada",
      alertType: "unauthorized_exit",
      content: "⚠️ ALERTA: {studentName} saiu da escola sem autorização às {time}. Contate a escola imediatamente.",
      isActive: 1,
    },
    {
      id: 2,
      name: "Atraso na chegada",
      alertType: "late_arrival",
      content: "ℹ️ Seu filho {studentName} chegou atrasado na escola hoje.",
      isActive: 1,
    },
    {
      id: 3,
      name: "Ausência",
      alertType: "absence",
      content: "⚠️ {studentName} não foi marcado presente na escola hoje.",
      isActive: 1,
    },
  ];

  const whatsappTemplates = [
    {
      id: 1,
      name: "Confirmação de presença",
      notificationType: "attendance_confirmation",
      content: "✅ Presença confirmada: {studentName} chegou na escola às {time}. Tenha um ótimo dia!",
      isActive: 1,
    },