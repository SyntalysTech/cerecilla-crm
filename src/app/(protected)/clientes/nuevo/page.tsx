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
    .select("id, nombre, alias, email, user_id")
    .order("alias", { ascending: true });

  // Get current user info and role
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user?.id)
    .single();

  const isOperario = userRole?.role === "operario";
  const isAdmin = userRole?.role === "admin" || userRole?.role === "super_admin" || userRole?.role === "manager";

  // If user is operario, get their operario alias
  let operarioAlias = "";
  if (isOperario && user) {
    const { data: operarioData } = await supabase
      .from("operarios")
      .select("alias, nombre")
      .eq("user_id", user.id)
      .single();
    operarioAlias = operarioData?.alias || operarioData?.nombre || "";
  }

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

      <NuevoClienteForm
        operarios={operarios || []}
        isOperario={isOperario}
        isAdmin={isAdmin}
        operarioAlias={operarioAlias}
      />
    </div>
  );
}
