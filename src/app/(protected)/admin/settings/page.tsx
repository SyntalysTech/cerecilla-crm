import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/actions";
import { PageHeader } from "@/components/page-header";
import { Mail, Database, Bell, Shield } from "lucide-react";

export default async function AdminSettingsPage() {
  const isAdminUser = await isAdmin();

  if (!isAdminUser) {
    redirect("/dashboard");
  }

  const settings = [
    {
      title: "Email (Amazon SES)",
      description: "Configuración del servicio de envío de emails",
      icon: Mail,
      status: "No configurado",
      statusColor: "text-amber-600 bg-amber-50",
      items: [
        { label: "AWS Region", value: process.env.AWS_REGION || "No configurado" },
        { label: "From Address", value: process.env.SES_FROM_ADDRESS || "No configurado" },
        { label: "Estado", value: "Pendiente de configuración" },
      ],
    },
    {
      title: "Base de datos",
      description: "Conexión con Supabase",
      icon: Database,
      status: "Conectado",
      statusColor: "text-green-600 bg-green-50",
      items: [
        { label: "URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configurado" : "No configurado" },
        { label: "Estado", value: "Activo" },
      ],
    },
    {
      title: "Notificaciones",
      description: "Configuración de alertas y notificaciones",
      icon: Bell,
      status: "Próximamente",
      statusColor: "text-gray-500 bg-gray-100",
      items: [
        { label: "Email notifications", value: "Próximamente" },
        { label: "Push notifications", value: "Próximamente" },
      ],
    },
    {
      title: "Seguridad",
      description: "Configuración de seguridad y acceso",
      icon: Shield,
      status: "Activo",
      statusColor: "text-green-600 bg-green-50",
      items: [
        { label: "RLS (Row Level Security)", value: "Activado" },
        { label: "Autenticación", value: "Supabase Auth" },
      ],
    },
  ];

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Ajustes generales del sistema"
      />

      <div className="grid gap-6">
        {settings.map((setting) => (
          <div
            key={setting.title}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <setting.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{setting.title}</h3>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${setting.statusColor}`}
                >
                  {setting.status}
                </span>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {setting.items.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
