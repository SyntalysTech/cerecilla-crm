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
} from "lucide-react";

interface Operario {
  id: string;
  email: string | null;
  alias: string | null;
  telefonos: string | null;
  tiene_doc_autonomo: boolean;
  tiene_doc_escritura: boolean;
  tiene_doc_cif: boolean;
  tiene_doc_contrato: boolean;
  tipo: string | null;
  nombre: string | null;
  documento: string | null;
  empresa: string | null;
  cif: string | null;
  cuenta_bancaria: string | null;
  direccion: string | null;
  created_at: string;
}

interface OperariosListProps {
  operarios: Operario[];
  error?: string;
}

export function OperariosList({ operarios, error }: OperariosListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const itemsPerPage = 20;

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

  const filteredOperarios = operarios.filter((operario) => {
    const matchesSearch =
      searchTerm === "" ||
      operario.alias?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operario.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      operario.telefonos?.includes(searchTerm);

    const matchesTipo = tipoFilter === "" || operario.tipo === tipoFilter;

    return matchesSearch && matchesTipo;
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por alias, nombre, empresa..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={(e) => {
            setTipoFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
        >
          <option value="">Todos los tipos</option>
          <option value="Empresa">Empresa</option>
          <option value="Autonomo">Autónomo</option>
        </select>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOperarios.map((operario) => (
                <tr key={operario.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#BB292A]">
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
                </tr>
              ))}
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
    </div>
  );
}
