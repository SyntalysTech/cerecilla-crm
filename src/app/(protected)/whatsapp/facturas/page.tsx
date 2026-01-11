import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { ReceivedFilesClient } from "./received-files-client";

interface ReceivedFile {
  id: string;
  cliente_id: string | null;
  phone_number: string;
  sender_name: string | null;
  whatsapp_media_id: string;
  media_type: string;
  mime_type: string | null;
  ai_analysis: {
    tipo?: string;
    compania?: string;
    importe_total?: string;
    periodo?: string;
    consumo?: string;
    potencia_contratada?: string;
    tarifa?: string;
    nombre_titular?: string;
    direccion?: string;
    cups?: string;
    resumen?: string;
    puntos_ahorro?: string[];
  } | null;
  detected_tipo: string | null;
  detected_compania: string | null;
  detected_importe: string | null;
  detected_cups: string | null;
  status: string;
  created_at: string;
  analyzed_at: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  notes: string | null;
  cliente?: {
    id: string;
    nombre_apellidos: string | null;
    telefono: string | null;
  } | null;
}

export default async function FacturasRecibidasPage() {
  const supabase = await createClient();

  const { data: files, error } = await supabase
    .from("whatsapp_received_files")
    .select(`
      *,
      cliente:clientes(id, nombre_apellidos, telefono)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // Count pending files
  const { count: pendingCount } = await supabase
    .from("whatsapp_received_files")
    .select("*", { count: "exact", head: true })
    .eq("reviewed", false);

  return (
    <div>
      <PageHeader
        title="Facturas Recibidas"
        description={`${pendingCount || 0} facturas pendientes de revisar`}
      />
      <ReceivedFilesClient
        initialFiles={(files as ReceivedFile[]) || []}
        error={error?.message}
      />
    </div>
  );
}
