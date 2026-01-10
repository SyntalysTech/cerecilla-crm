"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Settings,
  Send,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Phone,
  FileText,
  BarChart3,
  Megaphone,
  Plus,
  Save,
  X,
  Inbox,
  ArrowLeft,
  User,
} from "lucide-react";
import {
  updateWhatsAppConfig,
  testWhatsAppConnection,
  createWhatsAppCampaign,
  startWhatsAppCampaign,
  sendTestWhatsAppMessage,
  getWhatsAppConversations,
  getConversationMessages,
  markConversationAsRead,
  replyToConversation,
  type WhatsAppConfigData,
  type WhatsAppTemplate,
  type WhatsAppMessage,
  type WhatsAppCampaign,
  type WhatsAppConversation,
} from "./actions";

interface Props {
  initialConfig: WhatsAppConfigData | null;
  templates: WhatsAppTemplate[];
  messages: WhatsAppMessage[];
  campaigns: WhatsAppCampaign[];
  stats: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

type Tab = "overview" | "conversations" | "messages" | "campaigns" | "templates" | "settings";

export function WhatsAppClient({
  initialConfig,
  templates,
  messages,
  campaigns,
  stats,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [config, setConfig] = useState<WhatsAppConfigData | null>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    nombre: "",
    descripcion: "",
    templateId: "",
    filtroEstado: [] as string[],
  });
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [startingCampaign, setStartingCampaign] = useState<string | null>(null);

  // Test message state
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Hola! Este es un mensaje de prueba desde el CRM de Cerecilla.");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string } | null>(null);

  // Conversations state
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<WhatsAppMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const isConfigured = config?.phoneNumberId && config?.accessToken && config?.isActive;

  const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
    { id: "overview", label: "Resumen", icon: BarChart3 },
    { id: "conversations", label: "Conversaciones", icon: Inbox },
    { id: "messages", label: "Mensajes", icon: MessageSquare },
    { id: "campaigns", label: "Campañas", icon: Megaphone },
    { id: "templates", label: "Plantillas", icon: FileText },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  // Load conversations when tab is selected
  useEffect(() => {
    if (activeTab === "conversations") {
      loadConversations();
    }
  }, [activeTab]);

  async function loadConversations() {
    setLoadingConversations(true);
    const convs = await getWhatsAppConversations();
    setConversations(convs);
    setLoadingConversations(false);
  }

  async function handleSelectConversation(phoneNumber: string) {
    setSelectedConversation(phoneNumber);
    setLoadingMessages(true);

    // Mark as read
    await markConversationAsRead(phoneNumber);

    // Load messages
    const msgs = await getConversationMessages(phoneNumber);
    setConversationMessages(msgs);
    setLoadingMessages(false);

    // Update unread count in conversations list
    setConversations(prev =>
      prev.map(c => c.phoneNumber === phoneNumber ? { ...c, unreadCount: 0 } : c)
    );
  }

  async function handleSendReply() {
    if (!selectedConversation || !replyText.trim()) return;

    setSendingReply(true);
    const result = await replyToConversation(selectedConversation, replyText);

    if (result.error) {
      alert(result.error);
    } else {
      setReplyText("");
      // Reload messages
      const msgs = await getConversationMessages(selectedConversation);
      setConversationMessages(msgs);
    }
    setSendingReply(false);
  }

  const estados = [
    "SIN ESTADO",
    "SEGUIMIENTO",
    "PENDIENTE DOC",
    "EN TRAMITE",
    "COMISIONABLE",
    "LIQUIDADO",
    "FINALIZADO",
    "FALLIDO",
  ];

