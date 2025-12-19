"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export function AddClienteButton() {
  return (
    <Link
      href="/clientes/nuevo"
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
    >
      <Plus className="w-4 h-4" />
      Añadir Cliente o Operador
    </Link>
  );
}
