import { PageHeader } from "@/components/page-header";
import { getUser, getUserWithProfile } from "@/lib/auth/actions";
import { User, Mail, Calendar, Shield } from "lucide-react";
import { ProfileForm } from "./profile-form";

const roleLabels: Record<string, string> = {
  super_admin: "Super Administrador",
  admin: "Administrador",
  manager: "Manager",
  agent: "Agente",
  collaborator: "Colaborador",
  viewer: "Visualizador",
};

export default async function ProfilePage() {
  const user = await getUser();
  const profile = await getUserWithProfile();

  return (
    <div>
      <PageHeader
        title="Mi Perfil"
        description="Gestiona tu cuenta y preferencias"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - User info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-[#87CEEB] flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-gray-700" />
              </div>

              {/* Name */}
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {profile?.full_name || "Usuario"}
              </h2>

              {/* Role badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#BB292A]/10 text-[#BB292A] mb-4">
                <Shield className="w-3 h-3" />
                {roleLabels[profile?.role || "viewer"]}
              </span>

              {/* Info items */}
              <div className="w-full space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{user?.email}</span>
                </div>

                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    Miembro desde{" "}
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Forms */}
        <div className="lg:col-span-2">
          <ProfileForm initialName={profile?.full_name || ""} />
        </div>
      </div>
    </div>
  );
}
