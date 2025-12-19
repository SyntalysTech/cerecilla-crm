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
  cuenta_bancaria?: string;
  tiene_doc_autonomo?: boolean;
  tiene_doc_escritura?: boolean;
  tiene_doc_cif?: boolean;
  tiene_doc_contrato?: boolean;
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
