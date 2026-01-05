"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail, isEmailConfigured } from "@/lib/email";

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
  tipo_via?: string;
  nombre_via?: string;
  numero?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  codigo_postal?: string;
  poblacion?: string;
  provincia?: string;
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

  // If multiple services are selected, create a separate client for each service
  const servicios = data.servicio?.split(", ").filter(Boolean) || [];

  if (servicios.length > 1) {
    // Create multiple clients, one per service
    // If both Luz and Gas are selected, each ficha gets both CUPS
    const hasLuz = servicios.includes("Luz");
    const hasGas = servicios.includes("Gas");

    const clientesToCreate = servicios.map(servicio => {
      const clienteData = {
        ...data,
        servicio: servicio,
        created_by: user?.id || null,
        created_by_email: createdByEmail || null,
      };

      // If both Luz and Gas are selected, copy CUPS to both fichas
      if (hasLuz && hasGas) {
        // Both fichas get both CUPS values
        clienteData.cups_luz = data.cups_luz || "";
        clienteData.cups_gas = data.cups_gas || "";
      }

      return clienteData;
    });

    const { data: clientes, error } = await supabase
      .from("clientes")
      .insert(clientesToCreate)
      .select();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/clientes");
    // Return all created clients for document upload purposes
    return { success: true, cliente: clientes?.[0], clientes: clientes || [] };
  }

  // Single service - create one client
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
  return { success: true, cliente, clientes: [cliente] };
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

  // Create copy without id, created_at, and observaciones - keep original name without "(copia)"
  const { id: _, created_at: __, observaciones: _obs, observaciones_admin: _obsAdmin, ...clienteData } = original;

  const { data: newCliente, error: insertError } = await supabase
    .from("clientes")
    .insert({
      ...clienteData,
      observaciones: null,
      observaciones_admin: null,
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

// Get observaciones for a cliente from cliente_observaciones table
export async function getClienteObservaciones(clienteId: string) {
  const supabase = await createClient();

  // Check if user is admin to determine if they can see admin observations
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    isAdmin = userRole?.role === "admin" || userRole?.role === "super_admin" || userRole?.role === "manager";
  }

  // Fetch all observaciones - RLS will handle visibility
  const { data, error } = await supabase
    .from("cliente_observaciones")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching observaciones:", error);
    return { observaciones: [], isAdmin };
  }

  return { observaciones: data || [], isAdmin };
}

// Notificar cambio de estado al operador
export async function notifyEstadoChange(
  clienteId: string,
  estadoAnterior: string,
  estadoNuevo: string
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

  const clienteName = cliente.nombre_apellidos || cliente.razon_social || "Cliente";

  try {
    const result = await sendEmail({
      to: [{ email: operario.email, name: operario.nombre || operario.alias || "Operador" }],
      from: { email: process.env.SMTP_FROM_EMAIL || "noreply@cerecilla.com", name: "CRM Cerecilla" },
      subject: `Cambio de estado: ${clienteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #BB292A;">Cambio de Estado</h2>
          <p>El cliente <strong>${clienteName}</strong> ha cambiado de estado:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <span style="display: inline-block; padding: 8px 16px; background: #e5e5e5; border-radius: 6px; font-weight: bold;">${estadoAnterior || "Sin estado"}</span>
            <span style="display: inline-block; margin: 0 15px; font-size: 24px;">→</span>
            <span style="display: inline-block; padding: 8px 16px; background: #BB292A; color: white; border-radius: 6px; font-weight: bold;">${estadoNuevo}</span>
          </div>
          <p style="color: #666; font-size: 14px;">
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
    console.error("Error sending estado change email:", e);
    return { error: "Error al enviar email" };
  }
}
