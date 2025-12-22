"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, User, Building2, Zap, Flame, FileText, MapPin, Bell, Lock } from "lucide-react";
import { updateCliente, notifyEstadoChange, type ClienteFormData } from "../../actions";

const tiposVia = [
  "Calle", "Avenida", "Plaza", "Paseo", "Urbanización", "Polígono",
  "Lugar", "Carretera", "Camino", "Callejón", "Pasaje", "Sendero",
  "Bulevar", "Rambla", "Travesía", "Vía"
];

const provincias = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila",
  "Badajoz", "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria",
  "Castellón", "Ciudad Real", "Córdoba", "A Coruña", "Cuenca",
  "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca",
  "Islas Baleares", "Jaén", "León", "Lleida", "Lugo", "Madrid",
  "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", "Las Palmas",
  "Pontevedra", "La Rioja", "Salamanca", "Santa Cruz de Tenerife",
  "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo",
  "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla"
];

interface Cliente {
  id: string;
  operador: string | null;
  servicio: string | null;
  estado: string | null;
  tipo_persona: string | null;
  nombre_apellidos: string | null;
  razon_social: string | null;
  cif_empresa: string | null;
  nombre_admin: string | null;
  dni_admin: string | null;
  documento_nuevo_titular: string | null;
  documento_anterior_titular: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo_via: string | null;
  nombre_via: string | null;
  numero: string | null;
  escalera: string | null;
  piso: string | null;
  puerta: string | null;
  codigo_postal: string | null;
  poblacion: string | null;
  provincia: string | null;
  cuenta_bancaria: string | null;
  cups_gas: string | null;
  cups_luz: string | null;
  compania_gas: string | null;
  compania_luz: string | null;
  potencia_gas: string | null;
  potencia_luz: string | null;
  tiene_suministro: boolean | null;
  es_cambio_titular: boolean | null;
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
  isOperario?: boolean;
  isAdmin?: boolean;
}

const estados = ["SIN ESTADO", "SEGUIMIENTO", "EN TRAMITE", "COMISIONABLE", "LIQUIDADO", "FINALIZADO", "FALLIDO"];
const servicios = ["Luz", "Gas", "Telefonía", "Seguros", "Alarmas"];
const tiposPersona = [
  { value: "particular", label: "Particular" },
  { value: "empresa", label: "Empresa" },
];
const tiposDocumento = ["DNI", "NIE", "Pasaporte"];

