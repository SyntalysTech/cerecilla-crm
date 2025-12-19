import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { ClienteDetails } from "./cliente-details";
import { DeleteClienteButton } from "./delete-cliente-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !cliente) {
    notFound();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a clientes
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/clientes/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </Link>
          <DeleteClienteButton clienteId={id} clienteName={cliente.nombre_apellidos || cliente.razon_social || "Cliente"} />
        </div>
      </div>

      <PageHeader
        title={cliente.nombre_apellidos || cliente.razon_social || "Cliente"}
        description={`${cliente.tipo_persona === "empresa" ? "Empresa" : "Persona física"} · ${cliente.email || "Sin email"}`}
      />

      <ClienteDetails cliente={cliente} />
    </div>
  );
}
