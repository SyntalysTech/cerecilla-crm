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
  // These are common estados in energy CRMs
  const estadosPredefinidos = [
    "Nuevo",
    "Pendiente",
    "En proceso",
    "Validado",
    "Rechazado",
    "Comisionable",
    "Liquidado",
    "Cancelado",
    "Baja",
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
  const origenCondition = estadoOrigen === "Sin estado" ? null : estadoOrigen;

  // Get count first for reporting
  const { count, error: countError } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("estado", origenCondition);

  if (countError) {
    return { error: countError.message };
  }

  if (!count || count === 0) {
    return { error: `No hay clientes con estado "${estadoOrigen}"` };
  }

  // Perform the update
  const { error } = await supabase
    .from("clientes")
    .update({ estado: estadoDestino })
    .eq("estado", origenCondition);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/clientes");
  revalidatePath("/cambiar-estados");
  return { success: true, count };
}
