"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, User, Building2, Zap, Flame, FileText } from "lucide-react";
import { updateCliente, type ClienteFormData } from "../../actions";

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
}

interface Operario {
  id: string;
  nombre: string;
}

interface EditClienteFormProps {
  cliente: Cliente;
  operarios: Operario[];
}

const estados = ["LIQUIDADO", "PENDIENTE", "EN TRAMITE", "SEGUIMIENTO", "FALLIDO"];
const servicios = ["Luz", "Gas", "Luz y Gas"];
const tiposPersona = [
  { value: "particular", label: "Particular" },
  { value: "empresa", label: "Empresa" },
];

export function EditClienteForm({ cliente, operarios }: EditClienteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClienteFormData>({
    operador: cliente.operador || "",
    servicio: cliente.servicio || "",
    estado: cliente.estado || "",
    tipo_persona: cliente.tipo_persona || "particular",
    nombre_apellidos: cliente.nombre_apellidos || "",
    razon_social: cliente.razon_social || "",
    documento_nuevo_titular: cliente.documento_nuevo_titular || "",
    documento_anterior_titular: cliente.documento_anterior_titular || "",
    email: cliente.email || "",
    telefono: cliente.telefono || "",
    direccion: cliente.direccion || "",
    cuenta_bancaria: cliente.cuenta_bancaria || "",
    cups_gas: cliente.cups_gas || "",
    cups_luz: cliente.cups_luz || "",
    compania_gas: cliente.compania_gas || "",
    compania_luz: cliente.compania_luz || "",
    potencia_gas: cliente.potencia_gas || "",
    potencia_luz: cliente.potencia_luz || "",
    facturado: cliente.facturado || false,
    cobrado: cliente.cobrado || false,
    pagado: cliente.pagado || false,
    factura_pagos: cliente.factura_pagos || "",
    factura_cobros: cliente.factura_cobros || "",
    precio_kw_gas: cliente.precio_kw_gas || "",
    precio_kw_luz: cliente.precio_kw_luz || "",
    observaciones: cliente.observaciones || "",
    observaciones_admin: cliente.observaciones_admin || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateCliente(cliente.id, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/clientes/${cliente.id}`);
    }
  }

  function handleChange(field: keyof ClienteFormData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Estado y Servicio */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          Estado y Servicio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={formData.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
            <select
              value={formData.servicio}
              onChange={(e) => handleChange("servicio", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {servicios.map(servicio => (
                <option key={servicio} value={servicio}>{servicio}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operador</label>
            <select
              value={formData.operador}
              onChange={(e) => handleChange("operador", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {operarios.map(op => (
                <option key={op.id} value={op.nombre}>{op.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          Información Personal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Persona</label>
            <select
              value={formData.tipo_persona}
              onChange={(e) => handleChange("tipo_persona", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              {tiposPersona.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.tipo_persona === "empresa" ? "Razón Social" : "Nombre y Apellidos"}
            </label>
            <input
              type="text"
              value={formData.tipo_persona === "empresa" ? formData.razon_social : formData.nombre_apellidos}
              onChange={(e) => handleChange(formData.tipo_persona === "empresa" ? "razon_social" : "nombre_apellidos", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          {formData.tipo_persona === "empresa" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Representante</label>
              <input
                type="text"
                value={formData.nombre_apellidos}
                onChange={(e) => handleChange("nombre_apellidos", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento Nuevo Titular</label>
            <input
              type="text"
              value={formData.documento_nuevo_titular}
              onChange={(e) => handleChange("documento_nuevo_titular", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento Anterior Titular</label>
            <input
              type="text"
              value={formData.documento_anterior_titular}
              onChange={(e) => handleChange("documento_anterior_titular", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => handleChange("telefono", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => handleChange("direccion", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
            <input
              type="text"
              value={formData.cuenta_bancaria}
              onChange={(e) => handleChange("cuenta_bancaria", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Servicios Energéticos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Servicios Energéticos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Luz */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Luz
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CUPS Luz</label>
              <input
                type="text"
                value={formData.cups_luz}
                onChange={(e) => handleChange("cups_luz", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compañía Luz</label>
              <input
                type="text"
                value={formData.compania_luz}
                onChange={(e) => handleChange("compania_luz", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Potencia Luz</label>
              <input
                type="text"
                value={formData.potencia_luz}
                onChange={(e) => handleChange("potencia_luz", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio kW Luz</label>
              <input
                type="text"
                value={formData.precio_kw_luz}
                onChange={(e) => handleChange("precio_kw_luz", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
          </div>

          {/* Gas */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-orange-600 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Gas
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CUPS Gas</label>
              <input
                type="text"
                value={formData.cups_gas}
                onChange={(e) => handleChange("cups_gas", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compañía Gas</label>
              <input
                type="text"
                value={formData.compania_gas}
                onChange={(e) => handleChange("compania_gas", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Potencia Gas</label>
              <input
                type="text"
                value={formData.potencia_gas}
                onChange={(e) => handleChange("potencia_gas", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio kW Gas</label>
              <input
                type="text"
                value={formData.precio_kw_gas}
                onChange={(e) => handleChange("precio_kw_gas", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Facturación */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-400" />
          Facturación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.facturado}
              onChange={(e) => handleChange("facturado", e.target.checked)}
              className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
            />
            <span className="text-sm font-medium text-gray-700">Facturado</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.cobrado}
              onChange={(e) => handleChange("cobrado", e.target.checked)}
              className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
            />
            <span className="text-sm font-medium text-gray-700">Cobrado</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={formData.pagado}
              onChange={(e) => handleChange("pagado", e.target.checked)}
              className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
            />
            <span className="text-sm font-medium text-gray-700">Pagado</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factura Pagos</label>
            <input
              type="text"
              value={formData.factura_pagos}
              onChange={(e) => handleChange("factura_pagos", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factura Cobros</label>
            <input
              type="text"
              value={formData.factura_cobros}
              onChange={(e) => handleChange("factura_cobros", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Observaciones</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => handleChange("observaciones", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Admin</label>
            <textarea
              value={formData.observaciones_admin}
              onChange={(e) => handleChange("observaciones_admin", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </form>
  );
}
