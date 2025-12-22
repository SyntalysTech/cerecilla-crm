"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin, getUser } from "@/lib/auth/actions";

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

// ==========================================
// Funciones para gestión de cuentas de operarios
// ==========================================

export async function getOperarioUserStatus(operarioId: string) {
  const supabase = await createClient();

  const { data: operario, error } = await supabase
    .from("operarios")
    .select("user_id, email, alias, nombre")
    .eq("id", operarioId)
    .single();

  if (error) {
    return { error: error.message };
  }

  if (!operario.user_id) {
    return { hasAccount: false, email: operario.email };
  }

  // Obtener info del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, is_active")
    .eq("id", operario.user_id)
    .single();

  return {
    hasAccount: true,
    userId: operario.user_id,
    email: profile?.email || operario.email,
    fullName: profile?.full_name,
    isActive: profile?.is_active ?? true,
  };
}

export async function createOperarioAccount(
  operarioId: string,
  password: string
) {
  const isAdminUser = await isAdmin();
  const currentUser = await getUser();

  if (!isAdminUser || !currentUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Obtener datos del operario
  const { data: operario, error: operarioError } = await supabase
    .from("operarios")
    .select("id, email, alias, nombre, user_id")
    .eq("id", operarioId)
    .single();

  if (operarioError || !operario) {
    return { error: "Operario no encontrado" };
  }

  if (operario.user_id) {
    return { error: "Este operario ya tiene una cuenta vinculada" };
  }

  if (!operario.email) {
    return { error: "El operario no tiene email configurado" };
  }

  // Crear usuario en Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: operario.email,
    password: password,
    options: {
      data: {
        full_name: operario.nombre || operario.alias || operario.email,
      },
    },
  });

  if (signUpError) {
    return { error: `Error al crear usuario: ${signUpError.message}` };
  }

  if (!signUpData?.user?.id) {
    return { error: "No se pudo obtener el ID del usuario creado" };
  }

  const userId = signUpData.user.id;

  // Esperar un momento para que se cree el trigger de profile
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Actualizar profile con datos adicionales
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    email: operario.email,
    full_name: operario.nombre || operario.alias || operario.email,
    invited_by: currentUser.id,
    is_active: true,
  });

  if (profileError) {
    console.error("Error updating profile:", profileError);
  }

  // Asignar rol 'operario'
  const { error: roleError } = await supabase.from("user_roles").upsert({
    user_id: userId,
    role: "operario",
    created_by: currentUser.id,
  });

  if (roleError) {
    console.error("Error assigning role:", roleError);
    return { error: `Usuario creado pero error al asignar rol: ${roleError.message}` };
  }

  // Vincular operario con usuario
  const { error: linkError } = await supabase
    .from("operarios")
    .update({ user_id: userId })
    .eq("id", operarioId);

  if (linkError) {
    return { error: `Usuario creado pero error al vincularlo: ${linkError.message}` };
  }

  revalidatePath("/operarios");
  return { success: true, userId };
}

export async function unlinkOperarioAccount(operarioId: string) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Desvincular (no eliminar el usuario, solo quitar el vínculo)
  const { error } = await supabase
    .from("operarios")
    .update({ user_id: null })
    .eq("id", operarioId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/operarios");
  return { success: true };
}

export async function resetOperarioPassword(operarioId: string, newPassword: string) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Obtener user_id del operario
  const { data: operario, error: operarioError } = await supabase
    .from("operarios")
    .select("user_id, email")
    .eq("id", operarioId)
    .single();

  if (operarioError || !operario?.user_id) {
    return { error: "Operario no tiene cuenta vinculada" };
  }

  // Actualizar contraseña usando admin API
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    operario.user_id,
    { password: newPassword }
  );

  if (updateError) {
    return { error: `Error al actualizar contraseña: ${updateError.message}` };
  }

  return { success: true };
}

// ==========================================
// Funciones para gestión de permisos de operarios
// ==========================================

