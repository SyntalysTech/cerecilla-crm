import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: "File and type are required" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    let imported = 0;
    let errors: string[] = [];

    if (type === "clientes") {
      for (const row of data as Record<string, unknown>[]) {
        try {
          const cliente = {
            operador: row["operador"] as string || null,
            servicio: normalizeServicio(row["servicio"] as string),
            estado: row["estado"] as string || null,
            tiene_suministro: parseBoolean(row["¿Tiene suministro?"]),
            es_cambio_titular: parseBoolean(row["¿Es cambio de titular?"]),
            tipo_persona: normalizeTipoPersona(row["empresa o persona"] as string),
            nombre_apellidos: row["nombre y apellidos"] as string || null,
            razon_social: row["razon social"] as string || null,
            documento_nuevo_titular: row["documento nuevo titular"] as string || null,
            documento_anterior_titular: row["documento anterior titular"] as string || null,
            email: row["email"] as string || null,
            telefono: String(row["telefono"] || "") || null,
            cuenta_bancaria: row["cuenta bancaria"] as string || null,
            direccion: row["direccion"] as string || null,
            observaciones: row["observaciones"] as string || null,
            observaciones_admin: row["observaciones_admin"] as string || null,
            cups_gas: row["cups gas"] as string || null,
            cups_luz: row["cups luz"] as string || null,
            compania_gas: row["compañia gas"] as string || null,
            compania_luz: row["compañia luz"] as string || null,
            potencia_gas: row["potencia gas"] as string || null,
            potencia_luz: row["potencia luz"] as string || null,
            facturado: parseBoolean(row["facturado"]),
            cobrado: parseBoolean(row["cobrado"]),
            pagado: parseBoolean(row["pagado"]),
            factura_pagos: row["factura pagos"] as string || null,
            factura_cobros: row["factura cobros"] as string || null,
            precio_kw_gas: row["precio kw gas"] as string || null,
            precio_kw_luz: row["precio kw luz"] as string || null,
          };

          const { error } = await supabase.from("clientes").insert(cliente);
          if (error) {
            errors.push(`Row error: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err) {
          errors.push(`Parse error: ${err}`);
        }
      }
    } else if (type === "operarios") {
      for (const row of data as Record<string, unknown>[]) {
        try {
          const operario = {
            email: row["Correo Electronico"] as string || null,
            alias: row["Alias"] as string || null,
            telefonos: String(row["Telefonos"] || "") || null,
            tiene_doc_autonomo: parseBoolean(row["¿Tenemos Doc Autonomo?"]),
            tiene_doc_escritura: parseBoolean(row["¿Tenemos Doc Escritura?"]),
            tiene_doc_cif: parseBoolean(row["¿Tenemos Doc CIF?"]),
            tiene_doc_contrato: parseBoolean(row["¿Tenemos Doc Contrato?"]),
            tipo: normalizeTipo(row["Empresa o Autonomo"] as string),
            nombre: row["Nombre"] as string || null,
            documento: row["Documento"] as string || null,
            empresa: row["Empresa"] as string || null,
            cif: row["CIF"] as string || null,
            cuenta_bancaria: row["Cuenta Bancaria"] as string || null,
            direccion: row["Direccion"] as string || null,
          };

          const { error } = await supabase.from("operarios").insert(operario);
          if (error) {
            errors.push(`Row error: ${error.message}`);
          } else {
            imported++;
          }
        } catch (err) {
          errors.push(`Parse error: ${err}`);
        }
      }
    } else {
      return NextResponse.json(
        { error: "Invalid type. Use 'clientes' or 'operarios'" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      imported,
      total: data.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "si" || value.toLowerCase() === "yes" || value.toLowerCase() === "true";
  }
  return false;
}

function normalizeServicio(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "luz") return "Luz";
  if (v === "gas") return "Gas";
  if (v.includes("luz") && v.includes("gas")) return "Luz y Gas";
  return null;
}

function normalizeTipoPersona(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.includes("fisica") || v.includes("física")) return "Persona Fisica";
  if (v.includes("juridica") || v.includes("jurídica")) return "Persona Juridica";
  return null;
}

function normalizeTipo(value: string | undefined): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "empresa") return "Empresa";
  if (v === "autonomo" || v === "autónomo") return "Autonomo";
  return null;
}
