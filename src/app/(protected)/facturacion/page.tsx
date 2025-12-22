import { PageHeader } from "@/components/page-header";
import { FacturacionClient } from "./facturacion-client";
import {
  getOperariosComisionables,
  getFacturasEmitidas,
  getClientesFacturables,
  getFacturasClientes,
  getEmpresaConfig,
} from "./actions";

export default async function FacturacionPage() {
  const operariosComisionables = await getOperariosComisionables();
  const facturasEmitidas = await getFacturasEmitidas();
  const clientesFacturables = await getClientesFacturables();
  const facturasClientes = await getFacturasClientes();
  const empresaConfig = await getEmpresaConfig();

  return (
    <div>
      <PageHeader
        title="Facturación"
        description="Genera comisiones para operarios por clientes comisionables"
      />

      <FacturacionClient
        operariosComisionables={operariosComisionables}
        facturasEmitidas={facturasEmitidas}
        clientesFacturables={clientesFacturables}
        facturasClientes={facturasClientes}
        empresaConfig={empresaConfig}
      />
    </div>
  );
}
