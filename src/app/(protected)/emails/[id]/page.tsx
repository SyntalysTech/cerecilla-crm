import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, Send, CheckCircle, XCircle, Clock, Mail, User, Calendar, FileText } from "lucide-react";
import { getEmailById } from "../actions";

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

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const email = await getEmailById(id);

  if (!email) {
    notFound();
  }

  const status = statusConfig[email.status as keyof typeof statusConfig] || statusConfig.sending;
  const StatusIcon = status.icon;

  return (
    <div>
      <PageHeader
        title="Detalle del Email"
        description="Ver contenido del email enviado"
      >
        <Link
          href="/emails"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </PageHeader>

      <div className="space-y-6">
        {/* Info card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#87CEEB]/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#87CEEB]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Asunto</p>
                  <p className="font-medium text-gray-900">{email.subject}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destinatarios</p>
                  <p className="font-medium text-gray-900">
                    {email.to_addresses?.join(", ") || "—"}
                  </p>
                  {email.cc_addresses?.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      CC: {email.cc_addresses.join(", ")}
                    </p>
                  )}
                  {email.bcc_addresses?.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      CCO: {email.bcc_addresses.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha de envío</p>
                  <p className="font-medium text-gray-900">
                    {email.sent_at
                      ? new Date(email.sent_at).toLocaleString("es-ES")
                      : new Date(email.created_at).toLocaleString("es-ES")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Send className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {status.label}
                  </span>
                  {email.error_message && (
                    <p className="text-sm text-red-600 mt-1">
                      Error: {email.error_message}
                    </p>
                  )}
                </div>
              </div>

              {email.provider_message_id && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID del mensaje</p>
                    <p className="font-mono text-sm text-gray-900 break-all">
                      {email.provider_message_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Contenido del Email</h2>
          </div>
          <div className="p-6">
            {email.html ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: email.html }}
              />
            ) : email.text ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {email.text}
              </pre>
            ) : (
              <p className="text-gray-500 italic">Sin contenido</p>
            )}
          </div>
        </div>

        {/* Text version if both exist */}
        {email.html && email.text && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Versión de texto plano</h2>
            </div>
            <div className="p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {email.text}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
