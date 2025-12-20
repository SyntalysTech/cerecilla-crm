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
  Download,
  Eye,
  Euro,
  Building2,
} from "lucide-react";
import {
  generarFacturas,
  enviarFactura,
  enviarTodasFacturas,
  updateNumeroFactura,
  updateFechaFactura,
  deleteFactura,
  generarFacturaCliente,
  deleteFacturaCliente,
  marcarFacturaCobrada,
  getClienteParaFactura,
  type OperarioFacturable,
  type FacturaLinea,
  type ClienteFacturable,
  type FacturaClienteLinea,
} from "./actions";
import {
  generateFacturaPDF,
  downloadPDF,
  openPDF,
  type FacturaData,
} from "@/lib/pdf/factura-generator";

interface EmpresaConfig {
  nombre: string;
  cif: string;
  direccion: string;
  poblacion: string;
  provincia: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  cuentaBancaria: string;
}

interface FacturacionClientProps {
  operariosComisionables: OperarioFacturable[];
  facturasEmitidas: FacturaLinea[];
  clientesFacturables: ClienteFacturable[];
  facturasClientes: FacturaClienteLinea[];
  empresaConfig: EmpresaConfig;
}

type Tab = "operarios" | "clientes";

export function FacturacionClient({
  operariosComisionables,
  facturasEmitidas: initialFacturas,
  clientesFacturables,
  facturasClientes: initialFacturasClientes,
  empresaConfig,
}: FacturacionClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("clientes");
  const [fechaFactura, setFechaFactura] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [step, setStep] = useState<"select-date" | "preview" | "emitidas">(
    initialFacturas.length > 0 ? "emitidas" : "select-date"
  );
  const [loading, setLoading] = useState(false);
  const [facturas, setFacturas] = useState<FacturaLinea[]>(initialFacturas);
  const [facturasClientes, setFacturasClientes] = useState<FacturaClienteLinea[]>(initialFacturasClientes);
  const [editingNumero, setEditingNumero] = useState<string | null>(null);
  const [editingFecha, setEditingFecha] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  // Estado para modal de nueva factura cliente
  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteFacturable | null>(null);
  const [facturaForm, setFacturaForm] = useState({
    concepto: "Servicio de gestión energética",
    importe: "",
    iva: "21",
    fechaFactura: new Date().toISOString().split("T")[0],
  });
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);

  // ==================== FUNCIONES OPERARIOS ====================
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

  // ==================== FUNCIONES CLIENTES ====================
  function openFacturaModal(cliente: ClienteFacturable) {
    setSelectedCliente(cliente);
    setFacturaForm({
      concepto: `Servicio de gestión - ${cliente.servicio || "Energía"}`,
      importe: "",
      iva: "21",
      fechaFactura: new Date().toISOString().split("T")[0],
    });
    setShowFacturaModal(true);
  }

  async function handleCrearFacturaCliente() {
    if (!selectedCliente) return;
    if (!facturaForm.importe || parseFloat(facturaForm.importe) <= 0) {
      alert("Introduce un importe válido");
      return;
    }

    setLoading(true);
    const result = await generarFacturaCliente(selectedCliente.id, {
      concepto: facturaForm.concepto,
      importe: parseFloat(facturaForm.importe),
      iva: parseInt(facturaForm.iva),
      fechaFactura: facturaForm.fechaFactura,
    });

    if (result.error) {
      alert(result.error);
    } else {
      // Recargar para obtener la nueva factura
      window.location.reload();
    }
    setLoading(false);
    setShowFacturaModal(false);
  }

  async function handleDeleteFacturaCliente(facturaId: string) {
    if (!confirm("¿Eliminar esta factura? El cliente podrá volver a ser facturado.")) return;
    const result = await deleteFacturaCliente(facturaId);
    if (result.error) {
      alert(result.error);
    } else {
      setFacturasClientes((prev) => prev.filter((f) => f.id !== facturaId));
    }
  }

  async function handleMarcarCobrada(facturaId: string) {
    const result = await marcarFacturaCobrada(facturaId);
    if (result.error) {
      alert(result.error);
    } else {
      setFacturasClientes((prev) =>
        prev.map((f) =>
          f.id === facturaId ? { ...f, estado: "cobrada" } : f
        )
      );
    }
  }

  async function handleGenerarPDF(factura: FacturaClienteLinea, download: boolean = false) {
    setGeneratingPDF(factura.id);
    try {
      // Obtener datos del cliente
      const cliente = await getClienteParaFactura(factura.cliente_id);
      if (!cliente) {
        alert("No se pudo obtener los datos del cliente");
        return;
      }

      const facturaData: FacturaData = {
        numero: factura.numero_factura,
        fecha: new Date(factura.fecha_factura).toLocaleDateString("es-ES"),
        fechaVencimiento: new Date(
          new Date(factura.fecha_factura).getTime() + 30 * 24 * 60 * 60 * 1000
        ).toLocaleDateString("es-ES"),
        emisor: {
          nombre: empresaConfig.nombre,
          cif: empresaConfig.cif,
          direccion: empresaConfig.direccion,
          poblacion: empresaConfig.poblacion,
          provincia: empresaConfig.provincia,
          codigoPostal: empresaConfig.codigoPostal,
          telefono: empresaConfig.telefono,
          email: empresaConfig.email,
        },
        cliente: {
          nombre: cliente.nombre,
          nif: cliente.nif || undefined,
          direccion: cliente.direccion || undefined,
          poblacion: cliente.poblacion || undefined,
          provincia: cliente.provincia || undefined,
          codigoPostal: cliente.codigoPostal || undefined,
          email: cliente.email || undefined,
        },
        lineas: [
          {
            descripcion: factura.concepto,
            cantidad: 1,
            precioUnitario: factura.importe,
            iva: factura.iva,
          },
        ],
        metodoPago: "Transferencia bancaria",
        cuentaBancaria: empresaConfig.cuentaBancaria,
        notas: "Gracias por confiar en nosotros.",
      };

      const { blob, filename } = await generateFacturaPDF(facturaData);

      if (download) {
        downloadPDF(blob, filename);
      } else {
        openPDF(blob);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF");
    }
    setGeneratingPDF(null);
  }

  // ==================== TABS ====================
  const tabs = [
    { id: "clientes" as Tab, label: "Facturas a Clientes", icon: Users },
    { id: "operarios" as Tab, label: "Facturas a Operarios", icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-[#BB292A] text-[#BB292A]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ==================== TAB CLIENTES ==================== */}
      {activeTab === "clientes" && (
        <div className="space-y-6">
          {/* Clientes facturables */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-[#BB292A]" />
              <h2 className="text-lg font-semibold text-gray-900">
                Clientes Pendientes de Facturar
              </h2>
              <span className="px-2 py-0.5 bg-[#BB292A]/10 text-[#BB292A] text-sm font-medium rounded-full">
                {clientesFacturables.length}
              </span>
            </div>

            {clientesFacturables.length === 0 ? (
              <p className="text-gray-500">
                No hay clientes en estado Comisionable o Finalizado pendientes de facturar.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Servicio
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientesFacturables.map((cliente) => (
                      <tr key={cliente.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{cliente.nombre}</p>
                          <p className="text-xs text-gray-500">{cliente.nif || "-"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {cliente.servicio || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            cliente.estado === "COMISIONABLE"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {cliente.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openFacturaModal(cliente)}
                            className="px-3 py-1.5 bg-[#BB292A] text-white text-sm rounded-md hover:bg-[#a02324] inline-flex items-center gap-1"
                          >
                            <Receipt className="w-4 h-4" />
                            Facturar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Facturas de clientes emitidas */}
          {facturasClientes.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-[#BB292A]" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Facturas Emitidas a Clientes
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nº Factura
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {facturasClientes.map((factura) => (
                      <tr key={factura.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{factura.cliente_nombre}</p>
                          <p className="text-xs text-gray-500">{factura.cliente_email || "-"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm">{factura.numero_factura}</span>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(factura.fecha_factura).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 line-clamp-1">
                            {factura.concepto}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-medium text-gray-900">
                            {factura.total.toFixed(2)} €
                          </span>
                          <p className="text-xs text-gray-500">
                            ({factura.importe.toFixed(2)} + {factura.iva}% IVA)
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            factura.estado === "cobrada"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {factura.estado === "cobrada" ? "Cobrada" : "Emitida"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleGenerarPDF(factura, false)}
                              disabled={generatingPDF === factura.id}
                              className="p-1.5 text-gray-400 hover:text-[#BB292A] hover:bg-[#BB292A]/10 rounded"
                              title="Ver PDF"
                            >
                              {generatingPDF === factura.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleGenerarPDF(factura, true)}
                              disabled={generatingPDF === factura.id}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {factura.estado === "emitida" && (
                              <>
                                <button
                                  onClick={() => handleMarcarCobrada(factura.id)}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                  title="Marcar como cobrada"
                                >
                                  <Euro className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFacturaCliente(factura.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB OPERARIOS ==================== */}
      {activeTab === "operarios" && (
        <>
          {step === "select-date" && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="w-6 h-6 text-[#BB292A]" />
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
          )}

          {step === "emitidas" && (
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
          )}
        </>
      )}

      {/* ==================== MODAL NUEVA FACTURA CLIENTE ==================== */}
      {showFacturaModal && selectedCliente && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#BB292A]" />
                Nueva Factura
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Cliente: <span className="font-medium">{selectedCliente.nombre}</span>
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto
                </label>
                <input
                  type="text"
                  value={facturaForm.concepto}
                  onChange={(e) => setFacturaForm({ ...facturaForm, concepto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importe (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={facturaForm.importe}
                    onChange={(e) => setFacturaForm({ ...facturaForm, importe: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#BB292A] focus:border-[#BB292A]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IVA (%)
                  </label>
                  <select
                    value={facturaForm.iva}
                    onChange={(e) => setFacturaForm({ ...facturaForm, iva: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#BB292A] focus:border-[#BB292A]"
                  >
                    <option value="21">21%</option>
                    <option value="10">10%</option>
                    <option value="4">4%</option>
                    <option value="0">0% (Exento)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Factura
                </label>
                <input
                  type="date"
                  value={facturaForm.fechaFactura}
                  onChange={(e) => setFacturaForm({ ...facturaForm, fechaFactura: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>

              {facturaForm.importe && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base imponible:</span>
                    <span className="font-medium">{parseFloat(facturaForm.importe || "0").toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">IVA ({facturaForm.iva}%):</span>
                    <span className="font-medium">
                      {(parseFloat(facturaForm.importe || "0") * parseInt(facturaForm.iva) / 100).toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-[#BB292A]">
                      {(parseFloat(facturaForm.importe || "0") * (1 + parseInt(facturaForm.iva) / 100)).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowFacturaModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearFacturaCliente}
                disabled={loading || !facturaForm.importe}
                className="px-4 py-2 text-sm bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Receipt className="w-4 h-4" />
                )}
                Crear Factura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
