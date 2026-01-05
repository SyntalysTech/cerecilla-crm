"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";

export async function deleteAllClientes() {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta accion" };
  }

  const supabase = await createClient();

  // First, get count of clientes
  const { count, error: countError } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return { error: `Error al contar clientes: ${countError.message}` };
  }

  if (!count || count === 0) {
    return { error: "No hay clientes para eliminar" };
  }

  // Delete all clientes
  const { error: deleteError } = await supabase
    .from("clientes")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (neq a non-existent id)

  if (deleteError) {
    return { error: `Error al eliminar clientes: ${deleteError.message}` };
  }

  revalidatePath("/clientes");
  revalidatePath("/dashboard");
  revalidatePath("/admin/settings");

  return { success: true, count };
}
