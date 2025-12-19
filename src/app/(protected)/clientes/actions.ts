"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ClienteFormData {
  operador?: string;
  servicio?: string;
  estado?: string;
  tipo_persona?: string;
  nombre_apellidos?: string;
  razon_social?: string;
  cif_empresa?: string;
  nombre_admin?: string;
  dni_admin?: string;
  documento_nuevo_titular?: string;
  documento_anterior_titular?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuenta_bancaria?: string;
  cups_gas?: string;
  cups_luz?: string;
  compania_gas?: string;
  compania_luz?: string;
  potencia_gas?: string;
  potencia_luz?: string;
  tiene_suministro?: boolean | null;
  es_cambio_titular?: boolean | null;
  facturado?: boolean;
  cobrado?: boolean;
  pagado?: boolean;
  factura_pagos?: string;
  factura_cobros?: string;
  precio_kw_gas?: string;
  precio_kw_luz?: string;
  observaciones?: string;
  observaciones_admin?: string;
}

export async function createCliente(data: ClienteFormData) {
  const supabase = await createClient();

  // Get current user to track who created the client
  const { data: { user } } = await supabase.auth.getUser();

  let createdByEmail = user?.email;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();
    if (profile?.email) {
      createdByEmail = profile.email;
    }
  }

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert({
      ...data,
      created_by: user?.id || null,
      created_by_email: createdByEmail || null,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/clientes");
  return { success: true, cliente };
}

export async function updateCliente(id: string, data: ClienteFormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function deleteCliente(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/clientes");
  return { success: true };
}

export async function getCliente(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function duplicateCliente(id: string) {
  const supabase = await createClient();

  // Get original cliente
  const { data: original, error: fetchError } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !original) {
    return { error: "No se encontró el cliente" };
  }

  // Create copy without id and with current date
  const { id: _, created_at: __, ...clienteData } = original;

  const { data: newCliente, error: insertError } = await supabase
    .from("clientes")
    .insert({
      ...clienteData,
      nombre_apellidos: original.nombre_apellidos
        ? `${original.nombre_apellidos} (copia)`
        : original.razon_social
          ? `${original.razon_social} (copia)`
          : "Cliente (copia)",
    })
    .select()
    .single();

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/clientes");
  return { success: true, cliente: newCliente };
}

// Get operadores assigned to a cliente
export async function getClienteOperadores(clienteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cliente_operadores")
    .select("operario_id, operarios(id, nombre)")
    .eq("cliente_id", clienteId);

  if (error) {
    console.error("Error fetching cliente operadores:", error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((item: any) => ({
    id: item.operario_id,
    nombre: item.operarios?.nombre || "",
  }));
}

// Update operadores for a cliente
export async function updateClienteOperadores(clienteId: string, operarioIds: string[]) {
  const supabase = await createClient();

  // Delete existing assignments
  await supabase
    .from("cliente_operadores")
    .delete()
    .eq("cliente_id", clienteId);

  // Insert new assignments
  if (operarioIds.length > 0) {
    const { error } = await supabase
      .from("cliente_operadores")
      .insert(
        operarioIds.map((operarioId) => ({
          cliente_id: clienteId,
          operario_id: operarioId,
        }))
      );

    if (error) {
      console.error("Error updating cliente operadores:", error);
      return { error: error.message };
    }
  }

  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath(`/clientes/${clienteId}/edit`);
  return { success: true };
}
