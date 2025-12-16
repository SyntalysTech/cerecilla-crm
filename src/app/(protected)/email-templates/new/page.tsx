import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "../template-form";

export default function NewTemplatePage() {
  return (
    <div>
      <PageHeader
        title="Nueva plantilla"
        description="Crea una nueva plantilla de email"
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <TemplateForm />
      </div>
    </div>
  );
}
