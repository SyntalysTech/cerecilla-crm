"use client";

import { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Zap,
  Flame,
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  AlertCircle,
} from "lucide-react";

interface Cliente {
  id: string;
  operador: string | null;
  servicio: string | null;
  estado: string | null;
  tipo_persona: string | null;
  nombre_apellidos: string | null;
  razon_social: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  cups_gas: string | null;
  cups_luz: string | null;
  compania_gas: string | null;
  compania_luz: string | null;
  facturado: boolean;
  cobrado: boolean;
  pagado: boolean;
  created_at: string;
}

interface ClientesListProps {
  clientes: Cliente[];
  error?: string;
}

const estadoColors: Record<string, string> = {
  LIQUIDADO: "bg-green-100 text-green-700",
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  EN_PROCESO: "bg-blue-100 text-blue-700",
  CANCELADO: "bg-red-100 text-red-700",
};

export function ClientesList({ clientes, error }: ClientesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [servicioFilter, setServicioFilter] = useState<string>("");
  const itemsPerPage = 20;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          No hay clientes
        </h3>
        <p className="text-gray-500">
          Importa datos desde un archivo Excel para comenzar.
        </p>
      </div>
    );
  }

  const filteredClientes = clientes.filter((cliente) => {
    const matchesSearch =
      searchTerm === "" ||
      cliente.nombre_apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.operador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono?.includes(searchTerm);

    const matchesServicio =
      servicioFilter === "" || cliente.servicio === servicioFilter;

    return matchesSearch && matchesServicio;
  });

  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClientes = filteredClientes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, operador..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
          />
        </div>
        <select
          value={servicioFilter}
          onChange={(e) => {
            setServicioFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
        >
          <option value="">Todos los servicios</option>
          <option value="Luz">Luz</option>
          <option value="Gas">Gas</option>
          <option value="Luz y Gas">Luz y Gas</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Mostrando {paginatedClientes.length} de {filteredClientes.length}{" "}
        clientes
      </p>

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Servicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Operador
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Facturas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedClientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {cliente.tipo_persona === "Persona Juridica" ? (
                        <Building2 className="w-4 h-4 text-gray-400" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {cliente.nombre_apellidos || cliente.razon_social || "—"}
                        </p>
                        {cliente.direccion && (
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {cliente.direccion}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {cliente.servicio === "Luz" && (
                        <Zap className="w-4 h-4 text-yellow-500" />
                      )}
                      {cliente.servicio === "Gas" && (
                        <Flame className="w-4 h-4 text-orange-500" />
                      )}
                      {cliente.servicio === "Luz y Gas" && (
                        <>
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <Flame className="w-4 h-4 text-orange-500" />
                        </>
                      )}
                      <span className="text-sm text-gray-600">
                        {cliente.servicio || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 truncate block max-w-[150px]">
                      {cliente.operador || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {cliente.estado ? (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          estadoColors[cliente.estado] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {cliente.estado}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {cliente.telefono && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {cliente.telefono}
                        </div>
                      )}
                      {cliente.email && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 truncate max-w-[180px]">
                          <Mail className="w-3 h-3" />
                          {cliente.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cliente.facturado ? "bg-green-500" : "bg-gray-300"
                        }`}
                        title="Facturado"
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cliente.cobrado ? "bg-blue-500" : "bg-gray-300"
                        }`}
                        title="Cobrado"
                      />
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cliente.pagado ? "bg-purple-500" : "bg-gray-300"
                        }`}
                        title="Pagado"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {paginatedClientes.map((cliente) => (
          <div
            key={cliente.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {cliente.tipo_persona === "Persona Juridica" ? (
                  <Building2 className="w-4 h-4 text-gray-400" />
                ) : (
                  <User className="w-4 h-4 text-gray-400" />
                )}
                <span className="font-medium text-gray-900">
                  {cliente.nombre_apellidos || cliente.razon_social || "—"}
                </span>
              </div>
              {cliente.estado && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    estadoColors[cliente.estado] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {cliente.estado}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                {cliente.servicio === "Luz" && (
                  <Zap className="w-4 h-4 text-yellow-500" />
                )}
                {cliente.servicio === "Gas" && (
                  <Flame className="w-4 h-4 text-orange-500" />
                )}
                {cliente.servicio === "Luz y Gas" && (
                  <>
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <Flame className="w-4 h-4 text-orange-500" />
                  </>
                )}
                <span className="text-gray-600">{cliente.servicio || "—"}</span>
              </div>
              <div className="text-gray-500 truncate">
                {cliente.operador || "—"}
              </div>
            </div>

            {(cliente.telefono || cliente.email) && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-3 text-xs text-gray-600">
                {cliente.telefono && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {cliente.telefono}
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" />
                    {cliente.email}
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
}
