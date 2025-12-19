import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { NewCampaignForm } from "./new-campaign-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewCampaignPage() {
  const supabase = await createClient();

  // Get templates for dropdown
  const { data: templates } = await supabase
    .from("email_templates")
    .select("id, name, subject, html")
    .order("name", { ascending: true });

  // Get total count of clients
  const { count: totalClients } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true })
    .not("email", "is", null)
    .eq("unsubscribed", false);

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a campañas
        </Link>
      </div>

      <PageHeader
        title="Nueva Campaña"
        description="Crea y envía una campaña de email masivo"
      />

      <NewCampaignForm
        templates={templates || []}
        totalClients={totalClients || 0}
      />
    </div>
  );
}
