import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserWithProfile, isAdmin, UserRole } from "@/lib/auth/actions";
import { PageHeader } from "@/components/page-header";
import { UsersTable } from "./users-table";
import { CreateUserButton } from "./create-user-button";

export default async function AdminUsersPage() {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const currentUser = await getUserWithProfile();

  // Get all profiles with their roles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: roles } = await supabase.from("user_roles").select("*");

  // Merge profiles with roles
  const usersWithRoles = (profiles || []).map((profile) => {
    const userRole = roles?.find((r) => r.user_id === profile.id);
    return {
      ...profile,
      is_active: profile.is_active ?? true,
      role: (userRole?.role as UserRole) || "viewer",
    };
  });

  return (
    <div>
      <PageHeader
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema y sus permisos"
      >
        <CreateUserButton />
      </PageHeader>

      <UsersTable
        users={usersWithRoles}
        currentUserId={currentUser?.id || ""}
        currentUserRole={currentUser?.role || "viewer"}
      />
    </div>
  );
}
