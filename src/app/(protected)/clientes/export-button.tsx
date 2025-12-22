"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

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

interface ExportButtonProps {
  clientes: Cliente[];
}

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
    } else if (s === "Seguros") {
      // Seguros: 10% del precio de la póliza - needs actual price, show placeholder
      total += 0; // Will show as "10%" separately
    }
  }

  if (servicios.includes("Seguros")) {
    if (total > 0) {
      return `${total}€ + 10%`;
    }
    return "10%";
  }

  return `${total}€`;
}

export function ExportButton({ clientes }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  function exportToCSV() {
    setExporting(true);

    try {
      const headers = [
        "Nombre/Razón Social",
        "Documento",
        "Email",
        "Teléfono",
        "Estado",
        "Servicios",
        "Comisión",
        "Dirección",
        "Cuenta Bancaria",
        "CUPS Gas",
        "CUPS Luz",
        "Compañía Gas",
        "Compañía Luz",
        "Potencia Gas",
        "Potencia Luz",
        "Operador",
        "Fecha",
        "Facturado",
        "Cobrado",
        "Pagado",
        "Factura Pagos",
        "Factura Cobros",
        "Precio kW Gas",
        "Precio kW Luz",
        "Observaciones"
      ];

      const rows = clientes.map(cliente => [
        cliente.nombre_apellidos || cliente.razon_social || "",
        cliente.documento_nuevo_titular || "",
        cliente.email || "",
        cliente.telefono || "",
        cliente.estado || "",
        cliente.servicio || "",
        calculateComision(cliente.servicio),
        cliente.direccion || "",
        cliente.cuenta_bancaria || "",
        cliente.cups_gas || "",
        cliente.cups_luz || "",
        cliente.compania_gas || "",
        cliente.compania_luz || "",
        cliente.potencia_gas || "",
        cliente.potencia_luz || "",
        cliente.operador || "",
        new Date(cliente.created_at).toLocaleDateString("es-ES"),
        cliente.facturado ? "Sí" : "No",
        cliente.cobrado ? "Sí" : "No",
        cliente.pagado ? "Sí" : "No",
        cliente.factura_pagos || "",
        cliente.factura_cobros || "",
        cliente.precio_kw_gas || "",
        cliente.precio_kw_luz || "",
        cliente.observaciones || ""
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(";"),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      ].join("\n");

      // Add BOM for Excel to recognize UTF-8
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error exporting:", error);
      alert("Error al exportar los datos");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={exportToCSV}
      disabled={exporting || clientes.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Exportar
    </button>
  );
}
