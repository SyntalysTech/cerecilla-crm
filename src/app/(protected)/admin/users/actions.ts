"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdmin, getUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import type { UserRole } from "./constants";

export async function updateUserRole(userId: string, newRole: UserRole) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const { data: existingRole } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existingRole) {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: newRole,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserProfile(
  userId: string,
  data: {
    full_name?: string;
    phone?: string;
    department?: string;
    is_active?: boolean;
    notes?: string;
  }
) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("profiles").update(data).eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function createUser(data: {
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  notes?: string;
  send_magic_link?: boolean;
  password?: string;
}) {
  const isAdminUser = await isAdmin();
  const currentUser = await getUser();

  if (!isAdminUser || !currentUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Crear usuario en Supabase Auth
  let authResult;

  if (data.send_magic_link) {
    // Enviar magic link (invitación por email)
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      data.email,
      {
        data: {
          full_name: data.full_name,
        },
      }
    );

    if (inviteError) {
      // Si falla admin.inviteUserByEmail, intentar con signUp + magic link
      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: crypto.randomUUID(), // Password temporal
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (signUpError) {
        return { error: `Error al crear usuario: ${signUpError.message}` };
      }

      // Obtener el usuario recién creado
      const { data: users } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", data.email)
        .single();

      if (users) {
        authResult = { user: { id: users.id } };
      } else {
        return { error: "Usuario creado pero no se pudo obtener su ID" };
      }
    } else {
      authResult = inviteData;
    }
  } else if (data.password) {
    // Crear con contraseña directa
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
      },
    });

    if (signUpError) {
      return { error: `Error al crear usuario: ${signUpError.message}` };
    }

    authResult = signUpData;
  } else {
    return { error: "Debes especificar una contraseña o enviar magic link" };
  }

  if (!authResult?.user?.id) {
    return { error: "No se pudo obtener el ID del usuario creado" };
  }

  const userId = authResult.user.id;

  // Esperar un momento para que se cree el trigger de profile
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Actualizar profile con datos adicionales
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone || null,
      department: data.department || null,
      notes: data.notes || null,
      invited_by: currentUser.id,
      is_active: true,
    })
    .eq("id", userId);

  if (profileError) {
    console.error("Error updating profile:", profileError);
  }

  // Asignar rol
  const { error: roleError } = await supabase.from("user_roles").upsert({
    user_id: userId,
    role: data.role,
    created_by: currentUser.id,
  });

  if (roleError) {
    console.error("Error assigning role:", roleError);
    return { error: `Usuario creado pero error al asignar rol: ${roleError.message}` };
  }

  revalidatePath("/admin/users");
  return { success: true, userId };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  // Primero desactivar en lugar de eliminar (soft delete)
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function resendInvitation(email: string) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function generateMagicLink(email: string) {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    return { error: "No tienes permisos para realizar esta acción" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Magic link enviado al email del usuario" };
}
