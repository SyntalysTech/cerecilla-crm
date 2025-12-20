"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail, isEmailConfigured } from "@/lib/email";

export interface Observacion {
  id: string;
  cliente_id: string;
  mensaje: string;
  es_admin: boolean;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  created_at: string;
}

export async function getObservaciones(clienteId: string, isAdmin: boolean) {
  const supabase = await createClient();

  let query = supabase
    .from("cliente_observaciones")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: true });

  // Non-admins can only see non-admin observations
  if (!isAdmin) {
    query = query.eq("es_admin", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching observaciones:", error);
    return [];
  }

  return data as Observacion[];
}

export async function addObservacion(
  clienteId: string,
  mensaje: string,
  esAdmin: boolean = false
) {
  const supabase = await createClient();

  // Get current user info
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // Get user details from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data, error } = await supabase
    .from("cliente_observaciones")
    .insert({
      cliente_id: clienteId,
      mensaje,
      es_admin: esAdmin,
      user_id: user.id,
      user_email: profile?.email || user.email,
      user_name: profile?.full_name || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding observacion:", error);
    return { error: error.message };
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath(`/clientes/${clienteId}/edit`);
  return { success: true, observacion: data };
}

export async function deleteObservacion(observacionId: string, clienteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("cliente_observaciones")
    .delete()
    .eq("id", observacionId);

  if (error) {
    console.error("Error deleting observacion:", error);
    return { error: error.message };
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath(`/clientes/${clienteId}/edit`);
  return { success: true };
}

// Enviar observación por email al operador asignado
export async function sendObservacionEmail(
  clienteId: string,
  observacionMensaje: string
) {
  if (!isEmailConfigured()) {
    return { error: "Email no configurado" };
  }

  const supabase = await createClient();

  // Get cliente info including operador
  const { data: cliente, error: clienteError } = await supabase
    .from("clientes")
    .select("id, nombre_apellidos, razon_social, operador")
    .eq("id", clienteId)
    .single();

  if (clienteError || !cliente) {
    return { error: "Cliente no encontrado" };
  }

  if (!cliente.operador) {
    return { error: "El cliente no tiene operador asignado" };
  }

  // Get operario email
  const { data: operario, error: operarioError } = await supabase
    .from("operarios")
    .select("email, nombre, alias")
    .or(`alias.eq.${cliente.operador},nombre.eq.${cliente.operador}`)
    .single();

  if (operarioError || !operario?.email) {
    return { error: "El operador no tiene email configurado" };
  }

  // Get current user info
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user?.id || "")
    .single();

  const senderName = profile?.full_name || profile?.email || "CRM Cerecilla";
  const clienteName = cliente.nombre_apellidos || cliente.razon_social || "Cliente";

  try {
    const result = await sendEmail({
      to: [{ email: operario.email, name: operario.nombre || operario.alias || "Operador" }],
      from: { email: process.env.SMTP_FROM_EMAIL || "noreply@cerecilla.com", name: "CRM Cerecilla" },
      subject: `Nueva observación para cliente: ${clienteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #BB292A;">Nueva Observación</h2>
          <p>Se ha añadido una nueva observación para el cliente <strong>${clienteName}</strong>:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; white-space: pre-wrap;">${observacionMensaje}</p>
          </div>
          <p style="color: #666; font-size: 14px;">
            Enviado por: ${senderName}<br>
            Fecha: ${new Date().toLocaleDateString("es-ES", { dateStyle: "full" })}
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Este mensaje fue enviado desde CRM Cerecilla.
          </p>
        </div>
      `,
    });

    if (!result.success) {
      return { error: result.error || "Error al enviar email" };
    }

    return { success: true };
  } catch (e) {
    console.error("Error sending observation email:", e);
    return { error: "Error al enviar email" };
  }
}
