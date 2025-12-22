"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

interface Operario {
  id: string;
  email: string | null;
  alias: string | null;
  telefonos: string | null;
  tiene_doc_autonomo: boolean;
  tiene_doc_escritura: boolean;
  tiene_doc_cif: boolean;
  tiene_doc_contrato: boolean;
  tiene_cuenta_bancaria?: boolean;
  tipo: string | null;
  nombre: string | null;
  documento: string | null;
  empresa: string | null;
  cif: string | null;
  cuenta_bancaria: string | null;
  direccion: string | null;
  nombre_admin?: string | null;
  dni_admin?: string | null;
  password_operario?: string | null;
  created_at: string;
  ultima_carga?: string | null;
}

interface ExportButtonProps {
  operarios: Operario[];
}

export function ExportOperariosButton({ operarios }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  function exportToCSV() {
    setExporting(true);

    try {
      const headers = [
        "Alias",
        "Nombre",
        "Email",
        "Teléfonos",
        "Tipo",
        "Documento",
        "Empresa",
        "CIF",
        "Cuenta Bancaria",
        "Dirección",
        "Nombre Admin",
        "DNI Admin",
        "Doc. Autónomo",
        "Doc. Escritura",
        "Doc. CIF",
        "Doc. Contrato",
        "Tiene Cuenta",
        "Última Carga",
        "Fecha Registro"
      ];

      const rows = operarios.map(operario => [
        operario.alias || "",
        operario.nombre || "",
        operario.email || "",
        operario.telefonos || "",
        operario.tipo || "",
        operario.documento || "",
        operario.empresa || "",
        operario.cif || "",
        operario.cuenta_bancaria || "",
        operario.direccion || "",
        operario.nombre_admin || "",
        operario.dni_admin || "",
        operario.tiene_doc_autonomo ? "Sí" : "No",
        operario.tiene_doc_escritura ? "Sí" : "No",
        operario.tiene_doc_cif ? "Sí" : "No",
        operario.tiene_doc_contrato ? "Sí" : "No",
        operario.tiene_cuenta_bancaria ? "Sí" : "No",
        operario.ultima_carga ? new Date(operario.ultima_carga).toLocaleDateString("es-ES") : "",
        new Date(operario.created_at).toLocaleDateString("es-ES")
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
      link.download = `operarios_${new Date().toISOString().split("T")[0]}.csv`;
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
      disabled={exporting || operarios.length === 0}
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
