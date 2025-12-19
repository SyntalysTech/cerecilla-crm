"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
