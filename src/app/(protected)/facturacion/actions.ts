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
  irpf: number; // Porcentaje de IRPF (15% por defecto)
}

// Helper function to calculate commission for a single client
function calculateClienteComision(
  servicio: string | null,
  comisionesPersonalizadas: Record<string, number>,
  comisionesDefecto: Record<string, number>
): number {
  if (!servicio) return 0;

  const servicios = servicio.split(", ").filter(Boolean);
  let total = 0;

  for (const s of servicios) {
    // Use custom commission if available, otherwise use default
    const comision = comisionesPersonalizadas[s] ?? comisionesDefecto[s] ?? 0;
    total += comision;
  }

  return total;
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

  // Get clients in "comisionable" state with their services (case insensitive)
  const { data: clientes, error: clError } = await supabase
    .from("clientes")
    .select("id, operador, servicio")
    .ilike("estado", "COMISIONABLE");

  if (clError) {
    console.error("Error fetching clientes:", clError);
    return [];
  }

  // Get all custom commissions
  const { data: todasComisiones } = await supabase
    .from("operario_comisiones")
    .select("operario_id, servicio, comision");

  // Get default commissions
  const { data: comisionesDefectoData } = await supabase
    .from("configuracion_comisiones")
    .select("servicio, comision_defecto");

  // Build default commissions map
  const comisionesDefecto: Record<string, number> = {
    Luz: 25,
    Gas: 25,
    Telefonía: 50,
    Seguros: 25,
    Alarmas: 50,
  };
  for (const row of comisionesDefectoData || []) {
    comisionesDefecto[row.servicio] = row.comision_defecto;
  }

  // Build custom commissions map per operario
  const comisionesPorOperario: Record<string, Record<string, number>> = {};
  for (const c of todasComisiones || []) {
    if (!comisionesPorOperario[c.operario_id]) {
      comisionesPorOperario[c.operario_id] = {};
    }
    comisionesPorOperario[c.operario_id][c.servicio] = c.comision;
  }

  // Group clients by operador (alias) and calculate commissions
  const clientesPorOperador: Record<string, { count: number; clientes: { servicio: string | null }[] }> = {};
  for (const cliente of clientes || []) {
    if (cliente.operador) {
      if (!clientesPorOperador[cliente.operador]) {
        clientesPorOperador[cliente.operador] = { count: 0, clientes: [] };
      }
      clientesPorOperador[cliente.operador].count++;
      clientesPorOperador[cliente.operador].clientes.push({ servicio: cliente.servicio });
    }
  }

  // Build result with document validation
  const result: OperarioFacturable[] = [];
  for (const op of operarios || []) {
    const operadorData = clientesPorOperador[op.alias || ""] || clientesPorOperador[op.nombre || ""];
    if (!operadorData || operadorData.count === 0) continue;

    // Get custom commissions for this operario
    const comisionesPersonalizadas = comisionesPorOperario[op.id] || {};

    // Calculate total commission for all clients
    let totalComision = 0;
    for (const cliente of operadorData.clientes) {
      totalComision += calculateClienteComision(cliente.servicio, comisionesPersonalizadas, comisionesDefecto);
    }

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
      clientes_comisionables: operadorData.count,
      total_comision: totalComision,
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

  // Get all custom commissions
  const { data: todasComisiones } = await supabase
    .from("operario_comisiones")
    .select("operario_id, servicio, comision");

  // Get default commissions
  const { data: comisionesDefectoData } = await supabase
    .from("configuracion_comisiones")
    .select("servicio, comision_defecto");

  // Build default commissions map
  const comisionesDefecto: Record<string, number> = {
    Luz: 25,
    Gas: 25,
    Telefonía: 50,
    Seguros: 25,
    Alarmas: 50,
  };
  for (const row of comisionesDefectoData || []) {
    comisionesDefecto[row.servicio] = row.comision_defecto;
  }

  // Build custom commissions map per operario
  const comisionesPorOperario: Record<string, Record<string, number>> = {};
  for (const c of todasComisiones || []) {
    if (!comisionesPorOperario[c.operario_id]) {
      comisionesPorOperario[c.operario_id] = {};
    }
    comisionesPorOperario[c.operario_id][c.servicio] = c.comision;
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
    // New format: FAC-00001-2026 (number-year)
    // Old format: FAC-2026-00001 (year-number)
    const newFormatMatch = lastFactura.numero_factura.match(/FAC-(\d{5})-\d{4}/);
    const oldFormatMatch = lastFactura.numero_factura.match(/FAC-\d{4}-(\d{5})/);
    const match = newFormatMatch || oldFormatMatch;
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const year = new Date(fechaFactura).getFullYear();
  const facturas: FacturaLinea[] = [];

  for (const op of operarios) {
    const numeroFactura = `FAC-${String(nextNumber).padStart(5, "0")}-${year}`;
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
        irpf: 15, // IRPF 15% por defecto
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating factura:", error);
      continue;
    }

    // Link clients to invoice with individual commission calculation
    // Search by alias OR nombre (case insensitive)
    const { data: clientes } = await supabase
      .from("clientes")
      .select("id, servicio")
      .or(`operador.eq.${op.alias},operador.eq.${op.nombre}`)
      .ilike("estado", "COMISIONABLE");

    // Get custom commissions for this operario
    const comisionesPersonalizadas = comisionesPorOperario[op.id] || {};

    if (clientes && clientes.length > 0) {
      await supabase.from("factura_clientes").insert(
        clientes.map((c) => ({
          factura_id: factura.id,
          cliente_id: c.id,
          comision: calculateClienteComision(c.servicio, comisionesPersonalizadas, comisionesDefecto),
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
      irpf: factura.irpf ?? 15,
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
    irpf: f.irpf ?? 15, // IRPF 15% por defecto para facturas antiguas
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

// Update invoice IRPF
export async function updateIrpfFactura(facturaId: string, irpf: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("facturas_operarios")
    .update({ irpf })
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

// ==================== FACTURACIÓN DE CLIENTES ====================

export interface ClienteFacturable {
  id: string;
  nombre: string;
  nif: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo_via: string | null;
  nombre_via: string | null;
  numero: string | null;
  escalera: string | null;
  piso: string | null;
  puerta: string | null;
  codigo_postal: string | null;
  poblacion: string | null;
  provincia: string | null;
  servicio: string | null;
  estado: string | null;
  facturado: boolean;
  factura_cobros: string | null;
}

export interface FacturaClienteLinea {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_email: string | null;
  numero_factura: string;
  fecha_factura: string;
  concepto: string;
  importe: number;
  iva: number;
  total: number;
  estado: string;
  iban_usado: string | null;
  created_at: string;
}

// Configuración de la empresa para las facturas
export async function getEmpresaConfig() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("configuracion_empresa")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    // Valores por defecto si no existe configuración
    return {
      nombre: "CERECILLA ENERGÍA S.L.",
      cif: "B12345678",
      direccion: "Calle Principal, 1",
      poblacion: "Madrid",
      provincia: "Madrid",
      codigoPostal: "28001",
      telefono: "",
      email: "",
      cuentaBancaria: "",
      cuentaBancaria2: "",
      ibanNombre: "",
      iban2Nombre: "",
    };
  }

  return {
    nombre: data.nombre || "CERECILLA ENERGÍA S.L.",
    cif: data.cif || "B12345678",
    direccion: data.direccion || "",
    poblacion: data.poblacion || "",
    provincia: data.provincia || "",
    codigoPostal: data.codigo_postal || "",
    telefono: data.telefono || "",
    email: data.email || "",
    cuentaBancaria: data.iban || "",
    cuentaBancaria2: data.iban2 || "",
    ibanNombre: data.iban_nombre || "",
    iban2Nombre: data.iban2_nombre || "",
  };
}

// Actualizar configuración de la empresa
export async function updateEmpresaConfig(config: {
  nombre: string;
  cif: string;
  direccion: string;
  poblacion: string;
  provincia: string;
  codigoPostal: string;
  telefono?: string;
  email?: string;
  cuentaBancaria?: string;
  cuentaBancaria2?: string;
  ibanNombre?: string;
  iban2Nombre?: string;
}) {
  const supabase = await createClient();

  // Verificar si existe configuración
  const { data: existing } = await supabase
    .from("configuracion_empresa")
    .select("id")
    .limit(1)
    .single();

  if (existing) {
    // Actualizar
    const { error } = await supabase
      .from("configuracion_empresa")
      .update({
        nombre: config.nombre,
        cif: config.cif,
        direccion: config.direccion,
        poblacion: config.poblacion,
        provincia: config.provincia,
        codigo_postal: config.codigoPostal,
        telefono: config.telefono || null,
        email: config.email || null,
        iban: config.cuentaBancaria || null,
        iban2: config.cuentaBancaria2 || null,
        iban_nombre: config.ibanNombre || null,
        iban2_nombre: config.iban2Nombre || null,
      })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Insertar
    const { error } = await supabase.from("configuracion_empresa").insert({
      nombre: config.nombre,
      cif: config.cif,
      direccion: config.direccion,
      poblacion: config.poblacion,
      provincia: config.provincia,
      codigo_postal: config.codigoPostal,
      telefono: config.telefono || null,
      email: config.email || null,
      iban: config.cuentaBancaria || null,
      iban2: config.cuentaBancaria2 || null,
      iban_nombre: config.ibanNombre || null,
      iban2_nombre: config.iban2Nombre || null,
    });

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/facturacion");
  return { success: true };
}

// Obtener clientes facturables (COMISIONABLE o FINALIZADO no facturados)
export async function getClientesFacturables() {
  const supabase = await createClient();

  // Use or with ilike for case-insensitive estado matching
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .or("estado.ilike.COMISIONABLE,estado.ilike.FINALIZADO")
    .or("facturado.is.null,facturado.eq.false")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clientes facturables:", error);
    return [];
  }

  return (data || []).map((c) => ({
    id: c.id,
    nombre: c.nombre_apellidos || c.razon_social || "Sin nombre",
    nif: c.documento_nuevo_titular || c.cif_empresa || null,
    email: c.email,
    telefono: c.telefono,
    direccion: c.direccion,
    tipo_via: c.tipo_via,
    nombre_via: c.nombre_via,
    numero: c.numero,
    escalera: c.escalera,
    piso: c.piso,
    puerta: c.puerta,
    codigo_postal: c.codigo_postal,
    poblacion: c.poblacion,
    provincia: c.provincia,
    servicio: c.servicio,
    estado: c.estado,
    facturado: c.facturado || false,
    factura_cobros: c.factura_cobros,
  })) as ClienteFacturable[];
}

// Obtener facturas de clientes emitidas
export async function getFacturasClientes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("facturas_clientes")
    .select(`
      *,
      clientes (id, nombre_apellidos, razon_social, email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching facturas clientes:", error);
    return [];
  }

  return (data || []).map((f) => ({
    id: f.id,
    cliente_id: f.cliente_id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cliente_nombre: (f.clientes as any)?.nombre_apellidos || (f.clientes as any)?.razon_social || "Sin nombre",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cliente_email: (f.clientes as any)?.email,
    numero_factura: f.numero_factura,
    fecha_factura: f.fecha_factura,
    concepto: f.concepto,
    importe: f.importe || 0,
    iva: f.iva || 21,
    total: f.total || 0,
    estado: f.estado,
    iban_usado: f.iban_usado || null,
    created_at: f.created_at,
  })) as FacturaClienteLinea[];
}

// Generar factura para un cliente
export async function generarFacturaCliente(
  clienteId: string,
  datos: {
    concepto: string;
    importe: number;
    iva: number;
    fechaFactura: string;
    ibanUsado?: string;
  }
) {
  const supabase = await createClient();

  // Obtener último número de factura
  const { data: lastFactura } = await supabase
    .from("facturas_clientes")
    .select("numero_factura")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (lastFactura?.numero_factura) {
    // New format: FC-00001-2026 (number-year)
    // Old format: FC-2026-00001 (year-number)
    const newFormatMatch = lastFactura.numero_factura.match(/FC-(\d{5})-\d{4}/);
    const oldFormatMatch = lastFactura.numero_factura.match(/FC-\d{4}-(\d{5})/);
    const match = newFormatMatch || oldFormatMatch;
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const year = new Date(datos.fechaFactura).getFullYear();
  const numeroFactura = `FC-${String(nextNumber).padStart(5, "0")}-${year}`;

  const total = datos.importe * (1 + datos.iva / 100);

  const { data: factura, error } = await supabase
    .from("facturas_clientes")
    .insert({
      cliente_id: clienteId,
      numero_factura: numeroFactura,
      fecha_factura: datos.fechaFactura,
      concepto: datos.concepto,
      importe: datos.importe,
      iva: datos.iva,
      total: total,
      estado: "emitida",
      iban_usado: datos.ibanUsado || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating factura cliente:", error);
    return { error: error.message };
  }

  // Marcar cliente como facturado
  await supabase
    .from("clientes")
    .update({
      facturado: true,
      factura_cobros: numeroFactura,
    })
    .eq("id", clienteId);

  revalidatePath("/facturacion");
  revalidatePath("/clientes");
  return { success: true, factura };
}

// Obtener datos completos de un cliente para la factura
export async function getClienteParaFactura(clienteId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .single();

  if (error || !data) {
    return null;
  }

  // Construir dirección formateada
  let direccion = "";
  if (data.tipo_via && data.nombre_via) {
    direccion = `${data.tipo_via} ${data.nombre_via}`;
    if (data.numero) direccion += `, ${data.numero}`;
    if (data.escalera) direccion += `, Esc. ${data.escalera}`;
    if (data.piso) direccion += `, ${data.piso}º`;
    if (data.puerta) direccion += ` ${data.puerta}`;
  } else if (data.direccion) {
    direccion = data.direccion;
  }

  return {
    id: data.id,
    nombre: data.nombre_apellidos || data.razon_social || "Sin nombre",
    nif: data.documento_nuevo_titular || data.cif_empresa || null,
    email: data.email,
    telefono: data.telefono,
    direccion,
    poblacion: data.poblacion,
    provincia: data.provincia,
    codigoPostal: data.codigo_postal,
    servicio: data.servicio,
  };
}

// Eliminar factura de cliente
export async function deleteFacturaCliente(facturaId: string) {
  const supabase = await createClient();

  // Obtener la factura para saber el cliente
  const { data: factura } = await supabase
    .from("facturas_clientes")
    .select("cliente_id")
    .eq("id", facturaId)
    .single();

  const { error } = await supabase
    .from("facturas_clientes")
    .delete()
    .eq("id", facturaId);

  if (error) {
    return { error: error.message };
  }

  // Desmarcar el cliente como facturado
  if (factura?.cliente_id) {
    await supabase
      .from("clientes")
      .update({
        facturado: false,
        factura_cobros: null,
      })
      .eq("id", factura.cliente_id);
  }

  revalidatePath("/facturacion");
  revalidatePath("/clientes");
  return { success: true };
}

// Marcar factura como cobrada
export async function marcarFacturaCobrada(facturaId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("facturas_clientes")
    .update({
      estado: "cobrada",
      cobrada_at: new Date().toISOString(),
    })
    .eq("id", facturaId);

  if (error) {
    return { error: error.message };
  }

  // Actualizar el cliente
  const { data: factura } = await supabase
    .from("facturas_clientes")
    .select("cliente_id")
    .eq("id", facturaId)
    .single();

  if (factura?.cliente_id) {
    await supabase
      .from("clientes")
      .update({ cobrado: true })
      .eq("id", factura.cliente_id);
  }

  revalidatePath("/facturacion");
  revalidatePath("/clientes");
  return { success: true };
}

// Obtener datos del operario para generar factura/comisión PDF
export async function getOperarioParaFactura(operarioId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("operarios")
    .select("*")
    .eq("id", operarioId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    nombre: data.nombre || data.alias || "Sin nombre",
    alias: data.alias,
    empresa: data.empresa,
    nif: data.nif || data.cif || null,
    email: data.email,
    telefono: data.telefono,
    direccion: data.direccion,
    poblacion: data.poblacion,
    provincia: data.provincia,
    codigoPostal: data.codigo_postal,
    cuentaBancaria: data.cuenta_bancaria,
  };
}

// Helper para anonimizar nombre (protección de datos)
// Ej: "Juan García López" → "J. García L."
function anonimizarNombre(nombreCompleto: string): string {
  if (!nombreCompleto) return "Cliente";

  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 0) return "Cliente";

  if (partes.length === 1) {
    // Solo un nombre/palabra: mostrar inicial + primeras letras
    return partes[0].charAt(0).toUpperCase() + ".";
  }

  // Múltiples partes: Primera inicial + segundo elemento completo + iniciales del resto
  const resultado: string[] = [];

  for (let i = 0; i < partes.length; i++) {
    const parte = partes[i];
    if (i === 0) {
      // Primer nombre: solo inicial
      resultado.push(parte.charAt(0).toUpperCase() + ".");
    } else if (i === 1) {
      // Primer apellido: completo (o parcial si es muy largo)
      if (parte.length > 10) {
        resultado.push(parte.substring(0, 6) + "...");
      } else {
        resultado.push(parte);
      }
    } else {
      // Resto de apellidos: solo inicial
      resultado.push(parte.charAt(0).toUpperCase() + ".");
    }
  }

  return resultado.join(" ");
}

// Helper para construir dirección formateada
function buildDireccion(cliente: {
  tipo_via?: string | null;
  nombre_via?: string | null;
  numero?: string | null;
  escalera?: string | null;
  piso?: string | null;
  puerta?: string | null;
  direccion?: string | null;
  poblacion?: string | null;
}): string {
  let dir = "";
  if (cliente.tipo_via && cliente.nombre_via) {
    dir = `${cliente.tipo_via} ${cliente.nombre_via}`;
    if (cliente.numero) dir += ` ${cliente.numero}`;
    if (cliente.escalera) dir += `, Esc. ${cliente.escalera}`;
    if (cliente.piso) dir += `, ${cliente.piso}º`;
    if (cliente.puerta) dir += ` ${cliente.puerta}`;
  } else if (cliente.direccion) {
    dir = cliente.direccion;
  }
  if (cliente.poblacion && dir) {
    dir += ` (${cliente.poblacion})`;
  } else if (cliente.poblacion) {
    dir = cliente.poblacion;
  }
  return dir;
}

// Obtener los clientes asociados a una factura de operario (para el detalle)
export async function getClientesDeFacturaOperario(facturaId: string) {
  const supabase = await createClient();

  // Primero intentamos obtener de la tabla factura_clientes
  const { data, error } = await supabase
    .from("factura_clientes")
    .select(`
      cliente_id,
      comision,
      clientes (nombre_apellidos, razon_social, servicio, tipo_via, nombre_via, numero, escalera, piso, puerta, direccion, poblacion)
    `)
    .eq("factura_id", facturaId);

  if (error) {
    console.error("Error fetching clientes de factura:", error);
    return [];
  }

  // Si hay datos en factura_clientes, los devolvemos
  if (data && data.length > 0) {
    return data.map((fc) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = fc.clientes as any;
      const nombreCompleto = c?.nombre_apellidos || c?.razon_social || "Sin nombre";
      return {
        clienteId: fc.cliente_id,
        comision: fc.comision || 0,
        nombreCliente: anonimizarNombre(nombreCompleto),
        servicio: c?.servicio || "-",
        direccion: c ? buildDireccion(c) : "",
      };
    });
  }

  // Si no hay datos, buscamos los clientes Liquidados del operario asociado a esta factura
  // Esto es para facturas antiguas que no tienen la relación
  const { data: factura } = await supabase
    .from("facturas_operarios")
    .select("operario_id, numero_factura")
    .eq("id", facturaId)
    .single();

  if (!factura) return [];

  // Obtener el alias del operario
  const { data: operario } = await supabase
    .from("operarios")
    .select("alias, nombre")
    .eq("id", factura.operario_id)
    .single();

  if (!operario) return [];

  // Buscar clientes liquidados con esta factura
  const { data: clientes } = await supabase
    .from("clientes")
    .select("id, nombre_apellidos, razon_social, servicio, tipo_via, nombre_via, numero, escalera, piso, puerta, direccion, poblacion")
    .eq("factura_pagos", factura.numero_factura);

  if (!clientes || clientes.length === 0) return [];

  // Calcular comisiones (necesitamos los valores por defecto)
  const { data: comisionesDefectoData } = await supabase
    .from("configuracion_comisiones")
    .select("servicio, comision_defecto");

  const comisionesDefecto: Record<string, number> = {
    Luz: 25, Gas: 25, Telefonía: 50, Seguros: 25, Alarmas: 50,
  };
  for (const row of comisionesDefectoData || []) {
    comisionesDefecto[row.servicio] = row.comision_defecto;
  }

  return clientes.map((c) => {
    // Calcular comisión basada en servicios
    const servicios = (c.servicio || "").split(", ").filter(Boolean);
    const comision = servicios.reduce((sum: number, s: string) => sum + (comisionesDefecto[s] || 0), 0);
    const nombreCompleto = c.nombre_apellidos || c.razon_social || "Sin nombre";

    return {
      clienteId: c.id,
      comision,
      nombreCliente: anonimizarNombre(nombreCompleto),
      servicio: c.servicio || "-",
      direccion: buildDireccion(c),
    };
  });
}