  async function handleSaveConfig() {
    if (!config) return;

    setSaving(true);
    const result = await updateWhatsAppConfig({
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      accessToken: config.accessToken,
      phoneNumber: config.phoneNumber,
      displayName: config.displayName,
      isActive: config.isActive,
    });

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      alert("Configuración guardada correctamente");
    }
    setSaving(false);
  }

  async function handleTestConnection() {
    setTesting(true);
    const result = await testWhatsAppConnection();
    if (result.success) {
      alert("Conexión exitosa");
    } else {
      alert(`Error: ${result.error}`);
    }
    setTesting(false);
  }

  async function handleCreateCampaign() {
    if (!newCampaign.nombre || !newCampaign.templateId) {
      alert("Completa el nombre y selecciona una plantilla");
      return;
    }

    setCreatingCampaign(true);
    const result = await createWhatsAppCampaign({
      nombre: newCampaign.nombre,
      descripcion: newCampaign.descripcion || undefined,
      templateId: newCampaign.templateId,
      filtroEstado: newCampaign.filtroEstado.length > 0 ? newCampaign.filtroEstado : undefined,
    });

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      setShowNewCampaign(false);
      setNewCampaign({ nombre: "", descripcion: "", templateId: "", filtroEstado: [] });
      window.location.reload();
    }
    setCreatingCampaign(false);
  }

  async function handleStartCampaign(campaignId: string) {
    if (!confirm("¿Iniciar el envío de esta campaña? Esta acción no se puede deshacer.")) return;

    setStartingCampaign(campaignId);
    const result = await startWhatsAppCampaign(campaignId);

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      alert(`Campaña completada: ${result.enviados} enviados, ${result.fallidos} fallidos`);
      window.location.reload();
    }
    setStartingCampaign(null);
  }

  async function handleSendTestMessage() {
    if (!testPhone) {
      setTestResult({ error: "Introduce un número de teléfono" });
      return;
    }
    if (!testMessage.trim()) {
      setTestResult({ error: "Introduce un mensaje" });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    const result = await sendTestWhatsAppMessage(testPhone, testMessage);

    if (result.error) {
      setTestResult({ error: result.error });
    } else {
      setTestResult({ success: true });
      setTestPhone("");
    }
    setSendingTest(false);
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      sent: "bg-blue-100 text-blue-700",
      delivered: "bg-green-100 text-green-700",
      read: "bg-purple-100 text-purple-700",
      failed: "bg-red-100 text-red-700",
      draft: "bg-gray-100 text-gray-700",
      sending: "bg-yellow-100 text-yellow-700",
      completed: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };

    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${styles[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success banner - WhatsApp is active */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-green-800">WhatsApp Business Activo</h3>
          <p className="text-sm text-green-700 mt-1">
            El numero <strong>+34 643 87 91 49</strong> esta conectado y listo para enviar mensajes.
            Configura las credenciales en la pestana <strong>Configuracion</strong> y activa el envio para empezar.
          </p>
        </div>
      </div>

      {/* Warning if not configured */}
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Configuracion pendiente</h3>
            <p className="text-sm text-amber-700 mt-1">
              Ve a la pestana <strong>Configuracion</strong>, introduce las credenciales y marca <strong>Activar envio de WhatsApp</strong> para empezar a enviar mensajes.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#BB292A] text-[#BB292A]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.delivered}</p>
                  <p className="text-xs text-gray-500">Entregados</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.read}</p>
                  <p className="text-xs text-gray-500">Leídos</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.sent}</p>
                  <p className="text-xs text-gray-500">Enviados</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
                  <p className="text-xs text-gray-500">Fallidos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab("campaigns")}
                disabled={!isConfigured}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Megaphone className="w-8 h-8 text-[#BB292A]" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Nueva Campaña</p>
                  <p className="text-sm text-gray-500">Envío masivo a clientes</p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <FileText className="w-8 h-8 text-[#BB292A]" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Ver Plantillas</p>
                  <p className="text-sm text-gray-500">Gestionar plantillas</p>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <MessageSquare className="w-8 h-8 text-[#BB292A]" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Ver Mensajes</p>
                  <p className="text-sm text-gray-500">Historial de envíos</p>
                </div>
              </button>
            </div>
          </div>

          {/* Test Message Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Enviar Mensaje de Prueba</h3>
            <p className="text-sm text-gray-500 mb-4">
              Envía un mensaje de texto a cualquier número para probar que WhatsApp funciona correctamente.
            </p>

            {testResult && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                testResult.success
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}>
                {testResult.success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Mensaje enviado correctamente</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">{testResult.error}</span>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de teléfono
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+34 600 000 000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Incluye el prefijo del país (ej: +34 para España)
                </p>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSendTestMessage}
                  disabled={sendingTest || !isConfigured}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingTest ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar Prueba
                </button>
              </div>
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Campañas Recientes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {campaigns.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.nombre}</p>
                    <p className="text-sm text-gray-500">
                      {campaign.enviados} enviados / {campaign.totalDestinatarios} destinatarios
                    </p>
                  </div>
                  <StatusBadge status={campaign.status} />
                </div>
              ))}
              {campaigns.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No hay campañas todavía
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "conversations" && (
        <div className="bg-white rounded-lg border border-gray-200 min-h-[500px]">
          {selectedConversation ? (
            // Chat view
            <div className="flex flex-col h-[600px]">
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedConversation(null);
                    setConversationMessages([]);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-md"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {conversationMessages[0]?.cliente?.nombre ||
                      conversations.find(c => c.phoneNumber === selectedConversation)?.senderName ||
                      selectedConversation}
                  </p>
                  <p className="text-sm text-gray-500">{selectedConversation}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  conversationMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "incoming" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.direction === "incoming"
                            ? "bg-white border border-gray-200"
                            : "bg-green-600 text-white"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.direction === "incoming"
                              ? "text-gray-400"
                              : "text-green-100"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "short",
                          })}
                          {msg.direction !== "incoming" && (
                            <span className="ml-2">
                              {msg.status === "read" && <Eye className="w-3 h-3 inline" />}
                              {msg.status === "delivered" && <CheckCircle className="w-3 h-3 inline" />}
                              {msg.status === "sent" && <Clock className="w-3 h-3 inline" />}
                              {msg.status === "failed" && <XCircle className="w-3 h-3 inline text-red-300" />}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {conversationMessages.length === 0 && !loadingMessages && (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No hay mensajes en esta conversacion
                  </div>
                )}
              </div>

              {/* Reply input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-green-500 focus:border-green-500"
                    disabled={sendingReply}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Conversations list
            <div>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Conversaciones</h3>
                <button
                  onClick={loadConversations}
                  disabled={loadingConversations}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingConversations ? "animate-spin" : ""}`} />
                  Actualizar
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {loadingConversations ? (
                  <div className="p-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay conversaciones todavia</p>
                    <p className="text-sm mt-1">Los mensajes recibidos aparecerán aquí</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.phoneNumber}
                      onClick={() => handleSelectConversation(conv.phoneNumber)}
                      className="w-full p-4 hover:bg-gray-50 flex items-center gap-3 text-left"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900 truncate">
                            {conv.clienteNombre || conv.senderName || conv.phoneNumber}
                          </p>
                          <span className="text-xs text-gray-500">
                            {new Date(conv.lastMessageAt).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.phoneNumber}</p>
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-medium text-gray-900" : "text-gray-500"}`}>
                          {conv.direction === "outgoing" && <span className="text-gray-400">Tu: </span>}
                          {conv.lastMessage}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "messages" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Mensajes Enviados</h3>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plantilla</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-900">
                            {msg.cliente?.nombre || msg.phoneNumber}
                          </p>
                          <p className="text-xs text-gray-500">{msg.phoneNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900">{msg.templateName || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={msg.status} />
                      {msg.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{msg.errorMessage}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {new Date(msg.createdAt).toLocaleString("es-ES")}
                      </span>
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No hay mensajes todavía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewCampaign(true)}
              disabled={!isConfigured}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Nueva Campaña
            </button>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Campañas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatarios</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{campaign.nombre}</p>
                        {campaign.descripcion && (
                          <p className="text-xs text-gray-500">{campaign.descripcion}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{campaign.totalDestinatarios}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">
                          <p className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {campaign.enviados} enviados
                          </p>
                          <p className="flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-500" />
                            {campaign.fallidos} fallidos
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {new Date(campaign.createdAt).toLocaleDateString("es-ES")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {campaign.status === "draft" && (
                          <button
                            onClick={() => handleStartCampaign(campaign.id)}
                            disabled={startingCampaign === campaign.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                          >
                            {startingCampaign === campaign.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            Iniciar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No hay campañas todavía
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Plantillas de Mensajes</h3>
            <p className="text-sm text-gray-500 mt-1">
              Las plantillas deben ser aprobadas por Meta antes de poder usarlas.
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div key={template.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{template.templateName}</p>
                      <StatusBadge status={template.status} />
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                      {template.bodyText}
                    </p>
                    {template.bodyVariables.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Variables: {template.bodyVariables.join(", ")}
                      </p>
                    )}
                    {template.footerText && (
                      <p className="text-xs text-gray-400 mt-1">
                        Pie: {template.footerText}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No hay plantillas configuradas
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de WhatsApp Business API</h3>
          <p className="text-sm text-gray-500 mb-6">
            Introduce las credenciales de tu cuenta de WhatsApp Business Cloud API.
            Puedes obtenerlas en{" "}
            <a
              href="https://developers.facebook.com/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#BB292A] hover:underline"
            >
              Meta for Developers
            </a>
            .
          </p>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                value={config?.phoneNumberId || ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev!, phoneNumberId: e.target.value }))
                }
                placeholder="Ej: 123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID del número de teléfono de WhatsApp Business
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Account ID
              </label>
              <input
                type="text"
                value={config?.businessAccountId || ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev!, businessAccountId: e.target.value }))
                }
                placeholder="Ej: 1403905514461565"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID de la cuenta de WhatsApp Business (WABA)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <input
                type="password"
                value={config?.accessToken || ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev!, accessToken: e.target.value }))
                }
                placeholder="Token de acceso permanente"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Token de acceso permanente de la API
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Teléfono
                </label>
                <input
                  type="text"
                  value={config?.phoneNumber || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev!, phoneNumber: e.target.value }))
                  }
                  placeholder="+34 643 87 91 49"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre a Mostrar
                </label>
                <input
                  type="text"
                  value={config?.displayName || ""}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev!, displayName: e.target.value }))
                  }
                  placeholder="Cerecilla SL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={config?.isActive || false}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev!, isActive: e.target.checked }))
                }
                className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Activar envío de WhatsApp
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
              <button
                onClick={handleTestConnection}
                disabled={testing || !config?.phoneNumberId}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Probar Conexión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Campaña</h3>
              <button onClick={() => setShowNewCampaign(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la campaña</label>
                <input
                  type="text"
                  value={newCampaign.nombre}
                  onChange={(e) => setNewCampaign({ ...newCampaign, nombre: e.target.value })}
                  placeholder="Ej: Promoción Enero 2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                <textarea
                  value={newCampaign.descripcion}
                  onChange={(e) => setNewCampaign({ ...newCampaign, descripcion: e.target.value })}
                  placeholder="Descripción de la campaña..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla</label>
                <select
                  value={newCampaign.templateId}
                  onChange={(e) => setNewCampaign({ ...newCampaign, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                >
                  <option value="">Seleccionar plantilla...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.templateName} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por estado</label>
                <div className="flex flex-wrap gap-2">
                  {estados.map((estado) => (
                    <label key={estado} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={newCampaign.filtroEstado.includes(estado)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewCampaign({
                              ...newCampaign,
                              filtroEstado: [...newCampaign.filtroEstado, estado],
                            });
                          } else {
                            setNewCampaign({
                              ...newCampaign,
                              filtroEstado: newCampaign.filtroEstado.filter((s) => s !== estado),
                            });
                          }
                        }}
                        className="w-4 h-4 text-[#BB292A] border-gray-300 rounded"
                      />
                      <span className="text-xs text-gray-600">{estado}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Deja vacío para enviar a todos los clientes con teléfono
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={creatingCampaign}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] disabled:opacity-50"
              >
                {creatingCampaign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Crear Campaña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
