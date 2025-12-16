"use client";

import { useState } from "react";
import {
  User,
  Shield,
  ShieldCheck,
  Crown,
  Users,
  Eye,
  Briefcase,
  MoreVertical,
  Mail,
  Power,
  PowerOff,
  Phone,
  Building,
} from "lucide-react";
import {
  updateUserRole,
  toggleUserActive,
  generateMagicLink,
} from "./actions";
import { UserRole, roleLabels } from "./constants";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
  role: UserRole;
}

interface UsersTableProps {
  users: UserWithRole[];
  currentUserId: string;
  currentUserRole: UserRole;
}

const roleIcons: Record<UserRole, typeof User> = {
  super_admin: Crown,
  admin: ShieldCheck,
  manager: Briefcase,
  agent: Users,
  collaborator: Shield,
  viewer: Eye,
};

// Fallback para roles que no existen en roleLabels (compatibilidad con datos antiguos)
const defaultRoleInfo = {
  label: "Usuario",
  description: "Rol desconocido",
  color: "bg-gray-100 text-gray-800",
};

export function UsersTable({ users, currentUserId, currentUserRole }: UsersTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setLoading(userId);
    setError(null);
    setSuccess(null);

    const result = await updateUserRole(userId, newRole);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Rol actualizado");
      setTimeout(() => setSuccess(null), 2000);
    }

    setLoading(null);
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    setLoading(userId);
    setError(null);
    setOpenMenu(null);

    const result = await toggleUserActive(userId, !currentActive);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(currentActive ? "Usuario desactivado" : "Usuario activado");
      setTimeout(() => setSuccess(null), 2000);
    }

    setLoading(null);
  }

  async function handleSendMagicLink(email: string) {
    setLoading(email);
    setError(null);
    setOpenMenu(null);

    const result = await generateMagicLink(email);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess("Magic link enviado");
      setTimeout(() => setSuccess(null), 2000);
    }

    setLoading(null);
  }

  // Check if current user can edit another user's role
  function canEditUser(targetRole: UserRole): boolean {
    if (currentUserRole === "super_admin") return true;
    if (currentUserRole === "admin" && targetRole !== "super_admin" && targetRole !== "admin") return true;
    return false;
  }

  // Get available roles for dropdown based on current user's role
  function getAvailableRoles(): UserRole[] {
    if (currentUserRole === "super_admin") {
      return ["super_admin", "admin", "manager", "agent", "collaborator", "viewer"];
    }
    if (currentUserRole === "admin") {
      return ["manager", "agent", "collaborator", "viewer"];
    }
    return [];
  }

  return (
    <div>
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          {success}
        </div>
      )}

      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => {
          const safeRole = (user.role in roleLabels ? user.role : "viewer") as UserRole;
          const roleInfo = roleLabels[safeRole] || defaultRoleInfo;
          const RoleIcon = roleIcons[safeRole] || User;
          const isCurrentUser = user.id === currentUserId;
          const canEdit = canEditUser(safeRole) && !isCurrentUser;

          return (
            <div
              key={user.id}
              className={`bg-white rounded-lg border border-gray-200 p-4 ${!user.is_active ? "opacity-60" : ""} ${isCurrentUser ? "ring-2 ring-[#BB292A]/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${user.is_active ? "bg-[#87CEEB]" : "bg-gray-300"}`}>
                    <User className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">{user.full_name || "Sin nombre"}</h3>
                      {isCurrentUser && <span className="text-xs text-[#BB292A] font-medium">(Tú)</span>}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>

                {!isCurrentUser && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {openMenu === user.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                        <button
                          onClick={() => handleSendMagicLink(user.email)}
                          disabled={loading === user.email}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Mail className="w-4 h-4" />
                          Enviar magic link
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            disabled={loading === user.id}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 ${user.is_active ? "text-red-600" : "text-green-600"}`}
                          >
                            {user.is_active ? <><PowerOff className="w-4 h-4" /> Desactivar</> : <><Power className="w-4 h-4" /> Activar</>}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                {canEdit ? (
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={loading === user.id}
                    className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent disabled:opacity-50"
                  >
                    {getAvailableRoles().map((role) => (
                      <option key={role} value={role}>{roleLabels[role].label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                  {user.is_active ? <><Power className="w-3 h-3" /> Activo</> : <><PowerOff className="w-3 h-3" /> Inactivo</>}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Usuario
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Contacto
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Departamento
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Rol
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Estado
              </th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Registro
              </th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              // Usar fallback si el rol no existe en roleLabels (datos antiguos)
              const safeRole = (user.role in roleLabels ? user.role : "viewer") as UserRole;
              const roleInfo = roleLabels[safeRole] || defaultRoleInfo;
              const RoleIcon = roleIcons[safeRole] || User;
              const isCurrentUser = user.id === currentUserId;
              const canEdit = canEditUser(safeRole) && !isCurrentUser;

              return (
                <tr
                  key={user.id}
                  className={`${isCurrentUser ? "bg-blue-50/50" : ""} ${!user.is_active ? "opacity-60" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.is_active ? "bg-[#87CEEB]" : "bg-gray-300"}`}>
                        <User className="w-5 h-5 text-gray-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.full_name || "Sin nombre"}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-[#BB292A] font-medium">(Tú)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {user.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.department ? (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Building className="w-3.5 h-3.5 text-gray-400" />
                        {user.department.charAt(0).toUpperCase() + user.department.slice(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {canEdit ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={loading === user.id}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent disabled:opacity-50"
                      >
                        {getAvailableRoles().map((role) => (
                          <option key={role} value={role}>
                            {roleLabels[role].label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}
                      >
                        <RoleIcon className="w-3.5 h-3.5" />
                        {roleInfo.label}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.is_active ? (
                        <>
                          <Power className="w-3 h-3" />
                          Activo
                        </>
                      ) : (
                        <>
                          <PowerOff className="w-3 h-3" />
                          Inactivo
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString("es-ES")}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    {isCurrentUser ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <>
                        <button
                          onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>

                        {openMenu === user.id && (
                          <div className="absolute right-6 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                            <button
                              onClick={() => handleSendMagicLink(user.email)}
                              disabled={loading === user.email}
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              <Mail className="w-4 h-4" />
                              Enviar magic link
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleToggleActive(user.id, user.is_active)}
                                disabled={loading === user.id}
                                className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 ${
                                  user.is_active ? "text-red-600" : "text-green-600"
                                }`}
                              >
                                {user.is_active ? (
                                  <>
                                    <PowerOff className="w-4 h-4" />
                                    Desactivar usuario
                                  </>
                                ) : (
                                  <>
                                    <Power className="w-4 h-4" />
                                    Activar usuario
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {users.length === 0 && (
        <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
          No hay usuarios registrados
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenu(null)}
        />
      )}
    </div>
  );
}
