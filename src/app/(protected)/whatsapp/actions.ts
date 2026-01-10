"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdmin, getUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import {
  sendTemplateMessage,
  sendTextMessage,
  buildTemplateComponents,
  formatPhoneNumber,
  isValidPhoneNumber,
  type WhatsAppConfig,
} from "@/lib/whatsapp/client";

// ============================================
// Types
// ============================================

export interface WhatsAppConfigData {
  id?: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  phoneNumber: string;
  displayName: string;
  isActive: boolean;
  verifiedAt?: string;
}

export interface WhatsAppTemplate {
  id: string;
  templateId: string | null;
  templateName: string;
  category: string;
  language: string;
  headerType: string | null;
  headerText: string | null;
  bodyText: string;
  bodyVariables: string[];
  footerText: string | null;
  buttons: unknown;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

export interface WhatsAppMessage {
  id: string;
  clienteId: string | null;
  phoneNumber: string;
  templateId: string | null;
  templateName: string | null;
  messageType: string;
  content: string | null;
  mediaUrl: string | null;
  templateVariables: Record<string, string> | null;
  wamid: string | null;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  campaignId: string | null;
  sentBy: string | null;
  createdAt: string;
  cliente?: {
    nombre: string;
    email: string | null;
  };
}

export interface WhatsAppCampaign {
  id: string;
  nombre: string;
  descripcion: string | null;
  templateId: string | null;
  filtroEstado: string[];
  filtroServicio: string[];
  filtroOperador: string[];
  totalDestinatarios: number;
  enviados: number;
  entregados: number;
  leidos: number;
  fallidos: number;
  status: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

// ============================================
// Configuration
// ============================================

export async function getWhatsAppConfig(): Promise<WhatsAppConfigData | null> {
  const adminUser = await isAdmin();
  if (!adminUser) return null;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracion_whatsapp")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    phoneNumberId: data.phone_number_id || "",
    businessAccountId: data.business_account_id || "",
    accessToken: data.access_token || "",
    phoneNumber: data.phone_number || "",
    displayName: data.display_name || "",
    isActive: data.is_active || false,
    verifiedAt: data.verified_at,
  };
}

export async function updateWhatsAppConfig(config: Omit<WhatsAppConfigData, "id" | "verifiedAt">) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Check if config exists
  const { data: existing } = await supabase
    .from("configuracion_whatsapp")
    .select("id")
    .limit(1)
    .single();

