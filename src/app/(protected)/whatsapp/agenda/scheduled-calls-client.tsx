"use client";

import { useState } from "react";
import { Phone, Clock, MessageSquare, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { updateCallStatus, deleteScheduledCall, type ScheduledCall } from "./actions";

interface ScheduledCallsClientProps {
  initialCalls: ScheduledCall[];
}

const serviceEmojis: Record<string, string> = {
  "Luz": "⚡",
  "Gas": "🔥",
  "Telefonía": "📱",
  "Fibra": "🌐",
  "Seguros": "🛡️",
  "Alarmas": "🚨",
  "Colaborador": "🤝",
};

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: Clock,
  },
  completed: {
    label: "Completada",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: XCircle,
  },
};

export function ScheduledCallsClient({ initialCalls }: ScheduledCallsClientProps) {
  const [calls, setCalls] = useState<ScheduledCall[]>(initialCalls);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredCalls = calls.filter((call) => {
    if (filterStatus !== "all" && call.status !== filterStatus) return false;
    if (filterService !== "all" && !call.service_interest.includes(filterService)) return false;
    return true;
  });

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleStatusChange = async (callId: string, newStatus: "pending" | "completed" | "cancelled") => {
    try {
      const result = await updateCallStatus(callId, newStatus);

      if (result.success) {
        setCalls(calls.map(call =>
          call.id === callId ? { ...call, status: newStatus } : call
        ));
        showMessage("success", "Estado actualizado correctamente");
      } else {
        showMessage("error", result.error || "Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error updating call status:", error);
      showMessage("error", "Error al actualizar el estado");
    }
  };

  const handleDelete = async (callId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta solicitud?")) {
      return;
    }

    try {
      const result = await deleteScheduledCall(callId);

      if (result.success) {
        setCalls(calls.filter(call => call.id !== callId));
        showMessage("success", "Solicitud eliminada correctamente");
      } else {
        showMessage("error", result.error || "Error al eliminar la solicitud");
      }
    } catch (error) {
      console.error("Error deleting call:", error);
      showMessage("error", "Error al eliminar la solicitud");
    }
  };

  const getServiceEmoji = (service: string) => {
    for (const [key, emoji] of Object.entries(serviceEmojis)) {
      if (service.includes(key)) return emoji;
    }
    return "📞";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `hace ${diffMins} minutos`;
    if (diffHours < 24) return `hace ${diffHours} horas`;
    return `hace ${diffDays} días`;
  };

  const pendingCount = calls.filter(c => c.status === "pending").length;
  const completedCount = calls.filter(c => c.status === "completed").length;

  return (
    <div className="space-y-6 p-6">
      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          message.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Solicitudes</div>
          <div className="text-3xl font-bold text-gray-900">{calls.length}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Pendientes</div>
          <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="text-sm font-medium text-gray-600 mb-2">Completadas</div>
          <div className="text-3xl font-bold text-green-600">{completedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Servicio</label>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="Luz">⚡ Luz</option>
              <option value="Gas">🔥 Gas</option>
              <option value="Telefonía">📱 Telefonía</option>
              <option value="Fibra">🌐 Fibra</option>
              <option value="Seguros">🛡️ Seguros</option>
              <option value="Alarmas">🚨 Alarmas</option>
              <option value="Colaborador">🤝 Colaborador</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calls List */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
            <p className="text-gray-500">No hay solicitudes de llamada</p>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const StatusIcon = statusConfig[call.status].icon;

            return (
              <div key={call.id} className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getServiceEmoji(call.service_interest)}</span>
                        <h3 className="text-lg font-semibold">{call.service_interest}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${statusConfig[call.status].color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[call.status].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(call.created_at)}</p>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={call.status}
                        onChange={(e) => handleStatusChange(call.id, e.target.value as "pending" | "completed" | "cancelled")}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                      </select>

                      <button
                        onClick={() => handleDelete(call.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{call.phone_number}</span>
                      {call.sender_name && (
                        <span className="text-gray-500">• {call.sender_name}</span>
                      )}
                    </div>

                    {call.requested_datetime && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>
                          Solicita llamada: {new Date(call.requested_datetime).toLocaleString("es-ES", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    )}

                    {call.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium mb-1">Notas:</div>
                          <div className="text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
                            {call.notes}
                          </div>
                        </div>
                      </div>
                    )}

                    {call.message_id && (
                      <div className="pt-2 border-t border-gray-200">
                        <a
                          href={`/whatsapp?message=${call.message_id}`}
                          className="inline-block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-md transition-colors"
                        >
                          Ver conversación completa
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
