import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EditClienteForm } from "./edit-cliente-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClientePage({ params }: Props) {
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

  // Get operarios for dropdown
  const { data: operarios } = await supabase
    .from("operarios")
    .select("id, nombre")
    .order("nombre", { ascending: true });

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/clientes/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a ficha
        </Link>
      </div>

      <PageHeader
        title={`Editar: ${cliente.nombre_apellidos || cliente.razon_social || "Cliente"}`}
        description="Modifica los datos del cliente"
      />

      <EditClienteForm cliente={cliente} operarios={operarios || []} />
    </div>
  );
}