export interface OperarioPermisos {
  id?: string;
  operario_id: string;
  puede_ver_clientes: boolean;
  puede_ver_solo_sus_clientes: boolean;
  puede_ver_estadisticas: boolean;
  puede_ver_facturacion: boolean;
  puede_ver_documentos: boolean;
  puede_crear_clientes: boolean;
  puede_editar_clientes: boolean;
  puede_editar_solo_sus_clientes: boolean;
  puede_eliminar_clientes: boolean;
  puede_subir_documentos: boolean;
  puede_eliminar_documentos: boolean;
  puede_cambiar_estado: boolean;
  estados_permitidos: string[];
  puede_ver_comisiones: boolean;
  puede_ver_observaciones_admin: boolean;
  puede_exportar_datos: boolean;
}

const DEFAULT_PERMISOS: Omit<OperarioPermisos, "id" | "operario_id"> = {
  puede_ver_clientes: true,
  puede_ver_solo_sus_clientes: true,
  puede_ver_estadisticas: false,
  puede_ver_facturacion: false,
  puede_ver_documentos: true,
  puede_crear_clientes: true,
  puede_editar_clientes: true,
  puede_editar_solo_sus_clientes: true,
  puede_eliminar_clientes: false,
  puede_subir_documentos: true,
  puede_eliminar_documentos: false,
  puede_cambiar_estado: false,
  estados_permitidos: ["Seguimiento", "En Tramite"],
  puede_ver_comisiones: true,
  puede_ver_observaciones_admin: false,
  puede_exportar_datos: false,
};

export async function getOperarioPermisos(operarioId: string): Promise<OperarioPermisos> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operario_permisos")
    .select("*")
    .eq("operario_id", operarioId)
    .single();

  if (error || !data) {
    // Return defaults if no custom permissions exist
    return {
      operario_id: operarioId,
      ...DEFAULT_PERMISOS,
    };
  }

  return {
    id: data.id,
    operario_id: data.operario_id,
    puede_ver_clientes: data.puede_ver_clientes ?? true,
    puede_ver_solo_sus_clientes: data.puede_ver_solo_sus_clientes ?? true,
    puede_ver_estadisticas: data.puede_ver_estadisticas ?? false,
    puede_ver_facturacion: data.puede_ver_facturacion ?? false,
    puede_ver_documentos: data.puede_ver_documentos ?? true,
    puede_crear_clientes: data.puede_crear_clientes ?? true,
    puede_editar_clientes: data.puede_editar_clientes ?? true,
    puede_editar_solo_sus_clientes: data.puede_editar_solo_sus_clientes ?? true,
    puede_eliminar_clientes: data.puede_eliminar_clientes ?? false,
    puede_subir_documentos: data.puede_subir_documentos ?? true,
    puede_eliminar_documentos: data.puede_eliminar_documentos ?? false,
    puede_cambiar_estado: data.puede_cambiar_estado ?? false,
    estados_permitidos: data.estados_permitidos ?? ["Seguimiento", "En Tramite"],
    puede_ver_comisiones: data.puede_ver_comisiones ?? true,
    puede_ver_observaciones_admin: data.puede_ver_observaciones_admin ?? false,
    puede_exportar_datos: data.puede_exportar_datos ?? false,
  };
}

export async function updateOperarioPermisos(
  operarioId: string,
  permisos: Partial<Omit<OperarioPermisos, "id" | "operario_id">>
) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Check if record exists
  const { data: existing } = await supabase
    .from("operario_permisos")
    .select("id")
    .eq("operario_id", operarioId)
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("operario_permisos")
      .update({
        ...permisos,
        updated_at: new Date().toISOString(),
      })
      .eq("operario_id", operarioId);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Insert new
    const { error } = await supabase.from("operario_permisos").insert({
      operario_id: operarioId,
      ...DEFAULT_PERMISOS,
      ...permisos,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/operarios");
  return { success: true };
}
