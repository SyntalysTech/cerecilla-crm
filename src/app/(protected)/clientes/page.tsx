import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { ClientesList } from "./clientes-list";
import { ImportButton } from "./import-button";

export default async function ClientesPage() {
  const supabase = await createClient();

  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const { count } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${count || 0} clientes registrados`}
      >
        <ImportButton type="clientes" />
      </PageHeader>
      <ClientesList clientes={clientes || []} error={error?.message} />
    </div>
  );
}
