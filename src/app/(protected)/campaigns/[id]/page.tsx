import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CampaignDetails } from "./campaign-details";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get campaign with template
  const { data: campaign, error: campaignError } = await supabase
    .from("email_campaigns")
    .select(`
      *,
      template:email_templates(id, name, subject, html)
    `)
    .eq("id", id)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  // Get recipients with their status
  const { data: recipients } = await supabase
    .from("email_campaign_recipients")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  // Get tracking events
  const { data: events } = await supabase
    .from("email_tracking_events")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

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
        title={campaign.name}
        description={campaign.subject}
      />

      <CampaignDetails
        campaign={campaign}
        recipients={recipients || []}
        events={events || []}
      />
    </div>
  );
}
