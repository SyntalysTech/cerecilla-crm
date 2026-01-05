"use client";

import { useState } from "react";
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
} from "lucide-react";
import {
  updateWhatsAppConfig,
  testWhatsAppConnection,
  createWhatsAppCampaign,
  startWhatsAppCampaign,
  type WhatsAppConfigData,
  type WhatsAppTemplate,
  type WhatsAppMessage,
  type WhatsAppCampaign,
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

type Tab = "overview" | "messages" | "campaigns" | "templates" | "settings";

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

  const isConfigured = config?.phoneNumberId && config?.accessToken && config?.isActive;

  const tabs: { id: Tab; label: string; icon: typeof MessageSquare }[] = [
    { id: "overview", label: "Resumen", icon: BarChart3 },
    { id: "messages", label: "Mensajes", icon: MessageSquare },
    { id: "campaigns", label: "Campañas", icon: Megaphone },
    { id: "templates", label: "Plantillas", icon: FileText },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

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
      {/* Warning if not configured */}
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">WhatsApp no configurado</h3>
            <p className="text-sm text-amber-700 mt-1">
              Configura las credenciales de WhatsApp Business API en la pestaña de Configuración para poder enviar mensajes.
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
