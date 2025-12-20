export type UserRole = "super_admin" | "admin" | "manager" | "agent" | "collaborator" | "viewer" | "operario";

export const roleLabels: Record<UserRole, { label: string; description: string; color: string }> = {
  super_admin: {
    label: "Super Admin",
    description: "Control total del sistema",
    color: "bg-red-100 text-red-800",
  },
  admin: {
    label: "Administrador",
    description: "Gestiona usuarios y configuración",
    color: "bg-purple-100 text-purple-800",
  },
  manager: {
    label: "Gestor",
    description: "Supervisa agentes y equipos",
    color: "bg-blue-100 text-blue-800",
  },
  agent: {
    label: "Agente",
    description: "Gestiona clientes y ventas",
    color: "bg-green-100 text-green-800",
  },
  collaborator: {
    label: "Colaborador",
    description: "Partner externo (inmobiliarias)",
    color: "bg-yellow-100 text-yellow-800",
  },
  viewer: {
    label: "Visor",
    description: "Solo lectura",
    color: "bg-gray-100 text-gray-800",
  },
  operario: {
    label: "Operario",
    description: "Acceso limitado a sus clientes",
    color: "bg-orange-100 text-orange-800",
  },
};
