import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth/actions";
import { PageHeader } from "@/components/page-header";
import {
  getWhatsAppConfig,
  getWhatsAppTemplates,
  getWhatsAppMessages,
  getWhatsAppCampaigns,
  getWhatsAppStats,
} from "./actions";
import { WhatsAppClient } from "./whatsapp-client";

export default async function WhatsAppPage() {
  const adminUser = await isAdmin();

  if (!adminUser) {
    redirect("/dashboard");
  }

  const [config, templates, messagesData, campaigns, stats] = await Promise.all([
    getWhatsAppConfig(),
    getWhatsAppTemplates(),
    getWhatsAppMessages(50, 0),
    getWhatsAppCampaigns(),
    getWhatsAppStats(),
  ]);

  console.log("WhatsApp Page - messagesData:", messagesData.messages.length, "total:", messagesData.total);
  console.log("WhatsApp Page - stats:", stats);

  return (
    <div>
      <PageHeader
        title="WhatsApp Business"
        description="Envía mensajes masivos a tus clientes por WhatsApp"
      />

      <WhatsAppClient
        initialConfig={config}
        templates={templates}
        messages={messagesData.messages}
        campaigns={campaigns}
        stats={stats}
      />
    </div>
  );
}
