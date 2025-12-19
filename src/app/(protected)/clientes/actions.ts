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

  const { data: cliente, error } = await supabase
    .from("clientes")
    .insert(data)
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
