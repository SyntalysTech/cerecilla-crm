"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Phone,
  Mail,
  User,
  Settings,
  Trash2,
  Loader2,
  X,
  Save,
  UserPlus,
  Euro,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
} from "lucide-react";
import {
  createReferido,
  updateReferido,
  deleteReferido,
  updateConfiguracionReferidos,
  addClienteToReferido,
  type Referido,
  type ConfiguracionReferidos,
} from "./actions";

interface Operario {
  id: string;
  nombre: string | null;
  alias: string | null;
}

interface ReferidosListProps {
  referidos: Referido[];
  config: ConfiguracionReferidos | null;
  operarios: Operario[];
}

const estadoColors: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  pendiente: { bg: "bg-yellow-100", text: "text-yellow-700", icon: Clock },
  contactado: { bg: "bg-blue-100", text: "text-blue-700", icon: MessageSquare },
  convertido: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  rechazado: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
};

export function ReferidosList({ referidos, config, operarios }: ReferidosListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [addingCliente, setAddingCliente] = useState<string | null>(null);

  const [newReferido, setNewReferido] = useState({
    nombre: "",
    telefono: "",
    email: "",
    referido_por_operario_id: "",
    notas: "",
  });

  const [configForm, setConfigForm] = useState({
    comision_por_cliente: config?.comision_por_cliente || 50,
    clientes_minimos_para_pago: config?.clientes_minimos_para_pago || 1,
  });

  const filteredReferidos = referidos.filter((r) => {
    const matchesSearch =
      searchTerm === "" ||
      r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.telefono.includes(searchTerm) ||
      r.referido_por_nombre?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEstado = estadoFilter === "" || r.estado === estadoFilter;

    return matchesSearch && matchesEstado;
  });

  async function handleAddReferido() {
    if (!newReferido.nombre || !newReferido.telefono) {
      alert("Nombre y teléfono son requeridos");
      return;
    }

    setSaving(true);

    // Get operario name if selected
    let referidoPorNombre = null;
    if (newReferido.referido_por_operario_id) {
      const op = operarios.find((o) => o.id === newReferido.referido_por_operario_id);
      referidoPorNombre = op?.alias || op?.nombre || null;
    }

    const result = await createReferido({
      ...newReferido,
      referido_por_nombre: referidoPorNombre || undefined,
    });

    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      setShowAddModal(false);
      setNewReferido({
        nombre: "",
        telefono: "",
        email: "",
        referido_por_operario_id: "",
        notas: "",
      });
      window.location.reload();
    }
    setSaving(false);
  }

  async function handleUpdateEstado(id: string, estado: string) {
    const result = await updateReferido(id, { estado });
    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      window.location.reload();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este referido?")) return;

    setDeleting(id);
    const result = await deleteReferido(id);
    if (result.error) {
      alert(`Error: ${result.error}`);
      setDeleting(null);
    } else {
      window.location.reload();
    }
  }

  async function handleAddCliente(referidoId: string) {
    setAddingCliente(referidoId);
    const result = await addClienteToReferido(referidoId);
    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      window.location.reload();
    }
    setAddingCliente(null);
  }

  async function handleSaveConfig() {
    setSaving(true);
    const result = await updateConfiguracionReferidos(configForm);
    if (result.error) {
      alert(`Error: ${result.error}`);
    } else {
      setShowConfigModal(false);
      window.location.reload();
    }
    setSaving(false);
  }

  // Stats
  const totalReferidos = referidos.length;
  const convertidos = referidos.filter((r) => r.estado === "convertido").length;
  const totalClientes = referidos.reduce((sum, r) => sum + (r.clientes_cargados || 0), 0);
  const totalComisiones = referidos.reduce((sum, r) => sum + (r.comision_total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalReferidos}</p>
              <p className="text-xs text-gray-500">Total Referidos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{convertidos}</p>
              <p className="text-xs text-gray-500">Convertidos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalClientes}</p>
              <p className="text-xs text-gray-500">Clientes Cargados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Euro className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalComisiones.toFixed(2)}€</p>
              <p className="text-xs text-gray-500">Comisiones Totales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, operario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
          />
        </div>

        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="contactado">Contactado</option>
          <option value="convertido">Convertido</option>
          <option value="rechazado">Rechazado</option>
        </select>

        <button
          onClick={() => setShowConfigModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Settings className="w-4 h-4" />
          Configurar
        </button>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white rounded-lg hover:bg-[#a02324]"
        >
          <Plus className="w-4 h-4" />
          Añadir Referido
        </button>
      </div>

      {/* Config info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Configuración actual:</strong> {config?.comision_por_cliente || 50}€ por cliente
          {config?.clientes_minimos_para_pago && config.clientes_minimos_para_pago > 1
            ? ` (mínimo ${config.clientes_minimos_para_pago} clientes para pago)`
            : ""}
        </p>
      </div>

      {/* Referidos list */}
      {filteredReferidos.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No hay referidos</h3>
          <p className="text-gray-500">Añade referidos para comenzar a gestionar las comisiones.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Referido
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Referido por
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Clientes
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Comisión
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReferidos.map((referido) => {
                const estadoConfig = estadoColors[referido.estado] || estadoColors.pendiente;
                const EstadoIcon = estadoConfig.icon;

                return (
                  <tr key={referido.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#BB292A]/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-[#BB292A]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{referido.nombre}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(referido.created_at).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {referido.telefono}
                        </div>
                        {referido.email && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            {referido.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {referido.referido_por_nombre || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={referido.estado}
                        onChange={(e) => handleUpdateEstado(referido.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-medium rounded border-0 ${estadoConfig.bg} ${estadoConfig.text}`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="contactado">Contactado</option>
                        <option value="convertido">Convertido</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {referido.clientes_cargados || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-green-600">
                        {(referido.comision_total || 0).toFixed(2)}€
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleAddCliente(referido.id)}
                          disabled={addingCliente === referido.id}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Añadir cliente cargado"
                        >
                          {addingCliente === referido.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(referido.id)}
                          disabled={deleting === referido.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Eliminar"
                        >
                          {deleting === referido.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Referido Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Añadir Referido</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newReferido.nombre}
                  onChange={(e) => setNewReferido({ ...newReferido, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  placeholder="Nombre del referido"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                <input
                  type="tel"
                  value={newReferido.telefono}
                  onChange={(e) => setNewReferido({ ...newReferido, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  placeholder="Teléfono de contacto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newReferido.email}
                  onChange={(e) => setNewReferido({ ...newReferido, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  placeholder="Email (opcional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referido por (Operario)</label>
                <select
                  value={newReferido.referido_por_operario_id}
                  onChange={(e) => setNewReferido({ ...newReferido, referido_por_operario_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                >
                  <option value="">Seleccionar operario...</option>
                  {operarios.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.alias || op.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={newReferido.notas}
                  onChange={(e) => setNewReferido({ ...newReferido, notas: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddReferido}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-[#BB292A] rounded-md hover:bg-[#a02324] disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? "Guardando..." : "Añadir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Configuración de Referidos</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comisión por cliente (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={configForm.comision_por_cliente}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, comision_por_cliente: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad que se paga por cada cliente cargado por un referido
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clientes mínimos para pago
                </label>
                <input
                  type="number"
                  min="1"
                  value={configForm.clientes_minimos_para_pago}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, clientes_minimos_para_pago: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número mínimo de clientes que debe cargar un referido para recibir la comisión
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-4 py-2 text-sm text-white bg-[#BB292A] rounded-md hover:bg-[#a02324] disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
