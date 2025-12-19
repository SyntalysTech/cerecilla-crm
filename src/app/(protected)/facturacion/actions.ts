"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface OperarioFacturable {
  id: string;
  alias: string | null;
  nombre: string | null;
  empresa: string | null;
  email: string | null;
  tipo: string | null;
  tiene_doc_autonomo: boolean;
  tiene_doc_escritura: boolean;
  tiene_doc_cif: boolean;
  tiene_doc_contrato: boolean;
  tiene_cuenta_bancaria: boolean;
  clientes_comisionables: number;
  total_comision: number;
  documentos_completos: boolean;
  documentos_faltantes: string[];
}

export interface FacturaLinea {
  id: string;
  operario_id: string;
  operario_alias: string | null;
  operario_nombre: string | null;
  operario_email: string | null;
  numero_factura: string;
  fecha_factura: string;
  total_comision: number;
  estado: string;
  documentos_completos: boolean;
  documentos_faltantes: string | null;
}

// Get operarios with comisionable clients
export async function getOperariosComisionables() {
  const supabase = await createClient();

  // Get all operarios
  const { data: operarios, error: opError } = await supabase
    .from("operarios")
    .select("*")
    .order("alias", { ascending: true });

  if (opError) {
    console.error("Error fetching operarios:", opError);
    return [];
  }

  // Get clients in "comisionable" state grouped by operador
  const { data: clientes, error: clError } = await supabase
    .from("clientes")
    .select("id, operador")
    .eq("estado", "Comisionable");

  if (clError) {
    console.error("Error fetching clientes:", clError);
    return [];
  }

  // Group clients by operador (alias)
  const clientesPorOperador: Record<string, number> = {};
  for (const cliente of clientes || []) {
    if (cliente.operador) {
      clientesPorOperador[cliente.operador] = (clientesPorOperador[cliente.operador] || 0) + 1;
    }
  }

  // Build result with document validation
  const result: OperarioFacturable[] = [];
  for (const op of operarios || []) {
    const count = clientesPorOperador[op.alias || ""] || 0;
    if (count === 0) continue;

    // Check required documents based on type
    const docsFaltantes: string[] = [];
    if (op.tipo === "Autonomo") {
      if (!op.tiene_cuenta_bancaria) docsFaltantes.push("Cuenta bancaria");
      if (!op.tiene_doc_autonomo) docsFaltantes.push("Doc. Autónomo");
      if (!op.tiene_doc_contrato) docsFaltantes.push("Doc. Contrato");
    } else if (op.tipo === "Empresa") {
      if (!op.tiene_cuenta_bancaria) docsFaltantes.push("Cuenta bancaria");
      if (!op.tiene_doc_cif) docsFaltantes.push("Doc. CIF");
      if (!op.tiene_doc_escritura) docsFaltantes.push("Doc. Escritura");
      if (!op.tiene_doc_contrato) docsFaltantes.push("Doc. Contrato");
    }

    result.push({
      id: op.id,
      alias: op.alias,
      nombre: op.nombre,
      empresa: op.empresa,
      email: op.email,
      tipo: op.tipo,
      tiene_doc_autonomo: op.tiene_doc_autonomo || false,
      tiene_doc_escritura: op.tiene_doc_escritura || false,
      tiene_doc_cif: op.tiene_doc_cif || false,
      tiene_doc_contrato: op.tiene_doc_contrato || false,
      tiene_cuenta_bancaria: op.tiene_cuenta_bancaria || false,
      clientes_comisionables: count,
      total_comision: 0, // TODO: Calculate based on commission rules
      documentos_completos: docsFaltantes.length === 0,
      documentos_faltantes: docsFaltantes,
    });
  }

  return result;
}