export function EditClienteForm({ cliente, operarios, isOperario = false, isAdmin = false }: EditClienteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifyOperador, setNotifyOperador] = useState(false);
  const [originalEstado] = useState(cliente.estado || "");
  const [tipoDocumentoNuevo, setTipoDocumentoNuevo] = useState("DNI");
  const [tipoDocumentoAnterior, setTipoDocumentoAnterior] = useState("DNI");

  const [formData, setFormData] = useState<ClienteFormData>({
    operador: cliente.operador || "",
    servicio: cliente.servicio || "",
    estado: cliente.estado || "",
    tipo_persona: cliente.tipo_persona || "particular",
    nombre_apellidos: cliente.nombre_apellidos || "",
    razon_social: cliente.razon_social || "",
    cif_empresa: cliente.cif_empresa || "",
    nombre_admin: cliente.nombre_admin || "",
    dni_admin: cliente.dni_admin || "",
    documento_nuevo_titular: cliente.documento_nuevo_titular || "",
    documento_anterior_titular: cliente.documento_anterior_titular || "",
    email: cliente.email || "",
    telefono: cliente.telefono || "",
    direccion: cliente.direccion || "",
    tipo_via: cliente.tipo_via || "",
    nombre_via: cliente.nombre_via || "",
    numero: cliente.numero || "",
    escalera: cliente.escalera || "",
    piso: cliente.piso || "",
    puerta: cliente.puerta || "",
    codigo_postal: cliente.codigo_postal || "",
    poblacion: cliente.poblacion || "",
    provincia: cliente.provincia || "",
    cuenta_bancaria: cliente.cuenta_bancaria || "",
    cups_gas: cliente.cups_gas || "",
    cups_luz: cliente.cups_luz || "",
    compania_gas: cliente.compania_gas || "",
    compania_luz: cliente.compania_luz || "",
    potencia_gas: cliente.potencia_gas || "",
    potencia_luz: cliente.potencia_luz || "",
    tiene_suministro: cliente.tiene_suministro ?? null,
    es_cambio_titular: cliente.es_cambio_titular ?? null,
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

    // Operarios cannot edit client data
    if (isOperario) {
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updateCliente(cliente.id, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Si el estado cambió y se marcó notificar, enviamos email
    if (notifyOperador && formData.estado && formData.estado !== originalEstado) {
      await notifyEstadoChange(cliente.id, originalEstado, formData.estado);
    }

    // Redirect to client list instead of detail view
    router.push("/clientes");
  }

  // Detectar si el estado cambió
  const estadoChanged = formData.estado !== originalEstado;

  function handleChange(field: keyof ClienteFormData, value: string | boolean | null) {
    if (isOperario) return; // Operarios cannot change data
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  // If operario, show read-only view
  if (isOperario) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-700 text-sm">
            Solo puedes ver los datos del cliente. Para modificar datos, contacta con un administrador.
            Puedes añadir documentos y observaciones desde el panel lateral.
          </p>
        </div>

        {/* Read-only Estado y Servicio */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Estado y Servicio
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Estado</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.estado || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Operador</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.operador || "—"}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Servicios</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.servicio || "—"}</p>
            </div>
          </div>
        </div>

        {/* Read-only Información Personal */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Información Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Tipo de Persona</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                {cliente.tipo_persona === "empresa" ? "Empresa" : "Particular"}
              </p>
            </div>
            {cliente.tipo_persona === "empresa" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Razón Social</label>
                  <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.razon_social || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">CIF Empresa</label>
                  <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.cif_empresa || "—"}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nombre y Apellidos</label>
                  <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.nombre_apellidos || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">DNI/NIE/Pasaporte</label>
                  <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.documento_nuevo_titular || "—"}</p>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.email || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.telefono || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Documento Anterior Titular</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.documento_anterior_titular || "—"}</p>
            </div>
          </div>
        </div>

        {/* Read-only Dirección */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            Dirección
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Tipo de Vía</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.tipo_via || "—"}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-500 mb-1">Nombre de Vía</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.nombre_via || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Número</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.numero || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Escalera</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.escalera || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Piso</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.piso || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Puerta</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.puerta || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Código Postal</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.codigo_postal || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Población</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.poblacion || "—"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Provincia</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">{cliente.provincia || "—"}</p>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-500 mb-1">Cuenta Bancaria</label>
              <p className="px-3 py-2 bg-gray-100 rounded-md text-gray-900 font-mono">{cliente.cuenta_bancaria || "—"}</p>
            </div>
          </div>
        </div>

        {/* Back button for operarios */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/clientes")}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md"
          >
            Volver a clientes
          </button>
        </div>
      </div>
    );
  }

  // Admin/Manager form (editable)
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {estadoChanged && (
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOperador}
                  onChange={(e) => setNotifyOperador(e.target.checked)}
                  className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
                />
                <Bell className="w-4 h-4 text-blue-500" />
                <span>Notificar al operador del cambio de estado</span>
              </label>
            )}
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios</label>
            <div className="flex flex-wrap gap-3">
              {servicios.map(servicio => {
                const selectedServicios = formData.servicio?.split(", ").filter(Boolean) || [];
                const isSelected = selectedServicios.includes(servicio);
                return (
                  <label
                    key={servicio}
                    className={`inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#BB292A]/10 border-[#BB292A] text-[#BB292A]"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        let newServicios = [...selectedServicios];
                        if (e.target.checked) {
                          newServicios.push(servicio);
                        } else {
                          newServicios = newServicios.filter(s => s !== servicio);
                        }
                        handleChange("servicio", newServicios.join(", "));
                      }}
                      className="w-4 h-4 text-[#BB292A] border-gray-300 rounded focus:ring-[#BB292A]"
                    />
                    <span className="text-sm font-medium">{servicio}</span>
                  </label>
                );
              })}
            </div>
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

          {formData.tipo_persona === "empresa" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                <input
                  type="text"
                  value={formData.razon_social}
                  onChange={(e) => handleChange("razon_social", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIF Empresa</label>
                <input
                  type="text"
                  value={formData.cif_empresa}
                  onChange={(e) => handleChange("cif_empresa", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  placeholder="B12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellidos Administrador</label>
                <input
                  type="text"
                  value={formData.nombre_admin}
                  onChange={(e) => handleChange("nombre_admin", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI Administrador</label>
                <input
                  type="text"
                  value={formData.dni_admin}
                  onChange={(e) => handleChange("dni_admin", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  placeholder="12345678A"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellidos</label>
                <input
                  type="text"
                  value={formData.nombre_apellidos}
                  onChange={(e) => handleChange("nombre_apellidos", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
                <select
                  value={tipoDocumentoNuevo}
                  onChange={(e) => setTipoDocumentoNuevo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                >
                  {tiposDocumento.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tipoDocumentoNuevo} Titular</label>
                <input
                  type="text"
                  value={formData.documento_nuevo_titular}
                  onChange={(e) => handleChange("documento_nuevo_titular", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  placeholder={tipoDocumentoNuevo === "DNI" ? "12345678A" : tipoDocumentoNuevo === "NIE" ? "X1234567A" : "AAA123456"}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Doc. Anterior Titular</label>
            <select
              value={tipoDocumentoAnterior}
              onChange={(e) => setTipoDocumentoAnterior(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              {tiposDocumento.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tipoDocumentoAnterior} Anterior Titular</label>
            <input
              type="text"
              value={formData.documento_anterior_titular}
              onChange={(e) => handleChange("documento_anterior_titular", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              placeholder={tipoDocumentoAnterior === "DNI" ? "12345678A" : tipoDocumentoAnterior === "NIE" ? "X1234567A" : "AAA123456"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Tiene suministro?</label>
            <select
              value={formData.tiene_suministro === null ? "" : formData.tiene_suministro ? "si" : "no"}
              onChange={(e) => handleChange("tiene_suministro", e.target.value === "" ? null : e.target.value === "si")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Es cambio de titularidad?</label>
            <select
              value={formData.es_cambio_titular === null ? "" : formData.es_cambio_titular ? "si" : "no"}
              onChange={(e) => handleChange("es_cambio_titular", e.target.value === "" ? null : e.target.value === "si")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
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
        </div>
      </div>

      {/* Dirección */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-400" />
          Dirección
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vía</label>
            <select
              value={formData.tipo_via}
              onChange={(e) => handleChange("tipo_via", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {tiposVia.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Vía</label>
            <input
              type="text"
              value={formData.nombre_via}
              onChange={(e) => handleChange("nombre_via", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => handleChange("numero", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escalera</label>
            <input
              type="text"
              value={formData.escalera}
              onChange={(e) => handleChange("escalera", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
            <input
              type="text"
              value={formData.piso}
              onChange={(e) => handleChange("piso", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Puerta</label>
            <input
              type="text"
              value={formData.puerta}
              onChange={(e) => handleChange("puerta", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
            <input
              type="text"
              value={formData.codigo_postal}
              onChange={(e) => handleChange("codigo_postal", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              maxLength={5}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Población</label>
            <input
              type="text"
              value={formData.poblacion}
              onChange={(e) => handleChange("poblacion", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
            <select
              value={formData.provincia}
              onChange={(e) => handleChange("provincia", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              {provincias.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-6">
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

      {/* Servicios Energéticos - Only for admins */}
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
