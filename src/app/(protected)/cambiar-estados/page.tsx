import { PageHeader } from "@/components/page-header";
import { CambiarEstadosClient } from "./cambiar-estados-client";
import { getEstadosConCantidad, getEstadosDisponibles } from "./actions";

export default async function CambiarEstadosPage() {
  const estadosActuales = await getEstadosConCantidad();
  const estadosDisponibles = await getEstadosDisponibles();

  return (
    <div>
      <PageHeader
        title="Cambiar Estados Masivo"
        description="Cambia el estado de todos los clientes de un estado a otro"
      />

      <CambiarEstadosClient
        estadosActuales={estadosActuales}
        estadosDisponibles={estadosDisponibles}
      />
    </div>
  );
}
