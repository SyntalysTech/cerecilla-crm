"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

interface CreateCampaignData {
  name: string;
  templateId?: string;
  subject: string;
  html: string;
  filters?: {
    estado?: string;
    servicio?: string;
    operador?: string;
  };
}

export async function createCampaign(data: CreateCampaignData) {
  const user = await getUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();

  // Build query for recipients
  let query = supabase
    .from("clientes")
    .select("id, email, nombre_apellidos, razon_social")
    .not("email", "is", null)
    .neq("email", "");

  // Apply filters
  if (data.filters?.estado) {
    query = query.eq("estado", data.filters.estado);
  }
  if (data.filters?.servicio) {
    query = query.eq("servicio", data.filters.servicio);
  }
  if (data.filters?.operador) {
    query = query.ilike("operador", `%${data.filters.operador}%`);
  }

  // Check for unsubscribed - if column exists
  // query = query.or("unsubscribed.is.null,unsubscribed.eq.false");

  const { data: recipients, error: recipientsError } = await query;

  if (recipientsError) {
    console.error("Error fetching recipients:", recipientsError);
    return { error: "Error al obtener destinatarios" };
  }

  if (!recipients || recipients.length === 0) {
    return { error: "No hay destinatarios que cumplan los filtros seleccionados" };
  }

  // Filter out empty emails and duplicates
  const validRecipients = recipients.filter(r => r.email && r.email.trim() !== "");
  const uniqueEmails = new Map<string, typeof validRecipients[0]>();
  validRecipients.forEach(r => {
    const email = r.email!.toLowerCase().trim();
    if (!uniqueEmails.has(email)) {
      uniqueEmails.set(email, r);
    }
  });
  const finalRecipients = Array.from(uniqueEmails.values());

  if (finalRecipients.length === 0) {
    return { error: "No hay emails válidos en los destinatarios seleccionados" };
  }

  // Create campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("email_campaigns")
    .insert({
      name: data.name,
      subject: data.subject,
      template_id: data.templateId || null,
      html_content: data.html,
      status: "sending",
      total_recipients: finalRecipients.length,
      sent_count: 0,
      open_count: 0,
      click_count: 0,
      unsubscribe_count: 0,
      bounce_count: 0,
      created_by: user.id,
      filters: data.filters || null,
    })
    .select()
    .single();

  if (campaignError) {
    console.error("Error creating campaign:", campaignError);
    return { error: "Error al crear la campaña: " + campaignError.message };
  }

  // Create recipient records
  const recipientRecords = finalRecipients.map(r => ({
    campaign_id: campaign.id,
    cliente_id: r.id,
    email: r.email!.toLowerCase().trim(),
    name: r.nombre_apellidos || r.razon_social || null,
    status: "pending",
    open_count: 0,
  }));

  const { error: recipientsInsertError } = await supabase
    .from("email_campaign_recipients")
    .insert(recipientRecords);

  if (recipientsInsertError) {
    console.error("Error creating recipients:", recipientsInsertError);
    // Don't fail - campaign was created
  }

  // TODO: Start sending emails in background
  // For now, mark as sent immediately (demo purposes)
  await supabase
    .from("email_campaigns")
    .update({
      status: "sent",
      sent_count: finalRecipients.length,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaign.id);

  // Update recipients as sent
  await supabase
    .from("email_campaign_recipients")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("campaign_id", campaign.id);

  revalidatePath("/campaigns");
  return { success: true, campaignId: campaign.id };
}

export async function getCampaignStats(campaignId: string) {
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    return null;
  }

  // Get actual counts from recipients
  const { count: openedCount } = await supabase
    .from("email_campaign_recipients")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .not("opened_at", "is", null);

  const { count: clickedCount } = await supabase
    .from("email_campaign_recipients")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .not("clicked_at", "is", null);

  const { count: unsubscribedCount } = await supabase
    .from("email_campaign_recipients")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .not("unsubscribed_at", "is", null);

  return {
    ...campaign,
    open_count: openedCount || 0,
    click_count: clickedCount || 0,
    unsubscribe_count: unsubscribedCount || 0,
  };
}

// Note: addTrackingToHtml is exported from @/lib/email-tracking
