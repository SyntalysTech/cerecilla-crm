import { PageHeader } from "@/components/page-header";
import { ChatInterface } from "./chat-interface";

export default function CerecIAPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)]">
      <PageHeader
        title="CerecIA Chat"
        description="Tu asistente virtual inteligente"
      />
      <ChatInterface />
    </div>
  );
}
