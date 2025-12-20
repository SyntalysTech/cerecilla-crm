"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface OperarioFormData {
  alias?: string;
  nombre?: string;
  email?: string;
  telefonos?: string;
  tipo?: string;
  empresa?: string;
  cif?: string;
  documento?: string;
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
  nombre_admin?: string;
  dni_admin?: string;
  password_operario?: string;
  tiene_doc_autonomo?: boolean;
  tiene_doc_escritura?: boolean;
  tiene_doc_cif?: boolean;
  tiene_doc_contrato?: boolean;
  tiene_cuenta_bancaria?: boolean;
}

export async function updateOperario(id: string, data: OperarioFormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("operarios")
    .update(data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operarios");
  return { success: true };
}

export async function deleteOperario(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("operarios")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operarios");
  return { success: true };
}

// Comisiones personalizadas por operario
export interface OperarioComision {
  id?: string;
  operario_id: string;
  servicio: string;
  comision: number;
}

export async function getOperarioComisiones(operarioId: string): Promise<OperarioComision[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operario_comisiones")
    .select("*")
    .eq("operario_id", operarioId);

  if (error) {
    console.error("Error fetching comisiones:", error);
    return [];
  }

  return data || [];
}

export async function getComisionesDefecto(): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracion_comisiones")
    .select("servicio, comision_defecto");

  if (error) {
    console.error("Error fetching comisiones defecto:", error);
    return {
      Luz: 25,
      Gas: 25,
      Telefonía: 25,
      Seguros: 25,
      Alarmas: 25,
    };
  }

  const result: Record<string, number> = {};
  for (const row of data || []) {
    result[row.servicio] = row.comision_defecto;
  }

  return result;
}

export async function updateOperarioComisiones(operarioId: string, comisiones: { servicio: string; comision: number }[]) {
  const supabase = await createClient();

  // Delete existing comisiones
  await supabase
    .from("operario_comisiones")
    .delete()
    .eq("operario_id", operarioId);

  // Insert new ones (only if different from default)
  const { data: defaults } = await supabase
    .from("configuracion_comisiones")
    .select("servicio, comision_defecto");

  const defaultMap: Record<string, number> = {};
  for (const row of defaults || []) {
    defaultMap[row.servicio] = row.comision_defecto;
  }

  const toInsert = comisiones.filter(
    (c) => c.comision !== (defaultMap[c.servicio] || 25)
  );

  if (toInsert.length > 0) {
    const { error } = await supabase
      .from("operario_comisiones")
      .insert(
        toInsert.map((c) => ({
          operario_id: operarioId,
          servicio: c.servicio,
          comision: c.comision,
        }))
      );

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/operarios");
  return { success: true };
}
