"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  X,
  Bell,
} from "lucide-react";

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
  observaciones: string | null;
  observaciones_admin: string | null;
  created_at: string;
}

interface ClientesListProps {
  clientes: Cliente[];
  error?: string;
}

const estadoColors: Record<string, string> = {
  LIQUIDADO: "bg-green-500 text-white",
  PENDIENTE: "bg-yellow-500 text-white",
  EN_PROCESO: "bg-blue-500 text-white",
  FALLIDO: "bg-red-500 text-white",
  CANCELADO: "bg-gray-500 text-white",
};

function ActionMenu({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="w-40 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
    >
      <button
        onClick={() => {
          // TODO: Implement view
          alert(`Ver ficha de ${cliente.nombre_apellidos || cliente.razon_social}`);
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        Ver ficha
      </button>
      <button
        onClick={() => {
          // TODO: Implement edit
          alert(`Editar ${cliente.nombre_apellidos || cliente.razon_social}`);
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </button>
      <button
        onClick={() => {
          // TODO: Implement delete
          if (confirm(`¿Eliminar a ${cliente.nombre_apellidos || cliente.razon_social}?`)) {
            alert("Eliminado (pendiente de implementar)");
          }
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Eliminar
      </button>
    </div>
  );
}

function ObservacionesModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
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
        second: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // Get the observation text (prefer observaciones, fallback to observaciones_admin)
  const observacionTexto = cliente.observaciones || cliente.observaciones_admin || "Sin observaciones";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-[#2c3e50] rounded-lg shadow-2xl w-80 text-white" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-gray-400 text-sm">Las observaciones del cliente</p>
            <p className="text-gray-400 text-sm">han cambiado a: <span className="text-white font-medium uppercase">{observacionTexto}</span></p>
          </div>

          <div className="border-t border-gray-600 pt-3">
            <p className="text-gray-400 text-sm">Ultima Actualizacion:</p>
            <p className="text-white text-sm font-medium">{formatDate(cliente.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const searchFields = [
  { value: "nombre_apellidos", label: "NOMBRE Y APELLIDOS" },
  { value: "documento_nuevo_titular", label: "DOCUMENTO" },
  { value: "razon_social", label: "EMPRESA" },
  { value: "telefono", label: "TELEFONO" },
  { value: "cups_gas", label: "CUPS GAS" },
  { value: "cups_luz", label: "CUPS LUZ" },
  { value: "operador", label: "OPERADOR" },
  { value: "direccion", label: "CALLE" },
  { value: "estado", label: "ESTADO" },
  { value: "servicio", label: "SERVICIO" },
  { value: "email", label: "EMAIL" },
  { value: "cuenta_bancaria", label: "CUENTA BANCARIA" },
];

export function ClientesList({ clientes, error }: ClientesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("nombre_apellidos");
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [observacionesCliente, setObservacionesCliente] = useState<Cliente | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 20;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFieldDropdown(false);
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

  // Debug: log search parameters
  console.log("Filter Debug:", { searchTerm, searchField, totalClientes: clientes.length });

  const filteredClientes = clientes.filter((cliente) => {
    if (searchTerm.trim() === "") return true;

    const searchLower = searchTerm.toLowerCase().trim();

    // Special case: when searching by nombre, also search razon_social
    if (searchField === "nombre_apellidos") {
      const nombre = cliente.nombre_apellidos?.toLowerCase() || "";
      const razon = cliente.razon_social?.toLowerCase() || "";
      return nombre.includes(searchLower) || razon.includes(searchLower);
    }

    const fieldValue = cliente[searchField as keyof Cliente];
    if (fieldValue === null || fieldValue === undefined) return false;

    return String(fieldValue).toLowerCase().includes(searchLower);
  });

  // Debug: log filtered results
  console.log("Filter Results:", { filtered: filteredClientes.length });

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClientes = filteredClientes.slice(
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

  return (
    <div className="space-y-4">
      {/* Search Bar - Like old CRM */}
      <div className="flex items-center gap-2">
        {/* Field selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowFieldDropdown(!showFieldDropdown)}
            className="px-3 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 min-w-[180px] justify-between"
          >
            {searchFields.find(f => f.value === searchField)?.label}
            <ChevronRight className={`w-4 h-4 transition-transform ${showFieldDropdown ? "rotate-90" : ""}`} />
          </button>
          {showFieldDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchFields.map((field) => (
                <button
                  key={field.value}
                  onClick={() => {
                    setSearchField(field.value);
                    setShowFieldDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-[#2196F3] hover:text-white ${
                    searchField === field.value ? "bg-[#2196F3] text-white" : "text-gray-700"
                  }`}
                >
                  {field.label}
                </button>
              ))}
            </div>
          )}
        </div>

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
          {filteredClientes.length} de {clientes.length} clientes
        </span>
      </div>

      {/* Full width table with horizontal scroll */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
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
                        onClick={() => setObservacionesCliente(cliente)}
                        className={`p-1 rounded ${
                          cliente.observaciones || cliente.observaciones_admin
                            ? "text-yellow-600 hover:bg-yellow-100"
                            : "text-gray-300 hover:bg-gray-100"
                        }`}
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
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        cliente.estado === "LIQUIDADO" ? "bg-green-500" :
                        cliente.estado === "FALLIDO" ? "bg-red-500" :
                        cliente.estado === "PENDIENTE" ? "bg-yellow-500" : "bg-gray-400"
                      }`}>
                        {(cliente.nombre_apellidos || cliente.razon_social || "?")[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">
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
                      25€
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-gray-600">
                    {cliente.servicio || "—"}
                  </td>
                  <td className="px-2 py-2 max-w-[200px] truncate text-gray-600" title={cliente.direccion || ""}>
                    {cliente.direccion || "—"}
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
      {openMenuId && menuPosition && (
        <div style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left, zIndex: 100 }}>
          <ActionMenu
            cliente={paginatedClientes.find(c => c.id === openMenuId)!}
            onClose={() => {
              setOpenMenuId(null);
              setMenuPosition(null);
            }}
          />
        </div>
      )}

      {/* Modal de observaciones */}
      {observacionesCliente && (
        <ObservacionesModal
          cliente={observacionesCliente}
          onClose={() => setObservacionesCliente(null)}
        />
      )}
    </div>
  );
}
