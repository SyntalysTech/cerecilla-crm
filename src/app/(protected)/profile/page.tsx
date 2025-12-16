import { PageHeader } from "@/components/page-header";
import { getUser } from "@/lib/auth/actions";
import { User, Mail, Calendar } from "lucide-react";

export default async function ProfilePage() {
  const user = await getUser();

  return (
    <div>
      <PageHeader
        title="Mi Perfil"
        description="Información de tu cuenta"
      />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-[#87CEEB] flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-gray-700" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {user?.user_metadata?.full_name || "Usuario"}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>

              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Miembro desde{" "}
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Para cambiar tu contraseña o configuración de cuenta, contacta con el
            administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
