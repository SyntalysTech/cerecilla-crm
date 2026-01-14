"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  X,
  Bell,
  ArrowUpAZ,
  ArrowDownAZ,
  Loader2,
  Copy,
} from "lucide-react";
import { deleteCliente, duplicateCliente, getClienteObservaciones } from "./actions";

interface Cliente {
  id: string;
  operador: string | null;
  servicio: string | null;
  estado: string | null;
  tipo_persona: string | null;
  nombre_apellidos: string | null;
  razon_social: string | null;
  documento_nuevo_titular: string | null;
  documento_anterior_titular: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  cuenta_bancaria: string | null;
  cups_gas: string | null;
  cups_luz: string | null;
  compania_gas: string | null;
  compania_luz: string | null;
  potencia_gas: string | null;
  potencia_luz: string | null;
  facturado: boolean;
  cobrado: boolean;
  pagado: boolean;
  factura_pagos: string | null;
  factura_cobros: string | null;
  precio_kw_gas: string | null;
  precio_kw_luz: string | null;
  created_at: string;
}

interface ClientesListProps {
  clientes: Cliente[];
  error?: string;
}

const estadoColors: Record<string, string> = {
  LIQUIDADO: "bg-gray-900 text-white",
  "SIN ESTADO": "bg-blue-500 text-white",
  SEGUIMIENTO: "bg-green-400 text-white",
  "PENDIENTE DOC": "bg-amber-500 text-white",
  "EN TRAMITE": "bg-green-600 text-white",
  COMISIONABLE: "bg-purple-500 text-white",
  FINALIZADO: "bg-emerald-600 text-white",
  FALLIDO: "bg-red-500 text-white",
  CANCELADO: "bg-gray-500 text-white",
};

// Helper to calculate commission based on services
function calculateComision(servicio: string | null): string {
  if (!servicio) return "0€";

  const servicios = servicio.split(", ").filter(Boolean);
  let total = 0;

  for (const s of servicios) {
    if (s === "Luz" || s === "Gas") {
      total += 25; // Luz y Gas: 25€ cada uno
    } else if (s === "Telefonía") {
      total += 50; // Telefonía: 50€
    } else if (s === "Alarmas") {
      total += 50; // Alarmas: 50€
    }
    // Seguros: 10% del precio de la póliza - se calcula aparte
  }

  if (servicios.includes("Seguros")) {
    if (total > 0) {
      return `${total}€ + 10%`;
    }
    return "10%";
  }

  return total > 0 ? `${total}€` : "0€";
}

