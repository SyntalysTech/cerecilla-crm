"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Referido {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  referido_por_operario_id: string | null;
  referido_por_nombre: string | null;
  estado: string;
  notas: string | null;
  created_at: string;
  clientes_cargados?: number;
  comision_total?: number;
}

export interface ConfiguracionReferidos {
  id: string;
  comision_por_cliente: number;
  clientes_minimos_para_pago: number;
  activo: boolean;
}

export async function getReferidos() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("referidos")
    .select(`
      *,
      referido_clientes(count)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching referidos:", error);
    return [];
  }

  // Get config for commission calculation
  const { data: config } = await supabase
    .from("configuracion_referidos")
    .select("*")
    .single();

  const comisionPorCliente = config?.comision_por_cliente || 50;

  // Map with client count and commission
  return (data || []).map((r: any) => ({
    ...r,
    clientes_cargados: r.referido_clientes?.[0]?.count || 0,
    comision_total: (r.referido_clientes?.[0]?.count || 0) * comisionPorCliente,
  }));
}

export async function getConfiguracionReferidos(): Promise<ConfiguracionReferidos | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracion_referidos")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching configuracion:", error);
    return null;
  }

  return data;
}

export async function updateConfiguracionReferidos(config: Partial<ConfiguracionReferidos>) {
  const supabase = await createClient();

  // Get existing config
  const { data: existing } = await supabase
    .from("configuracion_referidos")
    .select("id")
    .single();

  if (existing) {
    const { error } = await supabase
      .from("configuracion_referidos")
      .update({
        ...config,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("configuracion_referidos")
      .insert({
        comision_por_cliente: config.comision_por_cliente || 50,
        clientes_minimos_para_pago: config.clientes_minimos_para_pago || 1,
        activo: config.activo ?? true,
      });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/referidos");
  return { success: true };
}

export async function createReferido(data: {
  nombre: string;
  telefono: string;
  email?: string;
  referido_por_operario_id?: string;
  referido_por_nombre?: string;
  notas?: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("referidos")
    .insert({
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email || null,
      referido_por_operario_id: data.referido_por_operario_id || null,
      referido_por_nombre: data.referido_por_nombre || null,
      notas: data.notas || null,
      estado: "pendiente",
    });

  if (error) {
    console.error("Error creating referido:", error);
    return { error: error.message };
  }

  revalidatePath("/referidos");
  return { success: true };
}

export async function updateReferido(id: string, data: Partial<Referido>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("referidos")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/referidos");
  return { success: true };
}

export async function deleteReferido(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("referidos")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/referidos");
  return { success: true };
}

export async function addClienteToReferido(referidoId: string, clienteId?: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("referido_clientes")
    .insert({
      referido_id: referidoId,
      cliente_id: clienteId || null,
    });

  if (error) {
    return { error: error.message };
  }

  // Update referido estado to convertido if it was pendiente
  await supabase
    .from("referidos")
    .update({ estado: "convertido", updated_at: new Date().toISOString() })
    .eq("id", referidoId)
    .eq("estado", "pendiente");

  revalidatePath("/referidos");
  return { success: true };
}

export async function getOperariosForSelect() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("operarios")
    .select("id, nombre, alias")
    .order("alias", { ascending: true });

  return data || [];
}
