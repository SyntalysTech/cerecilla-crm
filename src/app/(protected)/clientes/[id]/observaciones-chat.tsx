"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Trash2, MessageSquare, ShieldAlert, Loader2, Mail } from "lucide-react";
import { addObservacion, deleteObservacion, sendObservacionEmail, type Observacion } from "./observaciones-actions";

interface ObservacionesChatProps {
  clienteId: string;
  observaciones: Observacion[];
  isAdmin: boolean;
  currentUserEmail: string;
  variant?: "normal" | "admin";
}

export function ObservacionesChat({
  clienteId,
  observaciones,
  isAdmin,
  currentUserEmail,
  variant = "normal",
}: ObservacionesChatProps) {
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [localObservaciones, setLocalObservaciones] = useState(observaciones);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredObservaciones = variant === "admin"
    ? localObservaciones.filter((o) => o.es_admin)
    : localObservaciones.filter((o) => !o.es_admin);

  useEffect(() => {
    setLocalObservaciones(observaciones);
  }, [observaciones]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredObservaciones]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim() || loading) return;

    setLoading(true);
    const result = await addObservacion(clienteId, mensaje.trim(), variant === "admin");

    if (result.success && result.observacion) {
      setLocalObservaciones((prev) => [...prev, result.observacion as Observacion]);
      setMensaje("");
    }
    setLoading(false);
  }

  async function handleDelete(observacionId: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar esta observación?")) return;

    const result = await deleteObservacion(observacionId, clienteId);
    if (result.success) {
      setLocalObservaciones((prev) => prev.filter((o) => o.id !== observacionId));
    }
  }

  async function handleSendEmail(obs: Observacion) {
    if (sendingEmail) return;

    setSendingEmail(obs.id);
    const result = await sendObservacionEmail(clienteId, obs.mensaje);

    if (result.error) {
      alert(result.error);
    } else {
      alert("Observación enviada por email al operador");
    }
    setSendingEmail(null);
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOwnMessage = (obs: Observacion) => obs.user_email === currentUserEmail;

  return (
    <div className={`bg-white rounded-lg border ${variant === "admin" ? "border-yellow-300" : "border-gray-200"}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${variant === "admin" ? "border-yellow-300 bg-yellow-50" : "border-gray-200"}`}>
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          {variant === "admin" ? (
            <>
              <ShieldAlert className="w-5 h-5 text-yellow-600" />
              Observaciones Admin
              <span className="text-xs text-yellow-600 font-normal">(Solo visible para administradores)</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5 text-gray-400" />
              Observaciones
            </>
          )}
        </h3>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {filteredObservaciones.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No hay observaciones
          </div>
        ) : (
          filteredObservaciones.map((obs) => (
            <div
              key={obs.id}
              className={`flex ${isOwnMessage(obs) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  isOwnMessage(obs)
                    ? variant === "admin"
                      ? "bg-yellow-100 text-yellow-900"
                      : "bg-[#BB292A] text-white"
                    : "bg-white border border-gray-200 text-gray-900"
                }`}
              >
                <div className="flex items-start gap-2 justify-between">
                  <p className="text-sm whitespace-pre-wrap break-words">{obs.mensaje}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {variant !== "admin" && (
                      <button
                        onClick={() => handleSendEmail(obs)}
                        disabled={sendingEmail === obs.id}
                        className={`p-1 rounded hover:bg-black/10 ${
                          isOwnMessage(obs) ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-blue-500"
                        }`}
                        title="Enviar por email al operador"
                      >
                        {sendingEmail === obs.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Mail className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(obs.id)}
                        className={`p-1 rounded hover:bg-black/10 ${
                          isOwnMessage(obs) ? "text-white/70 hover:text-white" : "text-gray-400 hover:text-red-500"
                        }`}
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div
                  className={`text-xs mt-1 ${
                    isOwnMessage(obs)
                      ? variant === "admin"
                        ? "text-yellow-700"
                        : "text-white/70"
                      : "text-gray-500"
                  }`}
                >
                  <span className="font-medium">{obs.user_name || obs.user_email?.split("@")[0] || "Usuario"}</span>
                  {" · "}
                  {formatDate(obs.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder={variant === "admin" ? "Escribir nota admin..." : "Escribir observación..."}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !mensaje.trim()}
            className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              variant === "admin"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-[#BB292A] hover:bg-[#a02324]"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
