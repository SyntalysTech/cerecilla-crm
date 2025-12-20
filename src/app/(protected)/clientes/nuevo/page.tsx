import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NuevoClienteForm } from "./nuevo-cliente-form";

export default async function NuevoClientePage() {
  const supabase = await createClient();

  // Get operarios for dropdown
  const { data: operarios } = await supabase
    .from("operarios")
    .select("id, nombre, alias")
    .order("alias", { ascending: true });

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a clientes
        </Link>
      </div>

      <PageHeader
        title="Añadir Cliente"
        description="Crear un nuevo cliente en el sistema"
      />

      <NuevoClienteForm operarios={operarios || []} />
    </div>
  );
}
