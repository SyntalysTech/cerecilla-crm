"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface EstadoCount {
  estado: string;
  count: number;
}

// Get all unique estados with counts
export async function getEstadosConCantidad(): Promise<EstadoCount[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("estado");

  if (error) {
    console.error("Error fetching estados:", error);
    return [];
  }

  // Count by estado
  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const estado = row.estado || "Sin estado";
    counts[estado] = (counts[estado] || 0) + 1;
  }

  // Convert to array and sort
  return Object.entries(counts)
    .map(([estado, count]) => ({ estado, count }))
    .sort((a, b) => a.estado.localeCompare(b.estado));
}

// Get all available estados (from schema or existing data)
export async function getEstadosDisponibles(): Promise<string[]> {
  // Estados del sistema
  const estadosPredefinidos = [
    "SIN ESTADO",
    "SEGUIMIENTO",
    "PENDIENTE DOC",
    "EN TRAMITE",
    "COMISIONABLE",
    "LIQUIDADO",
    "FINALIZADO",
    "FALLIDO",
  ];

  const supabase = await createClient();

  // Also get any existing estados from the database
  const { data } = await supabase
    .from("clientes")
    .select("estado")
    .not("estado", "is", null);

  const estadosExistentes = new Set(
    (data || []).map((row) => row.estado).filter(Boolean)
  );

  // Merge and deduplicate
  const allEstados = new Set([...estadosPredefinidos, ...estadosExistentes]);

  return Array.from(allEstados).sort();
}

// Change all clients from one estado to another
export async function cambiarEstadosMasivo(
  estadoOrigen: string,
  estadoDestino: string
) {
  const supabase = await createClient();

  // Handle "Sin estado" as null
  const isNullEstado = estadoOrigen === "Sin estado" || estadoOrigen === "SIN ESTADO";

  let countResult;
  let updateResult;

  if (isNullEstado) {
    // Handle null estado
    countResult = await supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .is("estado", null);

    if (countResult.error) {
      return { error: countResult.error.message };
    }

    if (!countResult.count || countResult.count === 0) {
      return { error: `No hay clientes con estado "${estadoOrigen}"` };
    }

    // Perform the update
    updateResult = await supabase
      .from("clientes")
      .update({ estado: estadoDestino })
      .is("estado", null);
  } else {
    // Use ilike for case-insensitive matching
    countResult = await supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .ilike("estado", estadoOrigen);

    if (countResult.error) {
      return { error: countResult.error.message };
    }

    if (!countResult.count || countResult.count === 0) {
      return { error: `No hay clientes con estado "${estadoOrigen}"` };
    }

    // Perform the update using ilike for case-insensitive match
    updateResult = await supabase
      .from("clientes")
      .update({ estado: estadoDestino })
      .ilike("estado", estadoOrigen);
  }

  if (updateResult.error) {
    return { error: updateResult.error.message };
  }

  revalidatePath("/clientes");
  revalidatePath("/cambiar-estados");
  return { success: true, count: countResult.count };
}
