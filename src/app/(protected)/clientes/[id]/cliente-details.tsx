"use client";

import { User, Building2, Mail, Phone, MapPin, CreditCard, Zap, Flame, FileText, Calendar, CheckCircle, XCircle, MessageSquare } from "lucide-react";

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
  created_at: string;
}

const estadoColors: Record<string, string> = {
  LIQUIDADO: "bg-gray-900 text-white",
  "SIN ESTADO": "bg-blue-100 text-blue-800",
  SEGUIMIENTO: "bg-green-100 text-green-800",
  "PENDIENTE DOC": "bg-amber-100 text-amber-800",
  "EN TRAMITE": "bg-green-200 text-green-900",
  COMISIONABLE: "bg-purple-100 text-purple-800",
  FINALIZADO: "bg-emerald-100 text-emerald-800",
  FALLIDO: "bg-red-100 text-red-800",
};

function formatDireccion(cliente: Cliente): string | null {
  const parts = [];

  if (cliente.tipo_via && cliente.nombre_via) {
    let dir = `${cliente.tipo_via} ${cliente.nombre_via}`;
    if (cliente.numero) dir += `, ${cliente.numero}`;
    if (cliente.escalera) dir += `, Esc. ${cliente.escalera}`;
    if (cliente.piso) dir += `, ${cliente.piso}º`;
    if (cliente.puerta) dir += ` ${cliente.puerta}`;
    parts.push(dir);
  }

  if (cliente.codigo_postal || cliente.poblacion) {
    const loc = [cliente.codigo_postal, cliente.poblacion].filter(Boolean).join(" ");
    parts.push(loc);
  }

  if (cliente.provincia) {
    parts.push(cliente.provincia);
  }

  // Fallback to old direccion field if new fields are empty
  if (parts.length === 0 && cliente.direccion) {
    return cliente.direccion;
  }

  return parts.length > 0 ? parts.join(", ") : null;
}

function InfoField({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ElementType }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">
        {value || <span className="text-gray-400 italic">No especificado</span>}
      </dd>
    </div>
  );
}

function BooleanField({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-600">{label}</span>
      {value ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
          <CheckCircle className="w-3 h-3" />
          Sí
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
          <XCircle className="w-3 h-3" />
          No
        </span>
      )}
    </div>
  );
}

export function ClienteDetails({ cliente }: { cliente: Cliente }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="lg:col-span-2 space-y-6">
        {/* Estado y Servicio */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            {cliente.estado && (
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${estadoColors[cliente.estado] || "bg-gray-100 text-gray-800"}`}>
                {cliente.estado}
              </span>
            )}
            {cliente.servicio && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
                {cliente.servicio}
              </span>
            )}
            {cliente.operador && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                {cliente.operador}
              </span>
            )}
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Información Personal
          </h3>

          <dl className="space-y-1">
            {cliente.tipo_persona === "empresa" ? (
              <>
                <InfoField label="Razón Social" value={cliente.razon_social} icon={Building2} />
                <InfoField label="CIF Empresa" value={cliente.cif_empresa} icon={FileText} />
                <InfoField label="Nombre Administrador" value={cliente.nombre_admin} icon={User} />
                <InfoField label="DNI Administrador" value={cliente.dni_admin} icon={FileText} />
              </>
            ) : (
              <>
                <InfoField label="Nombre y Apellidos" value={cliente.nombre_apellidos} icon={User} />
                <InfoField label="DNI/NIE Titular" value={cliente.documento_nuevo_titular} icon={FileText} />
              </>
            )}
            <InfoField label="Documento Anterior Titular" value={cliente.documento_anterior_titular} icon={FileText} />
            <InfoField label="Email" value={cliente.email} icon={Mail} />
            <InfoField label="Teléfono" value={cliente.telefono} icon={Phone} />
            <InfoField label="Dirección" value={formatDireccion(cliente)} icon={MapPin} />
            <InfoField label="Cuenta Bancaria" value={cliente.cuenta_bancaria} icon={CreditCard} />
          </dl>

          {/* Suministro y Titularidad */}
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">¿Tiene Suministro?</span>
              <p className="text-sm text-gray-900 mt-1">
                {cliente.tiene_suministro === null ? (
                  <span className="text-gray-400 italic">No especificado</span>
                ) : cliente.tiene_suministro ? (
                  <span className="inline-flex items-center gap-1 text-green-700">
                    <CheckCircle className="w-4 h-4" /> Sí
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <XCircle className="w-4 h-4" /> No
                  </span>
                )}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase">¿Es Cambio de Titularidad?</span>
              <p className="text-sm text-gray-900 mt-1">
                {cliente.es_cambio_titular === null ? (
                  <span className="text-gray-400 italic">No especificado</span>
                ) : cliente.es_cambio_titular ? (
                  <span className="inline-flex items-center gap-1 text-green-700">
                    <CheckCircle className="w-4 h-4" /> Sí
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <XCircle className="w-4 h-4" /> No
                  </span>
                )}
              </p>
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
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" />
                Luz
              </h4>
              <InfoField label="CUPS Luz" value={cliente.cups_luz} />
              <InfoField label="Compañía Luz" value={cliente.compania_luz} />
              <InfoField label="Potencia Luz" value={cliente.potencia_luz} />
              <InfoField label="Precio kW Luz" value={cliente.precio_kw_luz} />
            </div>

            {/* Gas */}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-orange-600 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4" />
                Gas
              </h4>
              <InfoField label="CUPS Gas" value={cliente.cups_gas} />
              <InfoField label="Compañía Gas" value={cliente.compania_gas} />
              <InfoField label="Potencia Gas" value={cliente.potencia_gas} />
              <InfoField label="Precio kW Gas" value={cliente.precio_kw_gas} />
            </div>
          </div>
        </div>

        {/* Observaciones Importadas (from Excel) */}
        {(cliente.observaciones || cliente.observaciones_admin) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              Historial de Observaciones
            </h3>

            {cliente.observaciones && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Observaciones</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-md max-h-48 overflow-y-auto">
                  {cliente.observaciones}
                </div>
              </div>
            )}

            {cliente.observaciones_admin && (
              <div>
                <h4 className="text-xs font-medium text-yellow-600 uppercase tracking-wider mb-2">Observaciones Admin</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-yellow-50 p-3 rounded-md border border-yellow-200 max-h-48 overflow-y-auto">
                  {cliente.observaciones_admin}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Estado Facturación */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estado Facturación</h3>
          <div className="space-y-2">
            <BooleanField label="Facturado" value={cliente.facturado} />
            <BooleanField label="Cobrado" value={cliente.cobrado} />
            <BooleanField label="Pagado" value={cliente.pagado} />
          </div>

          {(cliente.factura_pagos || cliente.factura_cobros) && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              {cliente.factura_pagos && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Factura Pagos</span>
                  <p className="text-sm text-gray-900">{cliente.factura_pagos}</p>
                </div>
              )}
              {cliente.factura_cobros && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Factura Cobros</span>
                  <p className="text-sm text-gray-900">{cliente.factura_cobros}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Información del Registro
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Fecha de Alta</dt>
              <dd className="text-sm text-gray-900">
                {new Date(cliente.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">ID</dt>
              <dd className="text-xs text-gray-500 font-mono">{cliente.id}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
