"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { updateEmpresaConfig } from "../../facturacion/actions";

interface EmpresaConfig {
  nombre: string;
  cif: string;
  direccion: string;
  poblacion: string;
  provincia: string;
  codigoPostal: string;
  telefono: string;
  email: string;
  cuentaBancaria: string;
  cuentaBancaria2: string;
  ibanNombre: string;
  iban2Nombre: string;
}

interface Props {
  initialConfig: EmpresaConfig;
}

export function EmpresaConfigForm({ initialConfig }: Props) {
  const [config, setConfig] = useState<EmpresaConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const result = await updateEmpresaConfig(config);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Configuración guardada correctamente" });
      }
    } catch {
      setMessage({ type: "error", text: "Error al guardar la configuración" });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof EmpresaConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Empresa *
          </label>
          <input
            type="text"
            value={config.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
          />
        </div>

        {/* CIF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CIF *
          </label>
          <input
            type="text"
            value={config.cif}
            onChange={(e) => handleChange("cif", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
          />
        </div>

        {/* Dirección */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección *
          </label>
          <input
            type="text"
            value={config.direccion}
            onChange={(e) => handleChange("direccion", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
          />
        </div>

        {/* Código Postal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código Postal *
          </label>
          <input
            type="text"
            value={config.codigoPostal}
            onChange={(e) => handleChange("codigoPostal", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
          />
        </div>

        {/* Población */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Población *
          </label>
          <input
            type="text"
            value={config.poblacion}
            onChange={(e) => handleChange("poblacion", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
          />
        </div>

        {/* Provincia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provincia *
          </label>
          <input
            type="text"
            value={config.provincia}
            onChange={(e) => handleChange("provincia", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={config.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de Facturación
          </label>
          <input
            type="email"
            value={config.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
          />
        </div>
      </div>

      {/* Cuentas Bancarias */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Cuentas Bancarias para Cobros</h3>
        <p className="text-xs text-gray-500 mb-4">
          Configura las cuentas donde recibes los cobros. Al generar una factura podrás elegir cuál usar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* IBAN 1 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Cuenta 1 - Nombre (opcional)
            </label>
            <input
              type="text"
              value={config.ibanNombre}
              onChange={(e) => handleChange("ibanNombre", e.target.value)}
              placeholder="Ej: Cerecilla Energía"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
            />
            <input
              type="text"
              value={config.cuentaBancaria}
              onChange={(e) => handleChange("cuentaBancaria", e.target.value)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A] font-mono"
            />
          </div>

          {/* IBAN 2 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Cuenta 2 - Nombre (opcional)
            </label>
            <input
              type="text"
              value={config.iban2Nombre}
              onChange={(e) => handleChange("iban2Nombre", e.target.value)}
              placeholder="Ej: Cerecilla Solar"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A]"
            />
            <input
              type="text"
              value={config.cuentaBancaria2}
              onChange={(e) => handleChange("cuentaBancaria2", e.target.value)}
              placeholder="ES00 0000 0000 0000 0000 0000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A]/50 focus:border-[#BB292A] font-mono"
            />
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div
          className={`px-4 py-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Botón guardar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white rounded-md hover:bg-[#9a2223] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </form>
  );
}
