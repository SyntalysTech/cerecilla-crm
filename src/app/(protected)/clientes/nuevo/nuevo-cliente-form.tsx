"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, User, Building2, Zap, Flame, FileText, MapPin, Upload, X, File } from "lucide-react";
import { createCliente, type ClienteFormData } from "../actions";
import { uploadClienteDocumento } from "../[id]/documentos-actions";

interface PendingDocument {
  file: File;
  nombre: string;
  descripcion: string;
}

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

interface Operario {
  id: string;
  nombre: string | null;
  alias: string | null;
}

interface NuevoClienteFormProps {
  operarios: Operario[];
  isOperario: boolean;
  isAdmin: boolean;
  operarioAlias: string;
}

const servicios = ["Luz", "Gas", "Telefonía", "Seguros", "Alarmas"];
const tiposPersona = [
  { value: "particular", label: "Particular" },
  { value: "empresa", label: "Empresa" },
];
const tiposDocumento = ["DNI", "NIE", "Pasaporte"];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function NuevoClienteForm({ operarios, isOperario, isAdmin, operarioAlias }: NuevoClienteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoDocumentoNuevo, setTipoDocumentoNuevo] = useState("DNI");
  const [tipoDocumentoAnterior, setTipoDocumentoAnterior] = useState("DNI");
  const [tipoDocumentoAdmin, setTipoDocumentoAdmin] = useState("DNI");

  // Document upload states
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ClienteFormData>({
    operador: isOperario ? operarioAlias : "",
    servicio: "",
    estado: "SIN ESTADO",
    tipo_persona: "particular",
    nombre_apellidos: "",
    razon_social: "",
    cif_empresa: "",
    nombre_admin: "",
    dni_admin: "",
    documento_nuevo_titular: "",
    documento_anterior_titular: "",
    email: "",
    telefono: "",
    direccion: "",
    tipo_via: "",
    nombre_via: "",
    numero: "",
    escalera: "",
    piso: "",
    puerta: "",
    codigo_postal: "",
    poblacion: "",
    provincia: "",
    cuenta_bancaria: "",
    cups_gas: "",
    cups_luz: "",
    compania_gas: "",
    compania_luz: "",
    potencia_gas: "",
    potencia_luz: "",
    tiene_suministro: null,
    es_cambio_titular: null,
    facturado: false,
    cobrado: false,
    pagado: false,
    factura_pagos: "",
    factura_cobros: "",
    precio_kw_gas: "",
    precio_kw_luz: "",
    observaciones: "",
    observaciones_admin: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields (except escalera, piso, puerta, documento_anterior_titular)
    const requiredFields = {
      servicio: "Servicios",
      tipo_persona: "Tipo de cliente",
      email: "Email",
      telefono: "Teléfono",
      tipo_via: "Tipo de vía",
      nombre_via: "Nombre de vía",
      numero: "Número",
      codigo_postal: "Código postal",
      poblacion: "Población",
      provincia: "Provincia",
      cuenta_bancaria: "Cuenta bancaria",
    };

    // Validate boolean required fields
    if (formData.tiene_suministro === null) {
      setError('El campo "¿Tiene suministro?" es obligatorio');
      setLoading(false);
      return;
    }
    if (formData.es_cambio_titular === null) {
      setError('El campo "¿Es cambio de titularidad?" es obligatorio');
      setLoading(false);
      return;
    }

    // Add conditional required fields based on tipo_persona
    if (formData.tipo_persona === "particular") {
      Object.assign(requiredFields, {
        nombre_apellidos: "Nombre y apellidos",
        documento_nuevo_titular: "Documento del titular",
      });
    } else {
      Object.assign(requiredFields, {
        razon_social: "Razón social",
        cif_empresa: "CIF de la empresa",
        nombre_admin: "Nombre del Administrador",
        dni_admin: "Documento del Administrador",
      });
    }

    for (const [field, label] of Object.entries(requiredFields)) {
      const value = formData[field as keyof ClienteFormData];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        setError(`El campo "${label}" es obligatorio`);
        setLoading(false);
        return;
      }
    }

    // Validate at least one document is uploaded
    if (pendingDocuments.length === 0) {
      setError("Debes añadir al menos un documento");
      setLoading(false);
      return;
    }

    const result = await createCliente(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.cliente && result.clientes) {
      // Upload pending documents to all created clients
      if (pendingDocuments.length > 0) {
        const allIds = result.clientes.map((c: { id: string }) => c.id);

        for (const doc of pendingDocuments) {
          // Upload to each client ID
          for (const clienteId of allIds) {
            const formData = new FormData();
            formData.append("file", doc.file);
            formData.append("nombre", doc.nombre);
            formData.append("descripcion", doc.descripcion);
            await uploadClienteDocumento(clienteId, formData);
          }
        }
      }

      // Redirect to clients list
      router.push("/clientes");
    } else {
      router.push("/clientes");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      // Initialize names with file names (without extension)
      const initialNames: Record<number, string> = {};
      filesArray.forEach((file, index) => {
        initialNames[index] = file.name.replace(/\.[^/.]+$/, "");
      });
      setFileNames(initialNames);
      setShowDocModal(true);
    }
  }

  function handleAddDocuments() {
    if (selectedFiles.length === 0) return;

    const newDocs = selectedFiles.map((file, index) => ({
      file,
      nombre: fileNames[index]?.trim() || file.name.replace(/\.[^/.]+$/, ""),
      descripcion: "",
    }));

    setPendingDocuments((prev) => [...prev, ...newDocs]);

    setShowDocModal(false);
    setSelectedFiles([]);
    setFileNames({});
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemoveDocument(index: number) {
    setPendingDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleChange(field: keyof ClienteFormData, value: string | boolean | null) {
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
          Servicio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Estado - Hidden for operarios */}
          {!isOperario && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              >
                <option value="SIN ESTADO">SIN ESTADO</option>
                <option value="SEGUIMIENTO">SEGUIMIENTO</option>
                <option value="PENDIENTE DOC">PENDIENTE DOC</option>
                <option value="EN TRAMITE">EN TRAMITE</option>
                <option value="COMISIONABLE">COMISIONABLE</option>
                <option value="LIQUIDADO">LIQUIDADO</option>
                <option value="FINALIZADO">FINALIZADO</option>
                <option value="FALLIDO">FALLIDO</option>
              </select>
            </div>
          )}

          {/* Operador - Hidden for operarios (auto-filled) */}
          {!isOperario && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operador</label>
              <select
                value={formData.operador}
                onChange={(e) => handleChange("operador", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                {operarios.map(op => (
                  <option key={op.id} value={op.alias || op.nombre || ""}>
                    {op.alias || op.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Servicios con checkboxes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Servicios *</label>
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

          {/* Tiene suministro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Tiene suministro? *</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tiene_suministro"
                  checked={formData.tiene_suministro === true}
                  onChange={() => handleChange("tiene_suministro", true)}
                  className="w-4 h-4 text-[#BB292A] border-gray-300 focus:ring-[#BB292A]"
                />
                <span className="text-sm text-gray-700">Sí</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tiene_suministro"
                  checked={formData.tiene_suministro === false}
                  onChange={() => handleChange("tiene_suministro", false)}
                  className="w-4 h-4 text-[#BB292A] border-gray-300 focus:ring-[#BB292A]"
                />
                <span className="text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Es cambio de titularidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">¿Es cambio de titularidad? *</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="es_cambio_titular"
                  checked={formData.es_cambio_titular === true}
                  onChange={() => handleChange("es_cambio_titular", true)}
                  className="w-4 h-4 text-[#BB292A] border-gray-300 focus:ring-[#BB292A]"
                />
                <span className="text-sm text-gray-700">Sí</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="es_cambio_titular"
                  checked={formData.es_cambio_titular === false}
                  onChange={() => handleChange("es_cambio_titular", false)}
                  className="w-4 h-4 text-[#BB292A] border-gray-300 focus:ring-[#BB292A]"
                />
                <span className="text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tipo de cliente */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo de Cliente *</h3>
        <div className="flex gap-4">
          {tiposPersona.map(tipo => (
            <label
              key={tipo.value}
              className={`flex-1 flex items-center justify-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.tipo_persona === tipo.value
                  ? "bg-[#BB292A]/10 border-[#BB292A]"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="tipo_persona"
                value={tipo.value}
                checked={formData.tipo_persona === tipo.value}
                onChange={(e) => handleChange("tipo_persona", e.target.value)}
                className="sr-only"
              />
              {tipo.value === "particular" ? (
                <User className={`w-5 h-5 ${formData.tipo_persona === tipo.value ? "text-[#BB292A]" : "text-gray-400"}`} />
              ) : (
                <Building2 className={`w-5 h-5 ${formData.tipo_persona === tipo.value ? "text-[#BB292A]" : "text-gray-400"}`} />
              )}
              <span className={`font-medium ${formData.tipo_persona === tipo.value ? "text-[#BB292A]" : "text-gray-700"}`}>
                {tipo.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-400" />
          Datos del Cliente
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.tipo_persona === "particular" ? (
            <>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellidos *</label>
                <input
                  type="text"
                  value={formData.nombre_apellidos}
                  onChange={(e) => handleChange("nombre_apellidos", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{tipoDocumentoNuevo} *</label>
                <input
                  type="text"
                  value={formData.documento_nuevo_titular}
                  onChange={(e) => handleChange("documento_nuevo_titular", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  placeholder={tipoDocumentoNuevo === "DNI" ? "12345678A" : tipoDocumentoNuevo === "NIE" ? "X1234567A" : "AAA123456"}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                <input
                  type="text"
                  value={formData.razon_social}
                  onChange={(e) => handleChange("razon_social", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIF Empresa *</label>
                <input
                  type="text"
                  value={formData.cif_empresa}
                  onChange={(e) => handleChange("cif_empresa", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Administrador *</label>
                <input
                  type="text"
                  value={formData.nombre_admin}
                  onChange={(e) => handleChange("nombre_admin", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento Administrador *</label>
                <select
                  value={tipoDocumentoAdmin}
                  onChange={(e) => setTipoDocumentoAdmin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                >
                  {tiposDocumento.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documento del Administrador *</label>
                <input
                  type="text"
                  value={formData.dni_admin}
                  onChange={(e) => handleChange("dni_admin", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  placeholder={tipoDocumentoAdmin === "DNI" ? "12345678A" : tipoDocumentoAdmin === "NIE" ? "X1234567A" : "AAA123456"}
                />
              </div>
            </>
          )}

          {/* Documento del anterior titular */}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Vía *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Vía *</label>
            <input
              type="text"
              value={formData.nombre_via}
              onChange={(e) => handleChange("nombre_via", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
            <input
              type="text"
              value={formData.codigo_postal}
              onChange={(e) => handleChange("codigo_postal", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              maxLength={5}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Población *</label>
            <input
              type="text"
              value={formData.poblacion}
              onChange={(e) => handleChange("poblacion", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria (IBAN) *</label>
            <input
              type="text"
              value={formData.cuenta_bancaria}
              onChange={(e) => handleChange("cuenta_bancaria", e.target.value)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent font-mono"
            />
          </div>
        </div>
      </div>

      {/* Datos de suministro - Hidden for operarios */}
      {!isOperario && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Datos de Suministro</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gas */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                Gas
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CUPS Gas</label>
                  <input
                    type="text"
                    value={formData.cups_gas}
                    onChange={(e) => handleChange("cups_gas", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent font-mono text-sm"
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
              </div>
            </div>

            {/* Luz */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Luz
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CUPS Luz</label>
                  <input
                    type="text"
                    value={formData.cups_luz}
                    onChange={(e) => handleChange("cups_luz", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent font-mono text-sm"
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documentos */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Documentos
          </h3>
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors">
            <Upload className="w-4 h-4" />
            Añadir documentos
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
            />
          </label>
        </div>

        {pendingDocuments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No hay documentos añadidos. Los documentos se subirán junto con el cliente.
          </p>
        ) : (
          <div className="space-y-2">
            {pendingDocuments.map((doc, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.nombre}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.file.name} · {formatFileSize(doc.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDocument(index)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observaciones */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Observaciones</h3>
        <textarea
          value={formData.observaciones}
          onChange={(e) => handleChange("observaciones", e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
          placeholder="Notas adicionales sobre el cliente..."
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/clientes")}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? "Guardando..." : "Guardar Cliente"}
        </button>
      </div>

      {/* Document Upload Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Añadir {selectedFiles.length} documento{selectedFiles.length > 1 ? "s" : ""}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDocModal(false);
                  setSelectedFiles([]);
                  setFileNames({});
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <File className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500 truncate">
                        {file.name} · {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={fileNames[index] || ""}
                    onChange={(e) => setFileNames(prev => ({ ...prev, [index]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                    placeholder="Nombre del documento"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowDocModal(false);
                  setSelectedFiles([]);
                  setFileNames({});
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddDocuments}
                disabled={selectedFiles.length === 0}
                className="px-4 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Añadir {selectedFiles.length > 1 ? `${selectedFiles.length} documentos` : "documento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
