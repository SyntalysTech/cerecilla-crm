import { PageHeader } from "@/components/page-header";
import { getDocumentos } from "./actions";
import { DocumentosList } from "./documentos-list";

// Default documents that are always available
const defaultDocumentos = [
  {
    id: "autorizacion-cliente",
    nombre: "Encargo de Cambio de Titularidad",
    descripcion: "Documento oficial para el encargo de cambio de titularidad de luz, gas, telefonía, seguros y alarmas.",
    tipo: "plantilla",
    archivo_url: "/documentos/autorizacion-cliente.pdf",
    archivo_nombre: "autorizacion-cliente.pdf",
    created_at: "",
    isDefault: true,
  },
  {
    id: "guia-uso-crm",
    nombre: "Guía de Uso del CRM",
    descripcion: "Manual completo de uso del CRM de Cerecilla. Incluye instrucciones para clientes, operarios, emails, campañas y CerecIA.",
    tipo: "guia",
    archivo_url: "/documentos/guia-uso-crm.pdf",
    archivo_nombre: "guia-uso-crm.pdf",
    created_at: "",
    isDefault: true,
  },
];

export default async function DocumentosPage() {
  const dbDocumentos = await getDocumentos();

  // Combine default and database documents
  const allDocumentos = [
    ...defaultDocumentos,
    ...dbDocumentos.map(doc => ({ ...doc, isDefault: false })),
  ];

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Plantillas y guías de uso para el equipo"
      />

      <DocumentosList documentos={allDocumentos} />
    </div>
  );
}
