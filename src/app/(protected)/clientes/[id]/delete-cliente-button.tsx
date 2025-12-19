"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCliente } from "../actions";

interface DeleteClienteButtonProps {
  clienteId: string;
  clienteName: string;
}

export function DeleteClienteButton({ clienteId, clienteName }: DeleteClienteButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`¿Estás seguro de eliminar a "${clienteName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setLoading(true);
    const result = await deleteCliente(clienteId);

    if (result.error) {
      alert(`Error: ${result.error}`);
      setLoading(false);
    } else {
      router.push("/clientes");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      Eliminar
    </button>
  );
}
