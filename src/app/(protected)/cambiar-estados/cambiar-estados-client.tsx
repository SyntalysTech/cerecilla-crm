"use client";

import { useState } from "react";
import {
  ArrowRight,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { cambiarEstadosMasivo, type EstadoCount } from "./actions";

interface CambiarEstadosClientProps {
  estadosActuales: EstadoCount[];
  estadosDisponibles: string[];
}

export function CambiarEstadosClient({
  estadosActuales,
  estadosDisponibles,
}: CambiarEstadosClientProps) {
  const [estadoOrigen, setEstadoOrigen] = useState("");
  const [estadoDestino, setEstadoDestino] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const selectedCount =
    estadosActuales.find((e) => e.estado === estadoOrigen)?.count || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!estadoOrigen || !estadoDestino) {
      setResult({ type: "error", message: "Selecciona ambos estados" });
      return;
    }

    if (estadoOrigen === estadoDestino) {
      setResult({ type: "error", message: "Los estados deben ser diferentes" });
      return;
    }

    if (
      !confirm(
        `¿Cambiar ${selectedCount} clientes de "${estadoOrigen}" a "${estadoDestino}"?`
      )
    ) {
      return;
    }

    setLoading(true);
    setResult(null);

    const response = await cambiarEstadosMasivo(estadoOrigen, estadoDestino);

    if (response.error) {
      setResult({ type: "error", message: response.error });
    } else {
      setResult({
        type: "success",
        message: `Se han actualizado ${response.count} clientes correctamente`,
      });
      setEstadoOrigen("");
      setEstadoDestino("");
      // Reload to update counts
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Current estados summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#BB292A]" />
          Estados Actuales
        </h2>

        {estadosActuales.length === 0 ? (
          <p className="text-gray-500">No hay clientes en el sistema</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {estadosActuales.map((item) => (
              <button
                key={item.estado}
                onClick={() => setEstadoOrigen(item.estado)}
                className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                  estadoOrigen === item.estado
                    ? "bg-[#BB292A] text-white border-[#BB292A]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#BB292A] hover:text-[#BB292A]"
                }`}
              >
                <span className="font-medium">{item.estado}</span>
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Change form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-[#BB292A]" />
          Cambiar Estado
        </h2>

        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          {/* From estado */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado Origen
            </label>
            <select
              value={estadoOrigen}
              onChange={(e) => setEstadoOrigen(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
            >
              <option value="">Seleccionar...</option>
              {estadosActuales.map((item) => (
                <option key={item.estado} value={item.estado}>
                  {item.estado} ({item.count} clientes)
                </option>
              ))}
            </select>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center px-4 pb-2">
            <ArrowRight className="w-6 h-6 text-gray-400" />
          </div>

          {/* To estado */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado Destino
            </label>
            <select
              value={estadoDestino}
              onChange={(e) => setEstadoDestino(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
            >
              <option value="">Seleccionar...</option>
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <div className="w-full md:w-auto">
            <button
              type="submit"
              disabled={loading || !estadoOrigen || !estadoDestino}
              className="w-full md:w-auto px-6 py-2 bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Cambiar Estados
            </button>
          </div>
        </div>

        {/* Preview */}
        {estadoOrigen && estadoDestino && estadoOrigen !== estadoDestino && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Se cambiarán <strong>{selectedCount}</strong> clientes de{" "}
              <strong>"{estadoOrigen}"</strong> a{" "}
              <strong>"{estadoDestino}"</strong>
            </p>
          </div>
        )}

        {/* Result message */}
        {result && (
          <div
            className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
              result.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <p
              className={`text-sm ${
                result.type === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.message}
            </p>
          </div>
        )}
      </form>

      {/* Help text */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Uso típico:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Cambiar clientes de <strong>"Comisionable"</strong> a{" "}
            <strong>"Liquidado"</strong> después de enviar facturas
          </li>
          <li>
            Cambiar clientes de <strong>"Pendiente"</strong> a{" "}
            <strong>"Validado"</strong> en bloque
          </li>
          <li>
            Cambiar clientes de <strong>"Nuevo"</strong> a{" "}
            <strong>"En proceso"</strong> al iniciar gestión
          </li>
        </ul>
      </div>
    </div>
  );
}
