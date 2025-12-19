import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { CampaignsList } from "./campaigns-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function CampaignsPage() {
  const supabase = await createClient();

  // Get all campaigns with stats
  const { data: campaigns, error } = await supabase
    .from("email_campaigns")
    .select(`
      *,
      template:email_templates(name)
    `)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Campañas"
        description="Seguimiento de campañas de email enviadas"
      >
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva campaña
        </Link>
      </PageHeader>

      <CampaignsList campaigns={campaigns || []} error={error?.message} />
    </div>
  );
}
