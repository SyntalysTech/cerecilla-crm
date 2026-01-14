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

  // Get total count first to know if we need pagination
  const { count: totalCount } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  // Fetch all clientes in batches (in case there are more than 1000)
  let allEstados: (string | null)[] = [];
  const batchSize = 1000;
  const totalBatches = Math.ceil((totalCount || 0) / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const { data, error } = await supabase
      .from("clientes")
      .select("estado")
      .range(i * batchSize, (i + 1) * batchSize - 1);

    if (error) {
      console.error("Error fetching estados batch:", error);
      continue;
    }

    if (data) {
      allEstados = allEstados.concat(data.map(row => row.estado));
    }
  }

  // Count by estado (normalize to uppercase for consistency)
  const counts: Record<string, number> = {};
  for (const estado of allEstados) {
    // Normalize estado: null -> "Sin estado", otherwise uppercase
    const normalized = estado ? estado.toUpperCase() : "SIN ESTADO";
    counts[normalized] = (counts[normalized] || 0) + 1;
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

  // Normalize estados to uppercase for consistency
  const normalizedOrigen = estadoOrigen.toUpperCase();
  const normalizedDestino = estadoDestino.toUpperCase();

  // Handle "SIN ESTADO" as null
  const isNullEstado = normalizedOrigen === "SIN ESTADO";

  let countResult;
  let updateResult;

  // Prepare update data - include fecha_comisionable if changing to COMISIONABLE
  const updateData: { estado: string; fecha_comisionable?: string } = { estado: normalizedDestino };
  if (normalizedDestino === "COMISIONABLE") {
    updateData.fecha_comisionable = new Date().toISOString();
  }

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
      .update(updateData)
      .is("estado", null);
  } else {
    // Use ilike for case-insensitive matching
    countResult = await supabase
      .from("clientes")
      .select("id", { count: "exact", head: true })
      .ilike("estado", normalizedOrigen);

    if (countResult.error) {
      return { error: countResult.error.message };
    }

    if (!countResult.count || countResult.count === 0) {
      return { error: `No hay clientes con estado "${estadoOrigen}"` };
    }

    // Perform the update using ilike for case-insensitive match
    updateResult = await supabase
      .from("clientes")
      .update(updateData)
      .ilike("estado", normalizedOrigen);
  }

  if (updateResult.error) {
    return { error: updateResult.error.message };
  }

  revalidatePath("/clientes");
  revalidatePath("/cambiar-estados");
  return { success: true, count: countResult.count };
}
