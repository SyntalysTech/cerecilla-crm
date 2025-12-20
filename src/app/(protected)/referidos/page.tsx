import { PageHeader } from "@/components/page-header";
import { getReferidos, getConfiguracionReferidos, getOperariosForSelect } from "./actions";
import { ReferidosList } from "./referidos-list";

export default async function ReferidosPage() {
  const [referidos, config, operarios] = await Promise.all([
    getReferidos(),
    getConfiguracionReferidos(),
    getOperariosForSelect(),
  ]);

  return (
    <div>
      <PageHeader
        title="Referidos"
        description="Gestiona los referidos y sus comisiones"
      />
      <ReferidosList
        referidos={referidos}
        config={config}
        operarios={operarios}
      />
    </div>
  );
}
