import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Mail } from "lucide-react";

export default function EmailsPage() {
  return (
    <div>
      <PageHeader
        title="Emails"
        description="Historial de emails enviados"
      />

      {/* Table container */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="border-b border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Subject
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Sent At
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Provider Message ID
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Empty state */}
        <EmptyState
          icon={Mail}
          title="No emails yet"
          description="Cuando envíes emails desde el CRM, aparecerán aquí con su estado y detalles."
        />
      </div>
    </div>
  );
}
