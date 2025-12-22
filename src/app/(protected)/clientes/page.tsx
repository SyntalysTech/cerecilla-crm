import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { ClientesList } from "./clientes-list";
import { ImportButton } from "./import-button";
import { AddClienteButton } from "./add-cliente-button";
import { ExportButton } from "./export-button";

interface Cliente {
  id: string;
  operador: string | null;
  servicio: string | null;
  estado: string | null;
  tipo_persona: string | null;
  nombre_apellidos: string | null;
  razon_social: string | null;
  documento_nuevo_titular: string | null;
  documento_anterior_titular: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  cuenta_bancaria: string | null;
  cups_gas: string | null;
  cups_luz: string | null;
  compania_gas: string | null;
  compania_luz: string | null;
  potencia_gas: string | null;
  potencia_luz: string | null;
  facturado: boolean;
  cobrado: boolean;
  pagado: boolean;
  factura_pagos: string | null;
  factura_cobros: string | null;
  precio_kw_gas: string | null;
  precio_kw_luz: string | null;
  observaciones: string | null;
  observaciones_admin: string | null;
  created_at: string;
}

export default async function ClientesPage() {
  const supabase = await createClient();

  // Get total count first
  const { count } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  // Fetch all clientes in batches (Supabase limit is 1000 per query)
  let allClientes: Cliente[] = [];
  let error = null;
  const batchSize = 1000;
  const totalBatches = Math.ceil((count || 0) / batchSize);

  for (let i = 0; i < totalBatches; i++) {
    const { data, error: batchError } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(i * batchSize, (i + 1) * batchSize - 1);

    if (batchError) {
      error = batchError;
      break;
    }
    if (data) {
      allClientes = allClientes.concat(data as Cliente[]);
    }
  }

  const clientes = allClientes;

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${count || 0} clientes registrados`}
      >
        <div className="flex gap-2">
          <AddClienteButton />
          <ExportButton clientes={clientes || []} />
          <ImportButton type="clientes" />
        </div>
      </PageHeader>
      <ClientesList clientes={clientes || []} error={error?.message} />
    </div>
  );
}
