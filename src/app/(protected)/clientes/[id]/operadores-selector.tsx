"use client";

import { useState, useEffect, useRef } from "react";
import { Users, X, Plus, Loader2, Search } from "lucide-react";
import { updateClienteOperadores } from "../actions";

interface Operario {
  id: string;
  nombre: string;
}

interface OperadoresSelectorProps {
  clienteId: string;
  allOperarios: Operario[];
  assignedOperarios: Operario[];
  createdByEmail?: string | null;
}

export function OperadoresSelector({
  clienteId,
  allOperarios,
  assignedOperarios,
  createdByEmail,
}: OperadoresSelectorProps) {
  const [selected, setSelected] = useState<Operario[]>(assignedOperarios);
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelected(assignedOperarios);
  }, [assignedOperarios]);

  const availableOperarios = allOperarios.filter(
    (op) => !selected.some((s) => s.id === op.id)
  );

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!showDropdown) {
      setSearchTerm("");
    }
  }, [showDropdown]);

  async function handleAdd(operario: Operario) {
    const newSelected = [...selected, operario];
    setSelected(newSelected);
    setShowDropdown(false);
    setSearchTerm("");
    await saveOperadores(newSelected);
  }

  async function handleRemove(operarioId: string) {
    const newSelected = selected.filter((s) => s.id !== operarioId);
    setSelected(newSelected);
    await saveOperadores(newSelected);
  }

  async function saveOperadores(operarios: Operario[]) {
    setSaving(true);
    await updateClienteOperadores(
      clienteId,
      operarios.map((o) => o.id)
    );
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-400" />
          Operadores Asignados
          {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </h3>
      </div>

      <div className="p-4">
        {createdByEmail && (
          <div className="mb-3 text-xs text-gray-500">
            <span className="font-medium">Creado por:</span> {createdByEmail}
          </div>
        )}

        {/* Selected operarios */}
        <div className="flex flex-wrap gap-2 mb-3">
          {selected.length === 0 ? (
            <span className="text-sm text-gray-400 italic">Sin operadores asignados</span>
          ) : (
            selected.map((op) => (
              <span
                key={op.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[#BB292A]/10 text-[#BB292A] text-sm rounded-md"
              >
                {op.nombre}
                <button
                  onClick={() => handleRemove(op.id)}
                  className="p-0.5 hover:bg-[#BB292A]/20 rounded"
                  title="Quitar"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add button and dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={availableOperarios.length === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Añadir operador
          </button>

          {showDropdown && availableOperarios.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-20 overflow-hidden">
                {/* Search input */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar operador..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                    />
                  </div>
                </div>
                {/* Filtered list */}
                <div className="max-h-48 overflow-y-auto">
                  {availableOperarios
                    .filter((op) =>
                      op.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((op) => (
                      <button
                        key={op.id}
                        onClick={() => handleAdd(op)}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {op.nombre}
                      </button>
                    ))}
                  {availableOperarios.filter((op) =>
                    op.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-500 italic">
                      No se encontraron operadores
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
