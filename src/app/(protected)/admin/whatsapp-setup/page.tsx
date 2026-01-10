"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  MessageSquare,
  Phone,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";

interface WhatsAppStatus {
  success?: boolean;
  error?: string;
  error_code?: number;
  phone_number_id?: string;
  waba_id?: string;
  display_phone_number?: string;
  verified_name?: string;
  status?: string;
  code_verification_status?: string;
  quality_rating?: string;
  platform_type?: string;
  name_status?: string;
  raw?: Record<string, unknown>;
}

export default function WhatsAppSetupPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // OTP verification
  const [otpMethod, setOtpMethod] = useState<"SMS" | "VOICE">("SMS");
  const [otpCode, setOtpCode] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);

  // Registration
  const [pin, setPin] = useState("123456");
  const [copied, setCopied] = useState(false);

  const certificate = "CogBCkQI8+TI7JWvtgMSBmVudDp3YSIrQ2VyZWNpbGxhIFNMIEFob3JybyBlbiBFbmVyZ8OtYSB5IFNlcnZpY2lvc1D/3ojLBhpA28NALDzKWuw9J8R+2pUgye6ZGtJLC1a21LNrD/hR1in+wyL5/cezoOSlMGFI2JJ9blHOk2XY/mn9kmTv/Ni4DBIubWMB+oHYkI7wWrWxnKppKp1d7eRYzNjimERKTq08HlGzRvsy6JoglTpBVokQDQ==";

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setStatus(data);
      if (data.error) {
        setError(data.error);
      }
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleRequestCode() {
    setActionLoading("request");
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/whatsapp/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: otpMethod, language: "es" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(`${data.error}${data.error_code ? ` (Código: ${data.error_code})` : ""}`);
      } else {
        setSuccessMessage(`Código enviado por ${otpMethod}`);
        setOtpRequested(true);
      }
    } catch {
      setError("Error al solicitar código");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleVerifyCode() {
    if (!otpCode || otpCode.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }
    setActionLoading("verify");
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/whatsapp/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (data.error) {
        setError(`${data.error}${data.error_code ? ` (Código: ${data.error_code})` : ""}`);
      } else {
        setSuccessMessage("Código verificado correctamente");
        setOtpCode("");
        setOtpRequested(false);
        fetchStatus();
      }
    } catch {
      setError("Error al verificar código");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRegister() {
    if (!pin || pin.length !== 6) {
      setError("El PIN debe tener 6 dígitos");
      return;
    }
    setActionLoading("register");
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/whatsapp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.error) {
        setError(`${data.error}${data.error_code ? ` (Código: ${data.error_code})` : ""}${data.suggestion ? ` - ${data.suggestion}` : ""}`);
      } else {
        setSuccessMessage("Número registrado correctamente en Cloud API");
        fetchStatus();
      }
    } catch {
      setError("Error al registrar número");
    } finally {
      setActionLoading(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const getStatusColor = (s: string | undefined) => {
    if (!s) return "bg-gray-100 text-gray-700";
    const upper = s.toUpperCase();
    if (upper.includes("VERIFIED") || upper.includes("CONNECTED") || upper.includes("ACTIVE") || upper.includes("REGISTERED")) {
      return "bg-green-100 text-green-700";
    }
    if (upper.includes("PENDING") || upper.includes("NOT_VERIFIED")) {
      return "bg-yellow-100 text-yellow-700";
    }
    if (upper.includes("ERROR") || upper.includes("FAILED") || upper.includes("BANNED")) {
      return "bg-red-100 text-red-700";
    }
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración de WhatsApp"
        description="Registra y activa tu número de WhatsApp Business"
      />

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Current Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Estado Actual</h2>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        {loading && !status ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : status?.success ? (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Número</p>
              <p className="font-medium">{status.display_phone_number || "+34 643 87 91 49"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nombre verificado</p>
              <p className="font-medium">{status.verified_name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(status.status)}`}>
                {status.status || "DESCONOCIDO"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Verificación de código</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(status.code_verification_status)}`}>
                {status.code_verification_status || "—"}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Calidad</p>
              <p className="font-medium">{status.quality_rating || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plataforma</p>
              <p className="font-medium">{status.platform_type || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number ID</p>
              <p className="font-mono text-sm">{status.phone_number_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">WABA ID</p>
              <p className="font-mono text-sm">{status.waba_id}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-yellow-700 bg-yellow-50 p-4 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
            <p>No se pudo obtener el estado. Verifica las credenciales.</p>
          </div>
        )}
      </div>

      {/* Certificate Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Certificado</h2>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Este es el certificado de tu número de WhatsApp. Ya está configurado en el sistema.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-xs font-mono text-gray-700 overflow-x-auto">
            {certificate.substring(0, 60)}...
          </code>
          <button
            onClick={() => copyToClipboard(certificate)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Registration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Registrar Número (Cloud API)</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Registra el número en la Cloud API de WhatsApp. Necesitas un PIN de 6 dígitos para la verificación en dos pasos.
        </p>
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN (6 dígitos)
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
              maxLength={6}
            />
          </div>
          <button
            onClick={handleRegister}
            disabled={actionLoading === "register" || pin.length !== 6}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading === "register" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Phone className="w-4 h-4" />
            )}
            Registrar
          </button>
        </div>
      </div>

      {/* OTP Verification */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Send className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Verificación OTP</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Si el registro requiere verificación, solicita un código OTP por SMS o llamada.
        </p>

        {/* Step 1: Request Code */}
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de envío
              </label>
              <select
                value={otpMethod}
                onChange={(e) => setOtpMethod(e.target.value as "SMS" | "VOICE")}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
              >
                <option value="SMS">SMS</option>
                <option value="VOICE">Llamada</option>
              </select>
            </div>
            <button
              onClick={handleRequestCode}
              disabled={actionLoading === "request"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === "request" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Solicitar Código
            </button>
          </div>

          {/* Step 2: Verify Code */}
          {otpRequested && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-end gap-3">
                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código OTP (6 dígitos)
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                    maxLength={6}
                  />
                </div>
                <button
                  onClick={handleVerifyCode}
                  disabled={actionLoading === "verify" || otpCode.length !== 6}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === "verify" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Verificar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debug Info */}
      {status?.raw && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Respuesta completa de Meta API</h3>
          <pre className="text-xs font-mono text-gray-600 overflow-x-auto bg-white p-3 rounded border">
            {JSON.stringify(status.raw, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