// Generate invoices for all comisionable operarios
export async function generarFacturas(fechaFactura: string) {
  const supabase = await createClient();

  // Get operarios with comisionable clients
  const operarios = await getOperariosComisionables();

  if (operarios.length === 0) {
    return { error: "No hay operarios con clientes comisionables" };
  }

  // Get last invoice number
  const { data: lastFactura } = await supabase
    .from("facturas_operarios")
    .select("numero_factura")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (lastFactura?.numero_factura) {
    const match = lastFactura.numero_factura.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const year = new Date(fechaFactura).getFullYear();
  const facturas: FacturaLinea[] = [];

  for (const op of operarios) {
    const numeroFactura = `FAC-${year}-${String(nextNumber).padStart(5, "0")}`;
    nextNumber++;

    const { data: factura, error } = await supabase
      .from("facturas_operarios")
      .insert({
        operario_id: op.id,
        numero_factura: numeroFactura,
        fecha_factura: fechaFactura,
        total_comision: op.total_comision,
        estado: "emitida",
        documentos_completos: op.documentos_completos,
        documentos_faltantes: op.documentos_faltantes.length > 0 ? op.documentos_faltantes.join(", ") : null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating factura:", error);
      continue;
    }

    // Link clients to invoice
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id")
      .eq("operador", op.alias)
      .eq("estado", "Comisionable");

    if (clientes && clientes.length > 0) {
      await supabase.from("factura_clientes").insert(
        clientes.map((c) => ({
          factura_id: factura.id,
          cliente_id: c.id,
          comision: 0,
        }))
      );
    }

    facturas.push({
      id: factura.id,
      operario_id: op.id,
      operario_alias: op.alias,
      operario_nombre: op.nombre || op.empresa,
      operario_email: op.email,
      numero_factura: factura.numero_factura,
      fecha_factura: factura.fecha_factura,
      total_comision: factura.total_comision,
      estado: factura.estado,
      documentos_completos: factura.documentos_completos,
      documentos_faltantes: factura.documentos_faltantes,
    });
  }

  revalidatePath("/facturacion");
  return { success: true, facturas };
}

// Get pending/emitted invoices
export async function getFacturasEmitidas() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("facturas_operarios")
    .select(`
      *,
      operarios (id, alias, nombre, empresa, email, tipo)
    `)
    .in("estado", ["emitida", "pendiente"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching facturas:", error);
    return [];
  }

  return (data || []).map((f) => ({
    id: f.id,
    operario_id: f.operario_id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operario_alias: (f.operarios as any)?.alias,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operario_nombre: (f.operarios as any)?.nombre || (f.operarios as any)?.empresa,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operario_email: (f.operarios as any)?.email,
    numero_factura: f.numero_factura,
    fecha_factura: f.fecha_factura,
    total_comision: f.total_comision,
    estado: f.estado,
    documentos_completos: f.documentos_completos,
    documentos_faltantes: f.documentos_faltantes,
  }));
}

// Update invoice number
export async function updateNumeroFactura(facturaId: string, nuevoNumero: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("facturas_operarios")
    .update({ numero_factura: nuevoNumero })
    .eq("id", facturaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/facturacion");
  return { success: true };
}

// Update invoice date
export async function updateFechaFactura(facturaId: string, nuevaFecha: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("facturas_operarios")
    .update({ fecha_factura: nuevaFecha })
    .eq("id", facturaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/facturacion");
  return { success: true };
}

// Send single invoice (mark as sent)
export async function enviarFactura(facturaId: string) {
  const supabase = await createClient();

  // Get factura with operario details
  const { data: factura } = await supabase
    .from("facturas_operarios")
    .select(`
      *,
      operarios (email, alias, nombre, empresa)
    `)
    .eq("id", facturaId)
    .single();

  if (!factura) {
    return { error: "Factura no encontrada" };
  }

  // TODO: Actually send email here

  // Update factura status
  const { error } = await supabase
    .from("facturas_operarios")
    .update({
      estado: "enviada",
      enviada_at: new Date().toISOString(),
    })
    .eq("id", facturaId);

  if (error) {
    return { error: error.message };
  }

  // Update associated clients: estado -> Liquidado, pagado -> true, factura_pagos -> numero_factura
  const { data: facturaClientes } = await supabase
    .from("factura_clientes")
    .select("cliente_id")
    .eq("factura_id", facturaId);

  if (facturaClientes && facturaClientes.length > 0) {
    const clienteIds = facturaClientes.map((fc) => fc.cliente_id);
    await supabase
      .from("clientes")
      .update({
        estado: "Liquidado",
        pagado: true,
        factura_pagos: factura.numero_factura,
      })
      .in("id", clienteIds);
  }

  revalidatePath("/facturacion");
  revalidatePath("/clientes");
  return { success: true };
}

// Send all invoices
export async function enviarTodasFacturas() {
  const supabase = await createClient();

  // Get all emitted invoices
  const { data: facturas } = await supabase
    .from("facturas_operarios")
    .select("id")
    .eq("estado", "emitida");

  if (!facturas || facturas.length === 0) {
    return { error: "No hay facturas emitidas para enviar" };
  }

  let enviadas = 0;
  const errores: string[] = [];

  for (const factura of facturas) {
    const result = await enviarFactura(factura.id);
    if (result.success) {
      enviadas++;
    } else if (result.error) {
      errores.push(result.error);
    }
  }

  revalidatePath("/facturacion");
  revalidatePath("/clientes");

  if (errores.length > 0) {
    return { success: true, enviadas, errores };
  }

  return { success: true, enviadas };
}

// Delete invoice
export async function deleteFactura(facturaId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("facturas_operarios")
    .delete()
    .eq("id", facturaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/facturacion");
  return { success: true };
}
