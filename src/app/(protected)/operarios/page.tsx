import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { OperariosList } from "./operarios-list";
import { ImportButton } from "../clientes/import-button";

interface Operario {
  id: string;
  email: string | null;
  alias: string | null;
  telefonos: string | null;
  tiene_doc_autonomo: boolean;
  tiene_doc_escritura: boolean;
  tiene_doc_cif: boolean;
  tiene_doc_contrato: boolean;
  tipo: string | null;
  nombre: string | null;
  documento: string | null;
  empresa: string | null;
  cif: string | null;
  cuenta_bancaria: string | null;
  direccion: string | null;
  created_at: string;
  ultima_carga?: string | null;
}

export default async function OperariosPage() {
  const supabase = await createClient();

  // Get total count first
  const { count } = await supabase
    .from("operarios")
    .select("*", { count: "exact", head: true });

  // Fetch all operarios in batches (Supabase limit is 1000 per query)
  let allOperarios: Operario[] = [];
  let error = null;
  const batchSize = 1000;
  const totalBatches = Math.ceil((count || 0) / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const { data, error: batchError } = await supabase
      .from("operarios")
      .select("*")
      .order("alias", { ascending: true })
      .range(i * batchSize, (i + 1) * batchSize - 1);

    if (batchError) {
      error = batchError;
      break;
    }
    if (data) {
      allOperarios = allOperarios.concat(data as Operario[]);
    }
  }

  // Get last client upload date for each operario
  const { data: ultimasCargas } = await supabase
    .from("clientes")
    .select("operador, created_at")
    .not("operador", "is", null)
    .order("created_at", { ascending: false });

  // Create a map of operador -> ultima_carga
  const ultimaCargaMap: Record<string, string> = {};
  if (ultimasCargas) {
    for (const cliente of ultimasCargas) {
      if (cliente.operador && !ultimaCargaMap[cliente.operador]) {
        ultimaCargaMap[cliente.operador] = cliente.created_at;
      }
    }
  }

  // Add ultima_carga to each operario
  const operarios = allOperarios.map(op => ({
    ...op,
    ultima_carga: op.nombre ? ultimaCargaMap[op.nombre] || null : null,
  }));

  return (
    <div>
      <PageHeader
        title="Operarios"
        description={`${count || 0} operarios registrados`}
      >
        <ImportButton type="operarios" />
      </PageHeader>
      <OperariosList operarios={operarios || []} error={error?.message} />
    </div>
  );
}
