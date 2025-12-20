"use client";

import { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  Euro,
} from "lucide-react";
import { updateOperario, deleteOperario, getOperarioComisiones, updateOperarioComisiones } from "./actions";

interface Operario {
  id: string;
  email: string | null;
  alias: string | null;
  telefonos: string | null;
  tiene_doc_autonomo: boolean;
  tiene_doc_escritura: boolean;
  tiene_doc_cif: boolean;
  tiene_doc_contrato: boolean;
  tiene_cuenta_bancaria?: boolean;
  tipo: string | null;
  nombre: string | null;
  documento: string | null;
  empresa: string | null;
  cif: string | null;
  cuenta_bancaria: string | null;
  direccion: string | null;
  nombre_admin?: string | null;
  dni_admin?: string | null;
  password_operario?: string | null;
  created_at: string;
  ultima_carga?: string | null;
}

interface OperariosListProps {
  operarios: Operario[];
  error?: string;
}

// Check if date is more than 3 months ago
function isMoreThan3MonthsAgo(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true;
  const date = new Date(dateStr);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return date < threeMonthsAgo;
}

export function OperariosList({ operarios, error }: OperariosListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [actividadFilter, setActividadFilter] = useState<string>("");
  const [docsFilter, setDocsFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("alias");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    alias?: string;
    nombre?: string;
    email?: string;
    telefonos?: string;
    tipo?: string;
    empresa?: string;
    cif?: string;
    documento?: string;
    direccion?: string;
    cuenta_bancaria?: string;
    nombre_admin?: string;
    dni_admin?: string;
    password_operario?: string;
    tiene_doc_autonomo?: boolean;
    tiene_doc_escritura?: boolean;
    tiene_doc_cif?: boolean;
    tiene_doc_contrato?: boolean;
    tiene_cuenta_bancaria?: boolean;
  }>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [comisiones, setComisiones] = useState<Record<string, number>>({
    Luz: 25,
    Gas: 25,
    Telefonía: 25,
    Seguros: 25,
    Alarmas: 25,
  });
  const [loadingComisiones, setLoadingComisiones] = useState(false);
  const itemsPerPage = 20;

  const servicios = ["Luz", "Gas", "Telefonía", "Seguros", "Alarmas"];

  async function handleSave(id: string) {
    setSaving(true);

    // Save operario data
    const result = await updateOperario(id, editForm);
    if (result.error) {
      alert(`Error: ${result.error}`);
      setSaving(false);
      return;
    }

    // Save comisiones
    const comisionesData = servicios.map((s) => ({
      servicio: s,
      comision: comisiones[s] || 25,
    }));
    const comisionResult = await updateOperarioComisiones(id, comisionesData);
    if (comisionResult.error) {
      alert(`Error guardando comisiones: ${comisionResult.error}`);
    }

    setEditingId(null);
    window.location.reload();
    setSaving(false);
  }

  async function handleDelete(operario: Operario) {
    const name = operario.alias || operario.nombre || "este operario";
    if (!confirm(`¿Eliminar a "${name}"? Esta acción no se puede deshacer.`)) return;

    setDeleting(operario.id);
    const result = await deleteOperario(operario.id);
    if (result.error) {
      alert(`Error: ${result.error}`);
      setDeleting(null);
    } else {
      window.location.reload();
    }
  }

  async function startEdit(operario: Operario) {
    setEditingId(operario.id);
    setEditForm({
      alias: operario.alias || "",
      nombre: operario.nombre || "",
      email: operario.email || "",
      telefonos: operario.telefonos || "",
      tipo: operario.tipo || "",
      empresa: operario.empresa || "",
      cif: operario.cif || "",
      documento: operario.documento || "",
      direccion: operario.direccion || "",
      cuenta_bancaria: operario.cuenta_bancaria || "",
      nombre_admin: operario.nombre_admin || "",
      dni_admin: operario.dni_admin || "",
      password_operario: operario.password_operario || "",
      tiene_doc_autonomo: operario.tiene_doc_autonomo || false,
      tiene_doc_escritura: operario.tiene_doc_escritura || false,
      tiene_doc_cif: operario.tiene_doc_cif || false,
      tiene_doc_contrato: operario.tiene_doc_contrato || false,
      tiene_cuenta_bancaria: operario.tiene_cuenta_bancaria || false,
    });

    // Load custom comisiones
    setLoadingComisiones(true);
    const opComisiones = await getOperarioComisiones(operario.id);

    // Start with defaults, then override with custom
    const newComisiones: Record<string, number> = {
      Luz: 25,
      Gas: 25,
      Telefonía: 25,
      Seguros: 25,
      Alarmas: 25,
    };
    for (const c of opComisiones) {
      newComisiones[c.servicio] = c.comision;
    }
    setComisiones(newComisiones);
    setLoadingComisiones(false);
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (operarios.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No hay operarios
        </h3>
        <p className="text-gray-500">
          Importa datos desde un archivo Excel para comenzar.
        </p>
      </div>
    );
  }

  const filteredOperarios = operarios
    .filter((operario) => {
      const matchesSearch =
        searchTerm === "" ||
        operario.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operario.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        operario.telefonos?.includes(searchTerm);

      const matchesTipo = tipoFilter === "" || operario.tipo === tipoFilter;

      // Filtro por actividad
      let matchesActividad = true;
      if (actividadFilter === "activo") {
        matchesActividad = !isMoreThan3MonthsAgo(operario.ultima_carga);
      } else if (actividadFilter === "inactivo") {
        matchesActividad = isMoreThan3MonthsAgo(operario.ultima_carga);
      } else if (actividadFilter === "sin_cargas") {
        matchesActividad = !operario.ultima_carga;
      }

      // Filtro por documentación
      let matchesDocs = true;
      if (docsFilter === "completa") {
        matchesDocs = operario.tiene_doc_autonomo && operario.tiene_doc_escritura && operario.tiene_doc_cif && operario.tiene_doc_contrato;
      } else if (docsFilter === "incompleta") {
        matchesDocs = !operario.tiene_doc_autonomo || !operario.tiene_doc_escritura || !operario.tiene_doc_cif || !operario.tiene_doc_contrato;
      } else if (docsFilter === "sin_autonomo") {
        matchesDocs = !operario.tiene_doc_autonomo;
      } else if (docsFilter === "sin_contrato") {
        matchesDocs = !operario.tiene_doc_contrato;
      }

      return matchesSearch && matchesTipo && matchesActividad && matchesDocs;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "alias":
          return (a.alias || "").localeCompare(b.alias || "");
        case "nombre":
          return (a.nombre || a.empresa || "").localeCompare(b.nombre || b.empresa || "");
        case "ultima_carga_desc":
          if (!a.ultima_carga && !b.ultima_carga) return 0;
          if (!a.ultima_carga) return 1;
          if (!b.ultima_carga) return -1;
          return new Date(b.ultima_carga).getTime() - new Date(a.ultima_carga).getTime();
        case "ultima_carga_asc":
          if (!a.ultima_carga && !b.ultima_carga) return 0;
          if (!a.ultima_carga) return 1;
          if (!b.ultima_carga) return -1;
          return new Date(a.ultima_carga).getTime() - new Date(b.ultima_carga).getTime();
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const totalPages = Math.ceil(filteredOperarios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOperarios = filteredOperarios.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const DocStatus = ({ ok }: { ok: boolean }) =>
    ok ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    );

  const activeFiltersCount = [tipoFilter, actividadFilter, docsFilter].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          {/* Search row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por alias, nombre, empresa, email, teléfono..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent bg-white"
            >
              <option value="alias">Ordenar: Alias A-Z</option>
              <option value="nombre">Ordenar: Nombre A-Z</option>
              <option value="ultima_carga_desc">Ordenar: Última carga (reciente)</option>
              <option value="ultima_carga_asc">Ordenar: Última carga (antigua)</option>
              <option value="created_at">Ordenar: Fecha registro</option>
            </select>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            <select
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent bg-white"
            >
              <option value="">Tipo: Todos</option>
              <option value="Empresa">Empresa</option>
              <option value="Autonomo">Autónomo</option>
            </select>

            <select
              value={actividadFilter}
              onChange={(e) => {
                setActividadFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent bg-white"
            >
              <option value="">Actividad: Todos</option>
              <option value="activo">Activos (carga &lt;3 meses)</option>
              <option value="inactivo">Inactivos (&gt;3 meses)</option>
              <option value="sin_cargas">Sin cargas</option>
            </select>

            <select
              value={docsFilter}
              onChange={(e) => {
                setDocsFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent bg-white"
            >
              <option value="">Docs: Todos</option>
              <option value="completa">Documentación completa</option>
              <option value="incompleta">Documentación incompleta</option>
              <option value="sin_autonomo">Sin doc. autónomo</option>
              <option value="sin_contrato">Sin contrato</option>
            </select>

            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setTipoFilter("");
                  setActividadFilter("");
                  setDocsFilter("");
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm text-[#BB292A] hover:bg-red-50 rounded-lg flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Mostrando {paginatedOperarios.length} de {filteredOperarios.length}{" "}
        operarios
      </p>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Alias
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre / Empresa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Documentos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Última carga
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOperarios.map((operario) => {
                const isInactive = isMoreThan3MonthsAgo(operario.ultima_carga);
                return (
                <tr key={operario.id} className={`hover:bg-gray-50 ${isInactive ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${isInactive ? "text-red-600" : "text-gray-900"}`}>
                      {operario.alias || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {operario.tipo === "Empresa" ? (
                        <Building2 className="w-4 h-4 text-gray-400" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <p className="text-sm text-gray-900">
                          {operario.nombre || operario.empresa || "—"}
                        </p>
                        {operario.nombre && operario.empresa && (
                          <p className="text-xs text-gray-500">
                            {operario.empresa}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        operario.tipo === "Empresa"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {operario.tipo || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {operario.telefonos && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {operario.telefonos}
                        </div>
                      )}
                      {operario.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 truncate max-w-[180px]">
                          <Mail className="w-3 h-3" />
                          {operario.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" title="Autónomo / Escritura / CIF / Contrato">
                      <DocStatus ok={operario.tiene_doc_autonomo} />
                      <DocStatus ok={operario.tiene_doc_escritura} />
                      <DocStatus ok={operario.tiene_doc_cif} />
                      <DocStatus ok={operario.tiene_doc_contrato} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {operario.ultima_carga ? (
                      <span className={`text-xs ${isInactive ? "text-red-600 font-medium" : "text-gray-600"}`}>
                        {new Date(operario.ultima_carga).toLocaleDateString("es-ES")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Sin cargas</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => startEdit(operario)}
                        className="p-1.5 text-gray-500 hover:text-[#BB292A] hover:bg-gray-100 rounded"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(operario)}
                        disabled={deleting === operario.id}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="Eliminar"
                      >
                        {deleting === operario.id ? (
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
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {paginatedOperarios.map((operario) => (
          <div
            key={operario.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="font-medium text-[#BB292A]">
                  {operario.alias || "—"}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {operario.tipo === "Empresa" ? (
                    <Building2 className="w-4 h-4 text-gray-400" />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">
                    {operario.nombre || operario.empresa || "—"}
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  operario.tipo === "Empresa"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}
              >
                {operario.tipo || "—"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-3">
              {operario.telefonos && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {operario.telefonos}
                </div>
              )}
              {operario.email && (
                <div className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3" />
                  {operario.email}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">Documentos:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <DocStatus ok={operario.tiene_doc_autonomo} />
                    <span className="text-gray-500">Aut.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DocStatus ok={operario.tiene_doc_escritura} />
                    <span className="text-gray-500">Esc.</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DocStatus ok={operario.tiene_doc_cif} />
                    <span className="text-gray-500">CIF</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DocStatus ok={operario.tiene_doc_contrato} />
                    <span className="text-gray-500">Cont.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Operario</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alias</label>
                  <input
                    type="text"
                    value={editForm.alias || ""}
                    onChange={(e) => setEditForm({ ...editForm, alias: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={editForm.tipo || ""}
                    onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Empresa">Empresa</option>
                    <option value="Autonomo">Autónomo</option>
                  </select>
                </div>
              </div>

              {/* Fields for Autonomo */}
              {editForm.tipo === "Autonomo" && (
                <div className="bg-purple-50 p-4 rounded-lg space-y-4">
                  <h4 className="text-sm font-medium text-purple-900">Datos Autónomo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellidos</label>
                      <input
                        type="text"
                        value={editForm.nombre || ""}
                        onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documento (DNI/NIE)</label>
                      <input
                        type="text"
                        value={editForm.documento || ""}
                        onChange={(e) => setEditForm({ ...editForm, documento: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fields for Empresa */}
              {editForm.tipo === "Empresa" && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                  <h4 className="text-sm font-medium text-blue-900">Datos Empresa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
                      <input
                        type="text"
                        value={editForm.empresa || ""}
                        onChange={(e) => setEditForm({ ...editForm, empresa: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CIF</label>
                      <input
                        type="text"
                        value={editForm.cif || ""}
                        onChange={(e) => setEditForm({ ...editForm, cif: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellidos del Administrador</label>
                      <input
                        type="text"
                        value={editForm.nombre_admin || ""}
                        onChange={(e) => setEditForm({ ...editForm, nombre_admin: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documento del Administrador</label>
                      <input
                        type="text"
                        value={editForm.dni_admin || ""}
                        onChange={(e) => setEditForm({ ...editForm, dni_admin: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Info - Always visible */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfonos</label>
                  <input
                    type="text"
                    value={editForm.telefonos || ""}
                    onChange={(e) => setEditForm({ ...editForm, telefonos: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={editForm.direccion || ""}
                    onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria (IBAN)</label>
                  <input
                    type="text"
                    value={editForm.cuenta_bancaria || ""}
                    onChange={(e) => setEditForm({ ...editForm, cuenta_bancaria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña del Operario</label>
                <input
                  type="text"
                  value={editForm.password_operario || ""}
                  onChange={(e) => setEditForm({ ...editForm, password_operario: e.target.value })}
                  placeholder="Contraseña que usará el operario"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                />
              </div>

              {/* Documents Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Documentos Recibidos</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.tiene_doc_autonomo || false}
                      onChange={(e) => setEditForm({ ...editForm, tiene_doc_autonomo: e.target.checked })}
                      className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
                    />
                    <span className="text-sm text-gray-700">Doc. Autónomo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.tiene_doc_escritura || false}
                      onChange={(e) => setEditForm({ ...editForm, tiene_doc_escritura: e.target.checked })}
                      className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
                    />
                    <span className="text-sm text-gray-700">Doc. Escritura</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.tiene_doc_cif || false}
                      onChange={(e) => setEditForm({ ...editForm, tiene_doc_cif: e.target.checked })}
                      className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
                    />
                    <span className="text-sm text-gray-700">Doc. CIF</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.tiene_doc_contrato || false}
                      onChange={(e) => setEditForm({ ...editForm, tiene_doc_contrato: e.target.checked })}
                      className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
                    />
                    <span className="text-sm text-gray-700">Doc. Contrato</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.tiene_cuenta_bancaria || false}
                      onChange={(e) => setEditForm({ ...editForm, tiene_cuenta_bancaria: e.target.checked })}
                      className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
                    />
                    <span className="text-sm text-gray-700">Cuenta Bancaria</span>
                  </label>
                </div>

                {/* Document requirements warning */}
                {editForm.tipo && (
                  <div className="mt-3 text-xs">
                    {editForm.tipo === "Autonomo" ? (
                      <p className={`${
                        editForm.tiene_cuenta_bancaria && editForm.tiene_doc_autonomo && editForm.tiene_doc_contrato
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}>
                        {editForm.tiene_cuenta_bancaria && editForm.tiene_doc_autonomo && editForm.tiene_doc_contrato
                          ? "✓ Documentación completa para facturación"
                          : "⚠ Para facturar se requiere: Cuenta bancaria, Doc. Autónomo, Doc. Contrato"}
                      </p>
                    ) : (
                      <p className={`${
                        editForm.tiene_cuenta_bancaria && editForm.tiene_doc_cif && editForm.tiene_doc_escritura && editForm.tiene_doc_contrato
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}>
                        {editForm.tiene_cuenta_bancaria && editForm.tiene_doc_cif && editForm.tiene_doc_escritura && editForm.tiene_doc_contrato
                          ? "✓ Documentación completa para facturación"
                          : "⚠ Para facturar se requiere: Cuenta bancaria, Doc. CIF, Doc. Escritura, Doc. Contrato"}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Comisiones personalizadas */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-900 mb-3 flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Comisiones Personalizadas
                </h4>
                <p className="text-xs text-yellow-700 mb-3">
                  Define comisiones diferentes a las por defecto (25€) para este operario.
                </p>
                {loadingComisiones ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cargando comisiones...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {servicios.map((servicio) => (
                      <div key={servicio}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {servicio}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={comisiones[servicio] || 25}
                            onChange={(e) =>
                              setComisiones({
                                ...comisiones,
                                [servicio]: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={`w-full px-3 py-2 pr-6 border rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A] ${
                              comisiones[servicio] !== 25
                                ? "border-yellow-400 bg-yellow-50"
                                : "border-gray-300"
                            }`}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                            €
                          </span>
                        </div>
                        {comisiones[servicio] !== 25 && (
                          <p className="text-[10px] text-yellow-600 mt-0.5">Personalizada</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSave(editingId)}
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
