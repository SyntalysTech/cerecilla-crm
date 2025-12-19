import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { OperariosList } from "./operarios-list";
import { ImportButton } from "../clientes/import-button";

export default async function OperariosPage() {
  const supabase = await createClient();

  const { data: operarios, error } = await supabase
    .from("operarios")
    .select("*")
    .order("alias", { ascending: true });

  const { count } = await supabase
    .from("operarios")
    .select("*", { count: "exact", head: true });

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