function ActionMenu({ cliente, onClose, onRefresh }: { cliente: Cliente; onClose: () => void; onRefresh: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  async function handleDuplicate() {
    setDuplicating(true);
    const result = await duplicateCliente(cliente.id);

    if (result.error) {
      alert(`Error: ${result.error}`);
      setDuplicating(false);
    } else {
      onRefresh();
      onClose();
    }
  }

  async function handleDelete() {
    const name = cliente.nombre_apellidos || cliente.razon_social || "este cliente";
    if (!confirm(`¿Estás seguro de eliminar a "${name}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setDeleting(true);
    const result = await deleteCliente(cliente.id);

    if (result.error) {
      alert(`Error: ${result.error}`);
      setDeleting(false);
    } else {
      onRefresh();
      onClose();
    }
  }

  return (
    <div
      ref={menuRef}
      className="w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
    >
      <button
        onClick={() => {
          router.push(`/clientes/${cliente.id}`);
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        Ver ficha
      </button>
      <button
        onClick={() => {
          router.push(`/clientes/${cliente.id}/edit`);
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </button>
      <button
        onClick={handleDuplicate}
        disabled={duplicating}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
      >
        {duplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
        {duplicating ? "Duplicando..." : "Duplicar"}
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
      >
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        {deleting ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  );
}

interface Observacion {
  id: string;
  mensaje: string;
  es_admin: boolean;
  user_name: string | null;
  user_email: string | null;
  created_at: string;
}

function ObservacionesModal({ clienteId, clienteName, onClose }: { clienteId: string; clienteName: string; onClose: () => void }) {
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchObservaciones() {
      setLoading(true);
      const result = await getClienteObservaciones(clienteId);
      setObservaciones(result.observaciones);
      setIsAdmin(result.isAdmin);
      setLoading(false);
    }
    fetchObservaciones();
  }, [clienteId]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }) + " " + date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Separate normal and admin observations
  const normalObs = observaciones.filter(o => !o.es_admin);
  const adminObs = observaciones.filter(o => o.es_admin);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-[#2c3e50] rounded-lg shadow-2xl w-full max-w-2xl text-white" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-gray-600 flex items-center justify-between">
          <h3 className="font-medium">Observaciones - {clienteName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with scroll */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : observaciones.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin observaciones</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Normal observations column */}
              <div>
                <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
                  Observaciones con Operador
                </h4>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                  {normalObs.length === 0 ? (
                    <p className="text-gray-500 text-xs italic">Sin observaciones</p>
                  ) : (
                    normalObs.map((obs) => (
                      <div key={obs.id} className="bg-[#34495e] rounded p-3">
                        <p className="text-white text-sm whitespace-pre-wrap">{obs.mensaje}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                          <span>{obs.user_name || obs.user_email || "Sistema"}</span>
                          <span>{formatDate(obs.created_at)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Admin observations column - only show if user is admin */}
              {isAdmin && (
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3">
                    Observaciones de Administración
                  </h4>
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                    {adminObs.length === 0 ? (
                      <p className="text-gray-500 text-xs italic">Sin observaciones admin</p>
                    ) : (
                      adminObs.map((obs) => (
                        <div key={obs.id} className="bg-[#5d4e37] rounded p-3 border-l-2 border-yellow-500">
                          <p className="text-white text-sm whitespace-pre-wrap">{obs.mensaje}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                            <span>{obs.user_name || obs.user_email || "Admin"}</span>
                            <span>{formatDate(obs.created_at)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const filterFields = [
  { value: "", label: "TODOS", hasSubOptions: false },
  { value: "nombre_apellidos", label: "NOMBRE Y APELLIDOS", hasSubOptions: true, subOptions: [
    { value: "asc", label: "A → Z" },
    { value: "desc", label: "Z → A" },
  ]},
  { value: "documento_nuevo_titular", label: "DOCUMENTO", hasSubOptions: true, subOptions: [
    { value: "all", label: "TODOS" },
    { value: "dni", label: "DNI (8 números + letra)" },
    { value: "nie", label: "NIE (X/Y/Z + números)" },
    { value: "cif", label: "CIF (letra + números)" },
  ]},
  { value: "razon_social", label: "EMPRESA", hasSubOptions: false },
  { value: "telefono", label: "TELEFONO", hasSubOptions: false },
  { value: "cups_gas", label: "CUPS GAS", hasSubOptions: false },
  { value: "cups_luz", label: "CUPS LUZ", hasSubOptions: false },
  { value: "operador", label: "OPERADOR", hasSubOptions: false },
  { value: "direccion", label: "CALLE", hasSubOptions: false },
  { value: "estado", label: "ESTADO", hasSubOptions: true, subOptions: [
    { value: "all", label: "TODOS" },
    { value: "PENDIENTE", label: "PENDIENTE" },
    { value: "SEGUIMIENTO", label: "SEGUIMIENTO" },
    { value: "EN TRAMITE", label: "EN TRAMITE" },
    { value: "COMISIONABLE", label: "COMISIONABLE" },
    { value: "LIQUIDADO", label: "LIQUIDADO" },
    { value: "FALLIDO", label: "FALLIDO" },
  ]},
  { value: "servicio", label: "SERVICIO", hasSubOptions: true, subOptions: [
    { value: "all", label: "TODOS" },
    { value: "Luz", label: "LUZ" },
    { value: "Gas", label: "GAS" },
    { value: "Telefonía", label: "TELEFONÍA" },
    { value: "Seguros", label: "SEGUROS" },
    { value: "Alarmas", label: "ALARMAS" },
  ]},
  { value: "email", label: "EMAIL", hasSubOptions: false },
  { value: "cuenta_bancaria", label: "CUENTA BANCARIA", hasSubOptions: false },
];

export function ClientesList({ clientes, error }: ClientesListProps) {
  const searchParams = useSearchParams();
  const initialEstado = searchParams.get("estado");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState(initialEstado ? "estado" : ""); // Campo activo para filtrar (vacío = todos)
  const [subFilterValue, setSubFilterValue] = useState(initialEstado || ""); // Valor del subfiltro (orden, tipo doc, etc.)
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [observacionesModal, setObservacionesModal] = useState<{ clienteId: string; clienteName: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const subDropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 20;

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFieldDropdown(false);
      }
      if (subDropdownRef.current && !subDropdownRef.current.contains(event.target as Node)) {
        setShowSubDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpenMenu = (clienteId: string, event: React.MouseEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    setOpenMenuId(openMenuId === clienteId ? null : clienteId);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <X className="w-5 h-5 text-red-600" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No hay clientes
        </h3>
        <p className="text-gray-500">
          Importa datos desde un archivo Excel para comenzar.
        </p>
      </div>
    );
  }

  // Helper to check document type
  const getDocumentType = (doc: string | null): string => {
    if (!doc) return "unknown";
    const cleaned = doc.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (/^[XYZ]\d+[A-Z]?$/.test(cleaned)) return "nie";
    if (/^[A-Z]\d{7}[A-Z0-9]$/.test(cleaned)) return "cif";
    if (/^\d{8}[A-Z]$/.test(cleaned)) return "dni";
    return "other";
  };

  const filteredClientes = clientes.filter((cliente) => {
    // First apply the field filter (show only clients that have this field with a value)
    if (activeFilter !== "") {
      const fieldValue = cliente[activeFilter as keyof Cliente];
      if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
        return false;
      }

      // Apply sub-filter if active
      if (subFilterValue && subFilterValue !== "all" && subFilterValue !== "asc" && subFilterValue !== "desc") {
        // For documento filter by type
        if (activeFilter === "documento_nuevo_titular") {
          const docType = getDocumentType(cliente.documento_nuevo_titular);
          if (docType !== subFilterValue) return false;
        }
        // For estado filter by value (case-insensitive)
        if (activeFilter === "estado") {
          const clienteEstado = (cliente.estado || "").toUpperCase();
          const filterEstado = subFilterValue.toUpperCase();
          if (clienteEstado !== filterEstado) return false;
        }
        // For servicio filter by exact value
        if (activeFilter === "servicio") {
          if (cliente.servicio !== subFilterValue) return false;
        }
      }
    }

    // Then apply the search term if any
    if (searchTerm.trim() === "") return true;

    const searchLower = searchTerm.toLowerCase().trim();

    // Search across multiple fields
    const searchableFields = [
      cliente.nombre_apellidos,
      cliente.razon_social,
      cliente.documento_nuevo_titular,
      cliente.email,
      cliente.telefono,
      cliente.operador,
      cliente.direccion,
      cliente.estado,
      cliente.servicio,
    ];

    return searchableFields.some(field =>
      field?.toLowerCase().includes(searchLower)
    );
  });

  // Sort if needed (for nombre_apellidos)
  const sortedClientes = [...filteredClientes];
  if (activeFilter === "nombre_apellidos" && (subFilterValue === "asc" || subFilterValue === "desc")) {
    sortedClientes.sort((a, b) => {
      const nameA = (a.nombre_apellidos || a.razon_social || "").toLowerCase();
      const nameB = (b.nombre_apellidos || b.razon_social || "").toLowerCase();
      if (subFilterValue === "asc") {
        return nameA.localeCompare(nameB, "es");
      } else {
        return nameB.localeCompare(nameA, "es");
      }
    });
  }

  const totalPages = Math.ceil(sortedClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClientes = sortedClientes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-ES");
    } catch {
      return "—";
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 10;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 5) {
        for (let i = 1; i <= 7; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 4) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 6; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  // Get current filter config
  const currentFilterConfig = filterFields.find(f => f.value === activeFilter);
  const hasSubOptions = currentFilterConfig?.hasSubOptions && currentFilterConfig?.subOptions;

  return (
    <div className="space-y-4">
      {/* Search Bar - Like old CRM */}
      <div className="flex items-center gap-2">
        {/* Filter dropdown - click to filter instantly */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowFieldDropdown(!showFieldDropdown)}
            className="px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 min-w-[180px] justify-between"
          >
            {filterFields.find(f => f.value === activeFilter)?.label || "TODOS"}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFieldDropdown ? "rotate-180" : ""}`} />
          </button>
          {showFieldDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
              {filterFields.map((field) => (
                <button
                  key={field.value}
                  onClick={() => {
                    setActiveFilter(field.value);
                    setSubFilterValue(""); // Reset sub filter
                    setShowFieldDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[#2196F3] hover:text-white ${
                    activeFilter === field.value ? "bg-[#2196F3] text-white" : "text-gray-700"
                  }`}
                >
                  {field.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sub-filter dropdown (appears when filter has sub-options) */}
        {hasSubOptions && (
          <div className="relative" ref={subDropdownRef}>
            <button
              onClick={() => setShowSubDropdown(!showSubDropdown)}
              className="px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 min-w-[140px] justify-between"
            >
              {currentFilterConfig.subOptions?.find(s => s.value === subFilterValue)?.label ||
               (activeFilter === "nombre_apellidos" ? "Ordenar" : "Filtrar")}
              <ChevronDown className={`w-4 h-4 transition-transform ${showSubDropdown ? "rotate-180" : ""}`} />
            </button>
            {showSubDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
                {currentFilterConfig.subOptions?.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSubFilterValue(option.value);
                      setShowSubDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[#2196F3] hover:text-white ${
                      subFilterValue === option.value ? "bg-[#2196F3] text-white" : "text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Búsqueda..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
          />
        </div>

        {/* Results count */}
        <span className="text-sm text-gray-500">
          {sortedClientes.length} de {clientes.length} clientes
        </span>
      </div>

      {/* Full width table with horizontal scroll */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 cursor-grab active:cursor-grabbing"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#9ca3af #f3f4f6'
          }}
          onMouseDown={(e) => {
            const el = e.currentTarget;
            el.style.cursor = 'grabbing';
            const startX = e.pageX - el.offsetLeft;
            const scrollLeft = el.scrollLeft;

            const handleMouseMove = (e: MouseEvent) => {
              const x = e.pageX - el.offsetLeft;
              const walk = (x - startX) * 1.5;
              el.scrollLeft = scrollLeft - walk;
            };

            const handleMouseUp = () => {
              el.style.cursor = 'grab';
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <table className="w-full text-xs">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-center font-medium text-gray-600 uppercase whitespace-nowrap w-10"></th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Nombre y Apellidos</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Documento</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Email</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Teléfono</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Estado</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Comisión</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Suministros</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Dirección</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Fecha</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Operador</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Cuenta Bancaria</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">CUPS Gas</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">CUPS Luz</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Compañía Gas</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Compañía Luz</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Potencia Gas</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Potencia Luz</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Facturado</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Cobrado</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Pagado</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Factura de Pagos</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Factura de Cobros</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Precio KW Gas</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Precio KW Luz</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">Nombre Empresa</th>
                <th className="px-2 py-2 text-left font-medium text-gray-600 uppercase whitespace-nowrap">CIF Empresa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setObservacionesModal({
                          clienteId: cliente.id,
                          clienteName: cliente.nombre_apellidos || cliente.razon_social || "Cliente"
                        })}
                        className="p-1 rounded text-yellow-600 hover:bg-yellow-100"
                        title="Ver observaciones"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleOpenMenu(cliente.id, e)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-2 min-w-[180px] max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
                        cliente.estado === "LIQUIDADO" ? "bg-green-500" :
                        cliente.estado === "FALLIDO" ? "bg-red-500" :
                        cliente.estado === "PENDIENTE" ? "bg-yellow-500" : "bg-gray-400"
                      }`}>
                        {(cliente.nombre_apellidos || cliente.razon_social || "?")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 break-words line-clamp-2">
                        {cliente.nombre_apellidos || cliente.razon_social || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.documento_nuevo_titular || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.email || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.telefono || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {cliente.estado ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${estadoColors[cliente.estado] || "bg-gray-400 text-white"}`}>
                        {cliente.estado}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                      {calculateComision(cliente.servicio)}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.servicio || "—"}
                  </td>
                  <td className="px-2 py-2 min-w-[150px] max-w-[200px] text-gray-600" title={cliente.direccion || ""}>
                    <span className="break-words line-clamp-2">{cliente.direccion || "—"}</span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {formatDate(cliente.created_at)}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600 max-w-[150px] truncate" title={cliente.operador || ""}>
                    {cliente.operador || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600 font-mono text-[10px]">
                    {cliente.cuenta_bancaria || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600 font-mono text-[10px]">
                    {cliente.cups_gas || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600 font-mono text-[10px]">
                    {cliente.cups_luz || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.compania_gas || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.compania_luz || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.potencia_gas || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.potencia_luz || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    {cliente.facturado ? "✓" : "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    {cliente.cobrado ? "✓" : "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    {cliente.pagado ? "✓" : "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.factura_pagos || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.factura_cobros || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.precio_kw_gas || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.precio_kw_luz || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.razon_social || "—"}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.tipo_persona === "Persona Juridica" ? cliente.documento_nuevo_titular : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - Like old CRM */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            «
          </button>
          {getPageNumbers().map((page, idx) => (
            <button
              key={idx}
              onClick={() => typeof page === "number" && setCurrentPage(page)}
              disabled={page === "..."}
              className={`px-3 py-1 text-sm rounded ${
                page === currentPage
                  ? "bg-[#2196F3] text-white"
                  : page === "..."
                  ? "text-gray-400 cursor-default"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {typeof page === "number" ? page.toString().padStart(3, "0") : page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            »
          </button>
        </div>
      )}

      {/* Action Menu - Fixed position */}
      {openMenuId && menuPosition && paginatedClientes.find(c => c.id === openMenuId) && (
        <div
          style={{
            position: "fixed",
            top: Math.min(menuPosition.top, window.innerHeight - 200),
            left: Math.min(menuPosition.left, window.innerWidth - 180),
            zIndex: 9999
          }}
        >
          <ActionMenu
            cliente={paginatedClientes.find(c => c.id === openMenuId)!}
            onClose={() => {
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
            onRefresh={() => {
              window.location.reload();
            }}
          />
        </div>
      )}

      {/* Modal de observaciones */}
      {observacionesModal && (
        <ObservacionesModal
          clienteId={observacionesModal.clienteId}
          clienteName={observacionesModal.clienteName}
          onClose={() => setObservacionesModal(null)}
        />
      )}
    </div>
  );
}
