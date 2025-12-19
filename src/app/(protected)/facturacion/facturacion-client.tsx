"use client";

import { useState } from "react";
import {
  Calendar,
  Receipt,
  Send,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Edit3,
  Trash2,
  Mail,
  Users,
  FileText,
} from "lucide-react";
import {
  generarFacturas,
  enviarFactura,
  enviarTodasFacturas,
  updateNumeroFactura,
  updateFechaFactura,
  deleteFactura,
  type OperarioFacturable,
  type FacturaLinea,
} from "./actions";

interface FacturacionClientProps {
  operariosComisionables: OperarioFacturable[];
  facturasEmitidas: FacturaLinea[];
}

export function FacturacionClient({
  operariosComisionables,
  facturasEmitidas: initialFacturas,
}: FacturacionClientProps) {
  const [fechaFactura, setFechaFactura] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [step, setStep] = useState<"select-date" | "preview" | "emitidas">(
    initialFacturas.length > 0 ? "emitidas" : "select-date"
  );
  const [loading, setLoading] = useState(false);
  const [facturas, setFacturas] = useState<FacturaLinea[]>(initialFacturas);
  const [editingNumero, setEditingNumero] = useState<string | null>(null);
  const [editingFecha, setEditingFecha] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  async function handleGenerarFacturas() {
    setLoading(true);
    const result = await generarFacturas(fechaFactura);
    if (result.error) {
      alert(result.error);
    } else if (result.facturas) {
      setFacturas(result.facturas);
      setStep("emitidas");
    }
    setLoading(false);
  }

  async function handleEnviarFactura(facturaId: string) {
    setSendingId(facturaId);
    const result = await enviarFactura(facturaId);
    if (result.error) {
      alert(result.error);
    } else {
      setFacturas((prev) =>
        prev.map((f) =>
          f.id === facturaId ? { ...f, estado: "enviada" } : f
        )
      );
    }
    setSendingId(null);
  }

  async function handleEnviarTodas() {
    if (!confirm("¿Enviar todas las facturas emitidas? Los clientes pasarán a estado 'Liquidado'.")) {
      return;
    }
    setSendingAll(true);
    const result = await enviarTodasFacturas();
    if (result.error) {
      alert(result.error);
    } else {
      alert(`Se han enviado ${result.enviadas} facturas`);
      window.location.reload();
    }
    setSendingAll(false);
  }

  async function handleUpdateNumero(facturaId: string) {
    const result = await updateNumeroFactura(facturaId, tempValue);
    if (result.error) {
      alert(result.error);
    } else {
      setFacturas((prev) =>
        prev.map((f) =>
          f.id === facturaId ? { ...f, numero_factura: tempValue } : f
        )
      );
    }
    setEditingNumero(null);
  }

  async function handleUpdateFecha(facturaId: string) {
    const result = await updateFechaFactura(facturaId, tempValue);
    if (result.error) {
      alert(result.error);
    } else {
      setFacturas((prev) =>
        prev.map((f) =>
          f.id === facturaId ? { ...f, fecha_factura: tempValue } : f
        )
      );
    }
    setEditingFecha(null);
  }

  async function handleDeleteFactura(facturaId: string) {
    if (!confirm("¿Eliminar esta factura?")) return;
    const result = await deleteFactura(facturaId);
    if (result.error) {
      alert(result.error);
    } else {
      setFacturas((prev) => prev.filter((f) => f.id !== facturaId));
    }
  }

  // Step 1: Select date
  if (step === "select-date") {
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-[#BB292A]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Operarios con Clientes Comisionables
            </h2>
          </div>

          {operariosComisionables.length === 0 ? (
            <p className="text-gray-500">
              No hay operarios con clientes en estado "Comisionable"
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Se encontraron {operariosComisionables.length} operarios con clientes listos para facturar.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Operario
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Clientes
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Documentación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {operariosComisionables.map((op) => (
                      <tr key={op.id} className={op.documentos_completos ? "" : "bg-amber-50"}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{op.alias}</p>
                          <p className="text-xs text-gray-500">{op.nombre || op.empresa}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            op.tipo === "Empresa" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          }`}>
                            {op.tipo || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium text-[#BB292A]">{op.clientes_comisionables}</span>
                        </td>
                        <td className="px-4 py-3">
                          {op.documentos_completos ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle className="w-4 h-4" />
                              Completa
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600 text-xs">
                              <AlertTriangle className="w-4 h-4" />
                              Falta: {op.documentos_faltantes.join(", ")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Date selector */}
        {operariosComisionables.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-[#BB292A]" />
              <h2 className="text-lg font-semibold text-gray-900">
                Seleccionar Fecha de Factura
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de la factura
                </label>
                <input
                  type="date"
                  value={fechaFactura}
                  onChange={(e) => setFechaFactura(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>

              <button
                onClick={handleGenerarFacturas}
                disabled={loading}
                className="px-6 py-2 bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Receipt className="w-4 h-4" />
                )}
                Emitir Facturas
              </button>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Se generará una factura para cada operario con clientes en estado "Comisionable".
            </p>
          </div>
        )}

        {/* Show existing invoices button */}
        {initialFacturas.length > 0 && (
          <button
            onClick={() => setStep("emitidas")}
            className="text-[#BB292A] hover:underline text-sm"
          >
            Ver facturas emitidas ({initialFacturas.length})
          </button>
        )}
      </div>
    );
  }

  // Step 2/3: Show emitted invoices
  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-[#BB292A]" />
          <h2 className="text-lg font-semibold text-gray-900">
            Facturas Emitidas ({facturas.filter(f => f.estado === "emitida").length})
          </h2>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("select-date")}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Nueva Facturación
          </button>
          {facturas.some(f => f.estado === "emitida") && (
            <button
              onClick={handleEnviarTodas}
              disabled={sendingAll}
              className="px-4 py-2 text-sm bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] disabled:opacity-50 flex items-center gap-2"
            >
              {sendingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar Todas
            </button>
          )}
        </div>
      </div>

      {/* Invoices table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Operario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nº Factura
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Documentos
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {facturas.map((factura) => (
                <tr key={factura.id} className={!factura.documentos_completos ? "bg-amber-50" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{factura.operario_alias}</p>
                    <p className="text-xs text-gray-500">{factura.operario_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingNumero === factura.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="w-32 px-2 py-1 text-sm border border-gray-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateNumero(factura.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingNumero(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{factura.numero_factura}</span>
                        {factura.estado === "emitida" && (
                          <button
                            onClick={() => {
                              setEditingNumero(factura.id);
                              setTempValue(factura.numero_factura);
                            }}
                            className="text-gray-400 hover:text-[#BB292A]"
                            title="Cambiar número"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingFecha === factura.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateFecha(factura.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingFecha(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{new Date(factura.fecha_factura).toLocaleDateString("es-ES")}</span>
                        {factura.estado === "emitida" && (
                          <button
                            onClick={() => {
                              setEditingFecha(factura.id);
                              setTempValue(factura.fecha_factura);
                            }}
                            className="text-gray-400 hover:text-[#BB292A]"
                            title="Cambiar fecha"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      factura.estado === "enviada"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {factura.estado === "enviada" ? "Enviada" : "Emitida"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {factura.documentos_completos ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="w-4 h-4" />
                        OK
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-xs" title={factura.documentos_faltantes || ""}>
                        <AlertTriangle className="w-4 h-4" />
                        Incompleta
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {factura.estado === "emitida" && (
                        <>
                          <button
                            onClick={() => handleEnviarFactura(factura.id)}
                            disabled={sendingId === factura.id}
                            className={`p-1.5 rounded ${
                              factura.documentos_completos
                                ? "text-[#BB292A] hover:bg-[#BB292A]/10"
                                : "text-amber-600 hover:bg-amber-50"
                            }`}
                            title={factura.documentos_completos ? "Enviar factura" : "Enviar (documentación incompleta)"}
                          >
                            {sendingId === factura.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteFactura(factura.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {factura.estado === "enviada" && (
                        <span className="text-xs text-gray-400">Procesada</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Warning about incomplete docs */}
      {facturas.some((f) => !f.documentos_completos && f.estado === "emitida") && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Algunas facturas tienen documentación incompleta
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Los operarios con documentación incompleta recibirán un aviso de que no se procederá al pago hasta tener toda la documentación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
