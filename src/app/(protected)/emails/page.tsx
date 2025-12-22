import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Mail, Plus, CheckCircle, XCircle, Clock, Send, Eye } from "lucide-react";
import { getEmails } from "./actions";

const statusConfig = {
  sending: {
    label: "Enviando",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  sent: {
    label: "Enviado",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  failed: {
    label: "Error",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
  },
  delivered: {
    label: "Entregado",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  bounced: {
    label: "Rebotado",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
  },
};

export default async function EmailsPage() {
  const emails = await getEmails();

  return (
    <div>
      <PageHeader
        title="Emails"
        description="Historial de emails enviados"
      >
        <Link
          href="/emails/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo email
        </Link>
      </PageHeader>

      {emails.length > 0 ? (
        <>
          {/* Mobile view - Cards */}
          <div className="md:hidden space-y-3">
            {emails.map((email) => {
              const status = statusConfig[email.status as keyof typeof statusConfig] || statusConfig.sending;
              const StatusIcon = status.icon;

              return (
                <Link
                  key={email.id}
                  href={`/emails/${email.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#87CEEB]/20 flex items-center justify-center flex-shrink-0">
                      <Send className="w-5 h-5 text-[#87CEEB]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{email.subject}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        Para: {email.to_addresses?.join(", ") || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {email.sent_at
                        ? new Date(email.sent_at).toLocaleString("es-ES")
                        : new Date(email.created_at).toLocaleString("es-ES")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop view - Table */}
          <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Asunto
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Destinatarios
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Estado
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Fecha envío
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    ID Mensaje
                  </th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {emails.map((email) => {
                  const status = statusConfig[email.status as keyof typeof statusConfig] || statusConfig.sending;
                  const StatusIcon = status.icon;

                  return (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#87CEEB]/20 flex items-center justify-center">
                            <Send className="w-4 h-4 text-[#87CEEB]" />
                          </div>
                          <span className="font-medium text-gray-900">{email.subject}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {email.to_addresses?.slice(0, 2).join(", ") || "—"}
                        {email.to_addresses?.length > 2 && ` +${email.to_addresses.length - 2}`}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {email.sent_at
                          ? new Date(email.sent_at).toLocaleString("es-ES")
                          : new Date(email.created_at).toLocaleString("es-ES")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {email.provider_message_id
                          ? email.provider_message_id.substring(0, 20) + "..."
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/emails/${email.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#BB292A] bg-[#BB292A]/10 rounded-md hover:bg-[#BB292A]/20 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <EmptyState
            icon={Mail}
            title="No hay emails"
            description="Cuando envíes emails desde el CRM, aparecerán aquí con su estado y detalles."
            action={{
              label: "Enviar primer email",
              href: "/emails/new",
            }}
          />
        </div>
      )}
    </div>
  );
}
