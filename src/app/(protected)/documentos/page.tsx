import { PageHeader } from "@/components/page-header";
import { FileText, Download, Eye, BookOpen, FileCheck } from "lucide-react";
import Link from "next/link";

const documentos = [
  {
    id: "autorizacion-cliente",
    nombre: "Encargo de Cambio de Titularidad",
    descripcion: "Documento oficial para el encargo de cambio de titularidad de luz, gas, telefonía, seguros y alarmas.",
    tipo: "plantilla",
    archivo: "/documentos/autorizacion-cliente.pdf",
    icon: FileCheck,
  },
  {
    id: "guia-uso-crm",
    nombre: "Guía de Uso del CRM",
    descripcion: "Manual completo de uso del CRM de Cerecilla. Incluye instrucciones para clientes, operarios, emails, campañas y CerecIA.",
    tipo: "guia",
    archivo: "/documentos/guia-uso-crm.pdf",
    icon: BookOpen,
  },
];

const tipoColors: Record<string, string> = {
  plantilla: "bg-blue-100 text-blue-700",
  guia: "bg-green-100 text-green-700",
  contrato: "bg-purple-100 text-purple-700",
  otro: "bg-gray-100 text-gray-700",
};

export default function DocumentosPage() {
  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Plantillas y guías de uso para el equipo"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentos.map((doc) => {
          const IconComponent = doc.icon;
          return (
            <div
              key={doc.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#BB292A]/10 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-6 h-6 text-[#BB292A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {doc.nombre}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        tipoColors[doc.tipo] || tipoColors.otro
                      }`}
                    >
                      {doc.tipo}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {doc.descripcion}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={doc.archivo}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#BB292A] bg-[#BB292A]/10 rounded-md hover:bg-[#BB292A]/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Link>
                    <a
                      href={doc.archivo}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info card */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">
              ¿Necesitas más documentos?
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              Si necesitas añadir más plantillas o documentos al sistema, contacta con el administrador del CRM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
