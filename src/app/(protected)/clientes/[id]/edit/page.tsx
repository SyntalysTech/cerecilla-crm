import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { EditClienteForm } from "./edit-cliente-form";
import { ObservacionesChat } from "../observaciones-chat";
import { getObservaciones } from "../observaciones-actions";
import { ClienteDocumentos } from "../cliente-documentos";
import { getClienteDocumentos } from "../documentos-actions";
import { OperadoresSelector } from "../operadores-selector";
import { getClienteOperadores } from "../../actions";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string; todos?: string }>;
}

export default async function EditClientePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { nuevo, todos } = await searchParams;
  const isNuevoCliente = nuevo === "1";
  // If multiple clients were created, get all their IDs
  const allClienteIds = todos ? todos.split(",").filter(Boolean) : [id];
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

  // Get current user info
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user?.id)
    .single();
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user?.id)
    .single();

  const isAdmin = userRole?.role === "admin" || userRole?.role === "super_admin" || userRole?.role === "manager";
  const isOperario = userRole?.role === "operario";
  const currentUserEmail = profile?.email || user?.email || "";

  // Get observaciones, documentos, and assigned operadores
  const observaciones = await getObservaciones(id, isAdmin);
  const documentos = await getClienteDocumentos(id);
  const assignedOperadores = await getClienteOperadores(id);

  return (
    <div>
      {isNuevoCliente && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">
              {allClienteIds.length > 1
                ? `${allClienteIds.length} fichas de cliente creadas correctamente`
                : "Cliente creado correctamente"}
            </p>
            <p className="text-green-700 text-sm">
              {allClienteIds.length > 1
                ? "Los documentos que subas se añadirán automáticamente a todas las fichas creadas."
                : "Ahora puedes subir los documentos del cliente desde el panel de la derecha."}
            </p>
          </div>
        </div>
      )}

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
        title={isNuevoCliente ? `Nuevo: ${cliente.nombre_apellidos || cliente.razon_social || "Cliente"}` : `Editar: ${cliente.nombre_apellidos || cliente.razon_social || "Cliente"}`}
        description={isNuevoCliente ? "Sube los documentos del cliente" : (isOperario ? "Solo puedes añadir documentos y observaciones" : "Modifica los datos del cliente")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EditClienteForm cliente={cliente} operarios={operarios || []} isOperario={isOperario} isAdmin={isAdmin} />
        </div>

        <div className="space-y-6">
          <OperadoresSelector
            clienteId={id}
            allOperarios={operarios || []}
            assignedOperarios={assignedOperadores}
            createdByEmail={cliente.created_by_email}
          />

          <ClienteDocumentos
            clienteId={id}
            documentos={documentos}
            isAdmin={isAdmin}
            currentUserEmail={currentUserEmail}
            allClienteIds={allClienteIds}
          />

          <ObservacionesChat
            clienteId={id}
            observaciones={observaciones}
            isAdmin={isAdmin}
            currentUserEmail={currentUserEmail}
            variant="normal"
          />

          {isAdmin && (
            <ObservacionesChat
              clienteId={id}
              observaciones={observaciones}
              isAdmin={isAdmin}
              currentUserEmail={currentUserEmail}
              variant="admin"
            />
          )}
        </div>
      </div>
    </div>
  );
}
