"use client";

import { useState } from "react";
import {
  Mail,
  Eye,
  MousePointer,
  UserMinus,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  template_id: string | null;
  template?: { id: string; name: string; subject: string; html: string } | null;
  status: string;
  total_recipients: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  unsubscribe_count: number;
  bounce_count: number;
  created_at: string;
  sent_at: string | null;
}

interface Recipient {
  id: string;
  email: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  unsubscribed_at: string | null;
  bounced_at: string | null;
  open_count: number;
  created_at: string;
}

interface TrackingEvent {
  id: string;
  event_type: string;
  email: string | null;
  link_url: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

interface CampaignDetailsProps {
  campaign: Campaign;
  recipients: Recipient[];
  events: TrackingEvent[];
}

export function CampaignDetails({ campaign, recipients, events }: CampaignDetailsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "recipients" | "activity">("overview");

  function calculateRate(count: number, total: number): string {
    if (total === 0) return "0%";
    return ((count / total) * 100).toFixed(1) + "%";
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "opened":
        return <Eye className="w-4 h-4 text-blue-500" />;
      case "clicked":
        return <MousePointer className="w-4 h-4 text-green-500" />;
      case "bounced":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "unsubscribed":
        return <UserMinus className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  }

  function getRecipientStatus(recipient: Recipient): string {
    if (recipient.unsubscribed_at) return "unsubscribed";
    if (recipient.bounced_at) return "bounced";
    if (recipient.clicked_at) return "clicked";
    if (recipient.opened_at) return "opened";
    if (recipient.sent_at) return "sent";
    return "pending";
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case "sent": return "Enviado";
      case "opened": return "Abierto";
      case "clicked": return "Clic";
      case "bounced": return "Rebotado";
      case "unsubscribed": return "Baja";
      case "pending": return "Pendiente";
      default: return status;
    }
  }

  function getEventIcon(type: string) {
    switch (type) {
      case "open":
        return <Eye className="w-4 h-4 text-blue-500" />;
      case "click":
        return <MousePointer className="w-4 h-4 text-green-500" />;
      case "unsubscribe":
        return <UserMinus className="w-4 h-4 text-orange-500" />;
      case "bounce":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-400" />;
    }
  }

  // Group recipients by status for overview
  const recipientsByStatus = recipients.reduce((acc, r) => {
    const status = getRecipientStatus(r);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{campaign.total_recipients}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Mail className="w-5 h-5" />
            <span className="text-sm font-medium">Enviados</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{campaign.sent_count}</p>
          <p className="text-xs text-gray-500">{calculateRate(campaign.sent_count, campaign.total_recipients)}</p>
        </div>

        <div className="bg-white rounded-lg border border-blue-200 p-4 bg-blue-50">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Eye className="w-5 h-5" />
            <span className="text-sm font-medium">Aperturas</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">{campaign.open_count}</p>
          <p className="text-xs text-blue-600">{calculateRate(campaign.open_count, campaign.sent_count)}</p>
        </div>

        <div className="bg-white rounded-lg border border-green-200 p-4 bg-green-50">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <MousePointer className="w-5 h-5" />
            <span className="text-sm font-medium">Clics</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{campaign.click_count}</p>
          <p className="text-xs text-green-600">{calculateRate(campaign.click_count, campaign.sent_count)}</p>
        </div>

        <div className="bg-white rounded-lg border border-orange-200 p-4 bg-orange-50">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <UserMinus className="w-5 h-5" />
            <span className="text-sm font-medium">Bajas</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{campaign.unsubscribe_count}</p>
          <p className="text-xs text-orange-600">{calculateRate(campaign.unsubscribe_count, campaign.sent_count)}</p>
        </div>

        <div className="bg-white rounded-lg border border-red-200 p-4 bg-red-50">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <XCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Rebotes</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{campaign.bounce_count}</p>
          <p className="text-xs text-red-600">{calculateRate(campaign.bounce_count, campaign.sent_count)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "overview"
                  ? "border-[#BB292A] text-[#BB292A]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab("recipients")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "recipients"
                  ? "border-[#BB292A] text-[#BB292A]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Destinatarios ({recipients.length})
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === "activity"
                  ? "border-[#BB292A] text-[#BB292A]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Actividad ({events.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Campaign info */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Información</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Creada</p>
                    <p className="text-sm text-gray-900">
                      {new Date(campaign.created_at).toLocaleString("es-ES")}
                    </p>
                  </div>
                  {campaign.sent_at && (
                    <div>
                      <p className="text-xs text-gray-400">Enviada</p>
                      <p className="text-sm text-gray-900">
                        {new Date(campaign.sent_at).toLocaleString("es-ES")}
                      </p>
                    </div>
                  )}
                  {campaign.template && (
                    <div>
                      <p className="text-xs text-gray-400">Plantilla</p>
                      <p className="text-sm text-gray-900">{campaign.template.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status breakdown */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Estado de destinatarios</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(recipientsByStatus).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {getStatusIcon(status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{count}</p>
                        <p className="text-xs text-gray-500">{getStatusLabel(status)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement funnel */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">Embudo de engagement</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500">Enviados</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gray-500 h-full flex items-center justify-end pr-2"
                        style={{ width: "100%" }}
                      >
                        <span className="text-xs text-white font-medium">{campaign.sent_count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500">Abiertos</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full flex items-center justify-end pr-2"
                        style={{ width: `${campaign.sent_count > 0 ? (campaign.open_count / campaign.sent_count) * 100 : 0}%` }}
                      >
                        <span className="text-xs text-white font-medium">{campaign.open_count}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500">Clics</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-green-500 h-full flex items-center justify-end pr-2"
                        style={{ width: `${campaign.sent_count > 0 ? (campaign.click_count / campaign.sent_count) * 100 : 0}%` }}
                      >
                        <span className="text-xs text-white font-medium">{campaign.click_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recipients Tab */}
          {activeTab === "recipients" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enviado</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Abierto</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Clic</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aperturas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recipients.map((recipient) => {
                    const status = getRecipientStatus(recipient);
                    return (
                      <tr key={recipient.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{recipient.email}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1">
                            {getStatusIcon(status)}
                            <span className="text-gray-600">{getStatusLabel(status)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {recipient.sent_at
                            ? new Date(recipient.sent_at).toLocaleString("es-ES")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {recipient.opened_at
                            ? new Date(recipient.opened_at).toLocaleString("es-ES")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {recipient.clicked_at
                            ? new Date(recipient.clicked_at).toLocaleString("es-ES")
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{recipient.open_count || 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {recipients.length === 0 && (
                <p className="text-center py-8 text-gray-500">No hay destinatarios</p>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {getEventIcon(event.event_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {event.email || "Desconocido"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {event.event_type === "open" && "abrió el email"}
                        {event.event_type === "click" && "hizo clic"}
                        {event.event_type === "unsubscribe" && "se dio de baja"}
                        {event.event_type === "bounce" && "rebotó"}
                      </span>
                    </div>
                    {event.link_url && (
                      <a
                        href={event.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                      >
                        {event.link_url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.created_at).toLocaleString("es-ES")}
                      {event.ip_address && ` · IP: ${event.ip_address}`}
                    </p>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center py-8 text-gray-500">No hay actividad registrada</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
