"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Clock, MessageSquare, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { updateCallStatus, deleteScheduledCall, type ScheduledCall } from "./actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
    color: "bg-yellow-500",
    icon: Clock,
  },
  completed: {
    label: "Completada",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-500",
    icon: XCircle,
  },
};

export function ScheduledCallsClient({ initialCalls }: ScheduledCallsClientProps) {
  const [calls, setCalls] = useState<ScheduledCall[]>(initialCalls);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");

  const filteredCalls = calls.filter((call) => {
    if (filterStatus !== "all" && call.status !== filterStatus) return false;
    if (filterService !== "all" && !call.service_interest.includes(filterService)) return false;
    return true;
  });

  const handleStatusChange = async (callId: string, newStatus: "pending" | "completed" | "cancelled") => {
    try {
      const result = await updateCallStatus(callId, newStatus);

      if (result.success) {
        setCalls(calls.map(call =>
          call.id === callId ? { ...call, status: newStatus } : call
        ));
        toast.success("Estado actualizado correctamente");
      } else {
        toast.error(result.error || "Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error updating call status:", error);
      toast.error("Error al actualizar el estado");
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
        toast.success("Solicitud eliminada correctamente");
      } else {
        toast.error(result.error || "Error al eliminar la solicitud");
      }
    } catch (error) {
      console.error("Error deleting call:", error);
      toast.error("Error al eliminar la solicitud");
    }
  };

  const getServiceEmoji = (service: string) => {
    for (const [key, emoji] of Object.entries(serviceEmojis)) {
      if (service.includes(key)) return emoji;
    }
    return "📞";
  };

  const pendingCount = calls.filter(c => c.status === "pending").length;
  const completedCount = calls.filter(c => c.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{calls.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Estado</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Servicio</label>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Luz">⚡ Luz</SelectItem>
                <SelectItem value="Gas">🔥 Gas</SelectItem>
                <SelectItem value="Telefonía">📱 Telefonía</SelectItem>
                <SelectItem value="Fibra">🌐 Fibra</SelectItem>
                <SelectItem value="Seguros">🛡️ Seguros</SelectItem>
                <SelectItem value="Alarmas">🚨 Alarmas</SelectItem>
                <SelectItem value="Colaborador">🤝 Colaborador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calls List */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No hay solicitudes de llamada
            </CardContent>
          </Card>
        ) : (
          filteredCalls.map((call) => {
            const StatusIcon = statusConfig[call.status].icon;

            return (
              <Card key={call.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getServiceEmoji(call.service_interest)}</span>
                        <CardTitle className="text-lg">
                          {call.service_interest}
                        </CardTitle>
                        <Badge
                          variant="secondary"
                          className={`${statusConfig[call.status].color} text-white`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[call.status].label}
                        </Badge>
                      </div>
                      <CardDescription>
                        Hace {formatDistanceToNow(new Date(call.created_at), { locale: es })}
                      </CardDescription>
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={call.status}
                        onValueChange={(value) =>
                          handleStatusChange(call.id, value as "pending" | "completed" | "cancelled")
                        }
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="completed">Completada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(call.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{call.phone_number}</span>
                    {call.sender_name && (
                      <span className="text-muted-foreground">• {call.sender_name}</span>
                    )}
                  </div>

                  {call.requested_datetime && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
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
                      <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium mb-1">Notas:</div>
                        <div className="text-muted-foreground bg-muted p-3 rounded-md">
                          {call.notes}
                        </div>
                      </div>
                    </div>
                  )}

                  {call.message_id && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={`/whatsapp?message=${call.message_id}`}>
                          Ver conversación completa
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
