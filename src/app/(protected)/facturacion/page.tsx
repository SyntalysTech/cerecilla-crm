import { PageHeader } from "@/components/page-header";
import { FacturacionClient } from "./facturacion-client";
import { getOperariosComisionables, getFacturasEmitidas } from "./actions";

export default async function FacturacionPage() {
  const operariosComisionables = await getOperariosComisionables();
  const facturasEmitidas = await getFacturasEmitidas();

  return (
    <div>
      <PageHeader
        title="Facturación de Operarios"
        description="Genera y envía facturas a los operarios con clientes en estado comisionable"
      />

      <FacturacionClient
        operariosComisionables={operariosComisionables}
        facturasEmitidas={facturasEmitidas}
      />
    </div>
  );
}
