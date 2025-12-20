"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export function AddClienteButton() {
  return (
    <Link
      href="/clientes/nuevo"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] transition-colors font-medium"
    >
      <Plus className="w-4 h-4" />
      Añadir Cliente
    </Link>
  );
}
