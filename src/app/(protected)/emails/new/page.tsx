import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ComposeEmailForm } from "./compose-form";

export default async function ComposeEmailPage() {
  const supabase = await createClient();

  // Get templates for dropdown
  const { data: templates } = await supabase
    .from("email_templates")
    .select("id, name, subject, html, text")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Nuevo Email"
        description="Componer y enviar un nuevo email"
      />

      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <ComposeEmailForm templates={templates || []} />
      </div>
    </div>
  );
}
