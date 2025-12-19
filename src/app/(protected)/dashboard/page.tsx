import { PageHeader } from "@/components/page-header";
import { LayoutDashboard, Mail, FileText, CheckCircle, XCircle, Clock, Users, HardHat } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DashboardCharts } from "./dashboard-charts";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get email stats
  const { count: totalEmails } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true });

  const { count: sentEmails } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("status", "sent");

  const { count: failedEmails } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed");

  const { count: deliveredEmails } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("status", "delivered");

  const { count: queuedEmails } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("status", "queued");

  // Get template count
  const { count: totalTemplates } = await supabase
    .from("email_templates")
    .select("*", { count: "exact", head: true });

  // Get clientes and operarios count
  const { count: clientesCount } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  const { count: operariosCount } = await supabase
    .from("operarios")
    .select("*", { count: "exact", head: true });

  // Get emails from last 7 days for chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentEmailsForChart } = await supabase
    .from("emails")
    .select("status, created_at")
    .gte("created_at", sevenDaysAgo.toISOString());

  // Process emails by day
  const emailsByDayMap: Record<string, { enviados: number; fallidos: number }> = {};
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
    days.push(dateStr);
    emailsByDayMap[dateStr] = { enviados: 0, fallidos: 0 };
  }

  recentEmailsForChart?.forEach((email) => {
    const date = new Date(email.created_at);
    const dateStr = date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
    if (emailsByDayMap[dateStr]) {
      if (email.status === "sent" || email.status === "delivered") {
        emailsByDayMap[dateStr].enviados++;
      } else if (email.status === "failed") {
        emailsByDayMap[dateStr].fallidos++;
      }
    }
  });

  const emailsByDay = days.map((date) => ({
    date,
    enviados: emailsByDayMap[date]?.enviados || 0,
    fallidos: emailsByDayMap[date]?.fallidos || 0,
  }));

  // Email status for pie chart
  const emailStatus = [
    { name: "Enviados", value: (sentEmails || 0) + (deliveredEmails || 0), color: "#22c55e" },
    { name: "Fallidos", value: failedEmails || 0, color: "#ef4444" },
    { name: "En cola", value: queuedEmails || 0, color: "#f59e0b" },
  ];

  // Get recent emails
  const { data: recentEmails } = await supabase
    .from("emails")
    .select("id, subject, status, to_addresses, sent_at, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    {
      name: "Emails enviados",
      value: sentEmails || 0,
      icon: Mail,
      description: `${totalEmails || 0} total`,
      color: "bg-[#87CEEB]/20",
      iconColor: "text-[#87CEEB]",
    },
    {
      name: "Plantillas",
      value: totalTemplates || 0,
      icon: FileText,
      description: "Plantillas activas",
      color: "bg-[#BB292A]/10",
      iconColor: "text-[#BB292A]",
    },
    {
      name: "Fallidos",
      value: failedEmails || 0,
      icon: XCircle,
      description: "Requieren atención",
      color: failedEmails && failedEmails > 0 ? "bg-red-100" : "bg-gray-100",
      iconColor: failedEmails && failedEmails > 0 ? "text-red-500" : "text-gray-400",
    },
  ];

  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    sending: { label: "Enviando", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
    sent: { label: "Enviado", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    failed: { label: "Error", icon: XCircle, color: "bg-red-100 text-red-800" },
    delivered: { label: "Entregado", icon: CheckCircle, color: "bg-green-100 text-green-800" },
    queued: { label: "En cola", icon: Clock, color: "bg-gray-100 text-gray-800" },
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Vista general de tu CRM"
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <h3 className="font-medium text-gray-900">{stat.name}</h3>
            </div>
            <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
          </div>
        ))}
        {/* Clientes card */}
        <Link href="/clientes" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#BB292A]/50 transition-colors cursor-pointer block">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#BB292A]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#BB292A]" />
            </div>
            <h3 className="font-medium text-gray-900">Clientes</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{clientesCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Registrados</p>
        </Link>
        {/* Operarios card */}
        <Link href="/operarios" className="bg-white rounded-lg border border-gray-200 p-6 hover:border-[#0ea5e9]/50 transition-colors cursor-pointer block">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#87CEEB]/20 flex items-center justify-center">
              <HardHat className="w-5 h-5 text-[#0ea5e9]" />
            </div>
            <h3 className="font-medium text-gray-900">Operarios</h3>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{operariosCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Registrados</p>
        </Link>
      </div>

      {/* Charts */}
      <DashboardCharts
        emailsByDay={emailsByDay}
        emailStatus={emailStatus}
        clientesCount={clientesCount || 0}
        operariosCount={operariosCount || 0}
      />

      {/* Recent emails */}
      {recentEmails && recentEmails.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Emails recientes</h2>
            <Link href="/emails" className="text-sm text-[#BB292A] hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentEmails.map((email) => {
              const status = statusConfig[email.status] || statusConfig.queued;
              const StatusIcon = status.icon;
              return (
                <div key={email.id} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{email.subject}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {email.to_addresses?.join(", ") || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">{status.label}</span>
                    </span>
                    <span className="text-xs text-gray-400 hidden md:block">
                      {email.sent_at
                        ? new Date(email.sent_at).toLocaleDateString("es-ES")
                        : new Date(email.created_at).toLocaleDateString("es-ES")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#BB292A]/10 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="w-6 h-6 text-[#BB292A]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Bienvenido a CerecillaCRM
              </h2>
              <p className="text-gray-600 mb-4">
                Este es tu centro de control para gestionar emails y comunicaciones.
                Empieza enviando tu primer email o creando una plantilla.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <Link
                  href="/emails/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Enviar email
                </Link>
                <Link
                  href="/email-templates/new"
                  className="text-sm font-medium text-[#BB292A] hover:underline"
                >
                  Crear plantilla →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions when there are emails */}
      {recentEmails && recentEmails.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/emails/new"
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#BB292A]/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#BB292A]/10 flex items-center justify-center group-hover:bg-[#BB292A]/20 transition-colors">
                <Mail className="w-5 h-5 text-[#BB292A]" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Nuevo email</h3>
                <p className="text-sm text-gray-500">Componer y enviar</p>
              </div>
            </div>
          </Link>
          <Link
            href="/email-templates/new"
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#BB292A]/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#87CEEB]/20 flex items-center justify-center group-hover:bg-[#87CEEB]/30 transition-colors">
                <FileText className="w-5 h-5 text-[#87CEEB]" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Nueva plantilla</h3>
                <p className="text-sm text-gray-500">Crear diseño reutilizable</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
