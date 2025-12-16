import { PageHeader } from "@/components/page-header";
import { LayoutDashboard, Mail, FileText, TrendingUp } from "lucide-react";

const stats = [
  {
    name: "Emails enviados",
    value: "—",
    icon: Mail,
    description: "Coming soon",
  },
  {
    name: "Plantillas activas",
    value: "—",
    icon: FileText,
    description: "Coming soon",
  },
  {
    name: "Tasa de apertura",
    value: "—",
    icon: TrendingUp,
    description: "Coming soon",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vista general de tu CRM"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#87CEEB]/20 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-[#87CEEB]" />
              </div>
              <h3 className="font-medium text-gray-900">{stat.name}</h3>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Welcome card */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#BB292A]/10 flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-6 h-6 text-[#BB292A]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Bienvenido a CerecillaCRM
            </h2>
            <p className="text-gray-600 mb-4">
              Este es tu centro de control para gestionar emails y comunicaciones.
              Las métricas y estadísticas aparecerán aquí cuando empieces a enviar emails.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="/emails"
                className="text-sm font-medium text-[#BB292A] hover:underline"
              >
                Ver emails →
              </a>
              <a
                href="/email-templates"
                className="text-sm font-medium text-[#BB292A] hover:underline"
              >
                Gestionar plantillas →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
