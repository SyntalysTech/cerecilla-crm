import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/actions";
import { PageHeader } from "@/components/page-header";
import { getScheduledCalls } from "./actions";
import { ScheduledCallsClient } from "./scheduled-calls-client";

export default async function AgendaPage() {
  const adminUser = await isAdmin();

  if (!adminUser) {
    redirect("/dashboard");
  }

  const scheduledCalls = await getScheduledCalls();

  return (
    <div>
      <PageHeader
        title="Agenda de Llamadas"
        description="Gestiona las solicitudes de llamada desde WhatsApp"
      />

      <ScheduledCallsClient initialCalls={scheduledCalls} />
    </div>
  );
}
