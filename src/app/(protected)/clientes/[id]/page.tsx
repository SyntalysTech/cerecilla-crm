import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { ClienteDetails } from "./cliente-details";
import { DeleteClienteButton } from "./delete-cliente-button";
import { ObservacionesChat } from "./observaciones-chat";
import { getObservaciones } from "./observaciones-actions";
import { isAdmin, getUser } from "@/lib/auth/actions";

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

  // Get observaciones and user info
  const isAdminUser = await isAdmin();
  const currentUser = await getUser();
  const observaciones = await getObservaciones(id, isAdminUser);

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

      {/* Observaciones Chat - Two columns like old CRM */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ObservacionesChat
          clienteId={id}
          observaciones={observaciones}
          isAdmin={isAdminUser}
          currentUserEmail={currentUser?.email || ""}
          variant="normal"
        />
        {isAdminUser && (
          <ObservacionesChat
            clienteId={id}
            observaciones={observaciones}
            isAdmin={isAdminUser}
            currentUserEmail={currentUser?.email || ""}
            variant="admin"
          />
        )}
      </div>
    </div>
  );
}
