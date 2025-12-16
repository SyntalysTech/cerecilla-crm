import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "../template-form";
import { getTemplate } from "../actions";

interface EditTemplatePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { id } = await params;
  const template = await getTemplate(id);

  if (!template) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Editar plantilla"
        description={`Editando: ${template.name}`}
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <TemplateForm template={template} />
      </div>
    </div>
  );
}
