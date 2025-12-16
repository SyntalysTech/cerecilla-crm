import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getTemplate } from "../../actions";

interface PreviewTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewTemplatePage({ params }: PreviewTemplatePageProps) {
  const { id } = await params;
  const template = await getTemplate(id);

  if (!template) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Vista previa"
        description={template.name}
      />

      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/email-templates"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a plantillas
        </Link>
        <Link
          href={`/email-templates/${id}`}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#BB292A] text-white rounded-md hover:bg-[#9a2223]"
        >
          <Edit className="w-4 h-4" />
          Editar
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-500 mb-1">Asunto:</div>
          <div className="font-medium text-gray-900">{template.subject}</div>
        </div>

        <div className="p-6">
          <div className="text-sm text-gray-500 mb-3">Contenido:</div>
          <div
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            dangerouslySetInnerHTML={{ __html: template.html }}
          />
        </div>

        {template.text && (
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-500 mb-3">Versión texto plano:</div>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
              {template.text}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