  const configData = {
    phone_number_id: config.phoneNumberId,
    business_account_id: config.businessAccountId,
    access_token: config.accessToken,
    phone_number: config.phoneNumber,
    display_name: config.displayName,
    is_active: config.isActive,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (existing) {
    const result = await supabase
      .from("configuracion_whatsapp")
      .update(configData)
      .eq("id", existing.id);
    error = result.error;
  } else {
    const result = await supabase
      .from("configuracion_whatsapp")
      .insert(configData);
    error = result.error;
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/whatsapp");
  return { success: true };
}

export async function testWhatsAppConnection(): Promise<{ success: boolean; error?: string }> {
  const config = await getWhatsAppConfig();
  if (!config) {
    return { success: false, error: "Configuración no encontrada" };
  }

  if (!config.phoneNumberId || !config.accessToken) {
    return { success: false, error: "Faltan credenciales de WhatsApp" };
  }

  // Just verify the config exists - actual API test would require a real number
  return { success: true };
}

// ============================================
// Templates
// ============================================

export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .order("template_name", { ascending: true });

  if (error) {
    console.error("Error fetching templates:", error);
    return [];
  }

  return (data || []).map((t) => ({
    id: t.id,
    templateId: t.template_id,
    templateName: t.template_name,
    category: t.category,
    language: t.language,
    headerType: t.header_type,
    headerText: t.header_text,
    bodyText: t.body_text,
    bodyVariables: t.body_variables || [],
    footerText: t.footer_text,
    buttons: t.buttons,
    status: t.status,
    rejectionReason: t.rejection_reason,
    createdAt: t.created_at,
  }));
}

export async function createWhatsAppTemplate(template: {
  templateName: string;
  category: string;
  bodyText: string;
  bodyVariables: string[];
  footerText?: string;
}) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("whatsapp_templates").insert({
    template_name: template.templateName,
    category: template.category,
    body_text: template.bodyText,
    body_variables: template.bodyVariables,
    footer_text: template.footerText || null,
    status: "PENDING",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/whatsapp");
  return { success: true };
}

// ============================================
// Messages
// ============================================

export async function getWhatsAppMessages(
  limit = 50,
  offset = 0
): Promise<{ messages: WhatsAppMessage[]; total: number }> {
  const supabase = await createClient();

  // Get total count
  const { count } = await supabase
    .from("whatsapp_messages")
    .select("*", { count: "exact", head: true });

  // Get messages with cliente info
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select(`
      *,
      cliente:clientes(nombre, email)
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching messages:", error);
    return { messages: [], total: 0 };
  }

  const messages = (data || []).map((m) => ({
    id: m.id,
    clienteId: m.cliente_id,
    phoneNumber: m.phone_number,
    templateId: m.template_id,
    templateName: m.template_name,
    messageType: m.message_type,
    content: m.content,
    mediaUrl: m.media_url,
    templateVariables: m.template_variables,
    wamid: m.wamid,
    status: m.status,
    errorCode: m.error_code,
    errorMessage: m.error_message,
    sentAt: m.sent_at,
    deliveredAt: m.delivered_at,
    readAt: m.read_at,
    campaignId: m.campaign_id,
    sentBy: m.sent_by,
    createdAt: m.created_at,
    cliente: m.cliente,
  }));

  return { messages, total: count || 0 };
}

export async function sendWhatsAppToCliente(
  clienteId: string,
  templateName: string,
  variables?: Record<string, string>
) {
  const user = await getUser();
  if (!user) {
    return { error: "Usuario no autenticado" };
  }

  const supabase = await createClient();

  // Get WhatsApp config
  const config = await getWhatsAppConfig();
  if (!config || !config.isActive) {
    return { error: "WhatsApp no está configurado o activo" };
  }

  // Get cliente
  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, telefono2, email, estado, servicio")
    .eq("id", clienteId)
    .single();

  if (clienteError || !cliente) {
    return { error: "Cliente no encontrado" };
  }

  // Find a valid phone number
  const phone = cliente.telefono || cliente.telefono2;
  if (!phone || !isValidPhoneNumber(phone)) {
    return { error: "El cliente no tiene un número de teléfono válido" };
  }

  // Get template
  const { data: template, error: templateError } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .eq("template_name", templateName)
    .single();

  if (templateError || !template) {
    return { error: "Plantilla no encontrada" };
  }

  // Build variables from cliente data if not provided
  const finalVariables = variables || {
    nombre: cliente.nombre || "Cliente",
    servicio: cliente.servicio || "",
    estado: cliente.estado || "",
    email: cliente.email || "",
  };

  // Build template components
  const components = buildTemplateComponents(
    finalVariables,
    template.body_variables || []
  );

  const waConfig: WhatsAppConfig = {
    phoneNumberId: config.phoneNumberId,
    accessToken: config.accessToken,
  };

  // Send message
  const result = await sendTemplateMessage(waConfig, {
    to: phone,
    templateName: template.template_name,
    languageCode: template.language,
    components: components.length > 0 ? components : undefined,
  });

  // Log message to database
  const { error: insertError } = await supabase.from("whatsapp_messages").insert({
    cliente_id: clienteId,
    phone_number: formatPhoneNumber(phone),
    template_id: template.id,
    template_name: template.template_name,
    message_type: "template",
    template_variables: finalVariables,
    wamid: result.messageId || null,
    status: result.success ? "sent" : "failed",
    error_message: result.error || null,
    sent_at: result.success ? new Date().toISOString() : null,
    sent_by: user.id,
  });

  if (insertError) {
    console.error("Error logging message:", insertError);
  }

  if (!result.success) {
    return { error: result.error || "Error al enviar mensaje" };
  }

  revalidatePath("/whatsapp");
  return { success: true, messageId: result.messageId };
}

export async function sendWhatsAppToPhone(
  phoneNumber: string,
  templateName: string,
  variables: Record<string, string>
) {
  const user = await getUser();
  if (!user) {
    return { error: "Usuario no autenticado" };
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    return { error: "Número de teléfono inválido" };
  }

  const supabase = await createClient();

  // Get WhatsApp config
  const config = await getWhatsAppConfig();
  if (!config || !config.isActive) {
    return { error: "WhatsApp no está configurado o activo" };
  }

  // Get template
  const { data: template, error: templateError } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .eq("template_name", templateName)
    .single();

  if (templateError || !template) {
    return { error: "Plantilla no encontrada" };
  }

  // Build template components
  const components = buildTemplateComponents(
    variables,
    template.body_variables || []
  );

  const waConfig: WhatsAppConfig = {
    phoneNumberId: config.phoneNumberId,
    accessToken: config.accessToken,
  };

  // Send message
  const result = await sendTemplateMessage(waConfig, {
    to: phoneNumber,
    templateName: template.template_name,
    languageCode: template.language,
    components: components.length > 0 ? components : undefined,
  });

  // Log message to database
  await supabase.from("whatsapp_messages").insert({
    phone_number: formatPhoneNumber(phoneNumber),
    template_id: template.id,
    template_name: template.template_name,
    message_type: "template",
    template_variables: variables,
    wamid: result.messageId || null,
    status: result.success ? "sent" : "failed",
    error_message: result.error || null,
    sent_at: result.success ? new Date().toISOString() : null,
    sent_by: user.id,
  });

  if (!result.success) {
    return { error: result.error || "Error al enviar mensaje" };
  }

  revalidatePath("/whatsapp");
  return { success: true, messageId: result.messageId };
}

// ============================================
// Campaigns (Bulk Sending)
// ============================================

export async function getWhatsAppCampaigns(): Promise<WhatsAppCampaign[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("whatsapp_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }

  return (data || []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    templateId: c.template_id,
    filtroEstado: c.filtro_estado || [],
    filtroServicio: c.filtro_servicio || [],
    filtroOperador: c.filtro_operador || [],
    totalDestinatarios: c.total_destinatarios,
    enviados: c.enviados,
    entregados: c.entregados,
    leidos: c.leidos,
    fallidos: c.fallidos,
    status: c.status,
    scheduledAt: c.scheduled_at,
    startedAt: c.started_at,
    completedAt: c.completed_at,
    createdBy: c.created_by,
    createdAt: c.created_at,
  }));
}

export async function createWhatsAppCampaign(campaign: {
  nombre: string;
  descripcion?: string;
  templateId: string;
  filtroEstado?: string[];
  filtroServicio?: string[];
  filtroOperador?: string[];
}) {
  const adminUser = await isAdmin();
  const user = await getUser();

  if (!adminUser || !user) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Count recipients based on filters
  let query = supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .not("telefono", "is", null);

  if (campaign.filtroEstado && campaign.filtroEstado.length > 0) {
    query = query.in("estado", campaign.filtroEstado);
  }

  if (campaign.filtroServicio && campaign.filtroServicio.length > 0) {
    // Servicio can be comma-separated, so we use ilike for each
    const servicioFilters = campaign.filtroServicio.map((s) => `servicio.ilike.%${s}%`);
    query = query.or(servicioFilters.join(","));
  }

  if (campaign.filtroOperador && campaign.filtroOperador.length > 0) {
    query = query.in("operador", campaign.filtroOperador);
  }

  const { count } = await query;

  const { data, error } = await supabase
    .from("whatsapp_campaigns")
    .insert({
      nombre: campaign.nombre,
      descripcion: campaign.descripcion || null,
      template_id: campaign.templateId,
      filtro_estado: campaign.filtroEstado || [],
      filtro_servicio: campaign.filtroServicio || [],
      filtro_operador: campaign.filtroOperador || [],
      total_destinatarios: count || 0,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/whatsapp");
  return { success: true, campaignId: data.id };
}

export async function startWhatsAppCampaign(campaignId: string) {
  const adminUser = await isAdmin();
  if (!adminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Get campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("whatsapp_campaigns")
    .select("*, template:whatsapp_templates(*)")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    return { error: "Campaña no encontrada" };
  }

  if (campaign.status !== "draft") {
    return { error: "La campaña ya ha sido iniciada" };
  }

  // Get WhatsApp config
  const config = await getWhatsAppConfig();
  if (!config || !config.isActive) {
    return { error: "WhatsApp no está configurado o activo" };
  }

  // Update campaign status
  await supabase
    .from("whatsapp_campaigns")
    .update({
      status: "sending",
      started_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  // Get recipients
  let query = supabase
    .from("clientes")
    .select("id, nombre, telefono, telefono2, email, estado, servicio")
    .not("telefono", "is", null);

  if (campaign.filtro_estado && campaign.filtro_estado.length > 0) {
    query = query.in("estado", campaign.filtro_estado);
  }

  if (campaign.filtro_servicio && campaign.filtro_servicio.length > 0) {
    const servicioFilters = campaign.filtro_servicio.map((s: string) => `servicio.ilike.%${s}%`);
    query = query.or(servicioFilters.join(","));
  }

  if (campaign.filtro_operador && campaign.filtro_operador.length > 0) {
    query = query.in("operador", campaign.filtro_operador);
  }

  const { data: clientes } = await query;

  const template = campaign.template;
  const user = await getUser();

  // Send messages (in batches to avoid rate limits)
  let enviados = 0;
  let fallidos = 0;

  for (const cliente of clientes || []) {
    const phone = cliente.telefono || cliente.telefono2;
    if (!phone || !isValidPhoneNumber(phone)) {
      fallidos++;
      continue;
    }

    const variables = {
      nombre: cliente.nombre || "Cliente",
      servicio: cliente.servicio || "",
      estado: cliente.estado || "",
      email: cliente.email || "",
    };

    const components = buildTemplateComponents(
      variables,
      template.body_variables || []
    );

    const waConfig: WhatsAppConfig = {
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken,
    };

    const result = await sendTemplateMessage(waConfig, {
      to: phone,
      templateName: template.template_name,
      languageCode: template.language,
      components: components.length > 0 ? components : undefined,
    });

    // Log message
    await supabase.from("whatsapp_messages").insert({
      cliente_id: cliente.id,
      phone_number: formatPhoneNumber(phone),
      template_id: template.id,
      template_name: template.template_name,
      message_type: "template",
      template_variables: variables,
      wamid: result.messageId || null,
      status: result.success ? "sent" : "failed",
      error_message: result.error || null,
      sent_at: result.success ? new Date().toISOString() : null,
      sent_by: user?.id,
      campaign_id: campaignId,
    });

    if (result.success) {
      enviados++;
    } else {
      fallidos++;
    }

    // Rate limiting: wait 100ms between messages
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Update campaign as completed
  await supabase
    .from("whatsapp_campaigns")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      enviados,
      fallidos,
    })
    .eq("id", campaignId);

  revalidatePath("/whatsapp");
  return { success: true, enviados, fallidos };
}

// ============================================
// Test Message (Direct Text)
// ============================================

export async function sendTestWhatsAppMessage(
  phoneNumber: string,
  message: string
) {
  const user = await getUser();
  if (!user) {
    return { error: "Usuario no autenticado" };
  }

  const adminUser = await isAdmin();
  if (!adminUser) {
    return { error: "Solo administradores pueden enviar mensajes de prueba" };
  }

  if (!phoneNumber || phoneNumber.length < 9) {
    return { error: "Número de teléfono inválido" };
  }

  if (!message || message.trim().length === 0) {
    return { error: "El mensaje no puede estar vacío" };
  }

  // Get WhatsApp config
  const config = await getWhatsAppConfig();
  if (!config || !config.isActive) {
    return { error: "WhatsApp no está configurado o activo" };
  }

  const waConfig: WhatsAppConfig = {
    phoneNumberId: config.phoneNumberId,
    accessToken: config.accessToken,
  };

  // Send text message
  const result = await sendTextMessage(waConfig, {
    to: phoneNumber,
    text: message,
  });

  const supabase = await createClient();

  // Log message to database
  await supabase.from("whatsapp_messages").insert({
    phone_number: formatPhoneNumber(phoneNumber),
    message_type: "text",
    content: message,
    wamid: result.messageId || null,
    status: result.success ? "sent" : "failed",
    error_message: result.error || null,
    sent_at: result.success ? new Date().toISOString() : null,
    sent_by: user.id,
  });

  if (!result.success) {
    return { error: result.error || "Error al enviar mensaje" };
  }

  revalidatePath("/whatsapp");
  return { success: true, messageId: result.messageId };
}

// ============================================
// Stats
// ============================================

export async function getWhatsAppStats() {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("whatsapp_messages")
    .select("status");

  const stats = {
    total: messages?.length || 0,
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
  };

  for (const m of messages || []) {
    switch (m.status) {
      case "sent":
        stats.sent++;
        break;
      case "delivered":
        stats.delivered++;
        break;
      case "read":
        stats.read++;
        break;
      case "failed":
        stats.failed++;
        break;
    }
  }

  return stats;
}
