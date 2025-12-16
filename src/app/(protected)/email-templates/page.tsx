import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FileText, Plus } from "lucide-react";
import { TemplatesList } from "./templates-list";

export default async function EmailTemplatesPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Email Templates"
        description="Gestiona tus plantillas de email"
      >
        <Link
          href="/email-templates/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear plantilla
        </Link>
      </PageHeader>

      {templates && templates.length > 0 ? (
        <TemplatesList templates={templates} />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState
            icon={FileText}
            title="No hay plantillas"
            description="Crea tu primera plantilla de email para comenzar a enviar comunicaciones personalizadas."
            action={{
              label: "Crear plantilla",
              href: "/email-templates/new",
            }}
          />
        </div>
      )}
    </div>
  );
}
