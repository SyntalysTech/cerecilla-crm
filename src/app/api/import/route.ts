import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Batch size for inserts (Supabase handles up to 1000 rows per insert)
const BATCH_SIZE = 50;

// Helper to get value from row with flexible key matching
function getValue(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return String(row[key]);
    }
  }
  return null;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "si" || value.toLowerCase() === "yes" || value.toLowerCase() === "true";
  }
  return false;
}

function normalizeServicio(value: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "luz") return "Luz";
  if (v === "gas") return "Gas";
  if (v.includes("luz") && v.includes("gas")) return "Luz y Gas";
  return null;
}

function normalizeTipoPersona(value: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.includes("fisica") || v.includes("física")) return "Persona Fisica";
  if (v.includes("juridica") || v.includes("jurídica")) return "Persona Juridica";
  return null;
}

function normalizeTipo(value: string | null): string | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "empresa") return "Empresa";
  if (v === "autonomo" || v === "autónomo") return "Autonomo";
  return null;
}

function parseClienteRow(row: Record<string, unknown>) {
  const operador = getValue(row, "operador");
  const nombre = getValue(row, "nombre y apellidos");

  // Skip empty rows
  if (!operador && !nombre) return null;

  return {
    operador,
    servicio: normalizeServicio(getValue(row, "servicio")),
    estado: getValue(row, "estado"),
    tiene_suministro: parseBoolean(row["¿Tiene suministro?"]),
    es_cambio_titular: parseBoolean(row["¿Es cambio de titular?"]),
    tipo_persona: normalizeTipoPersona(getValue(row, "empresa o persona")),
    nombre_apellidos: nombre,
    razon_social: getValue(row, "razon social"),
    documento_nuevo_titular: getValue(row, "documento nuevo titular"),
    documento_anterior_titular: getValue(row, "documento anterior titular"),
    email: getValue(row, "email"),
    telefono: getValue(row, "telefono"),
    cuenta_bancaria: getValue(row, "cuenta bancaria"),
    direccion: getValue(row, "direccion"),
    observaciones: getValue(row, "observaciones"),
    observaciones_admin: getValue(row, "observaciones_admin"),
    cups_gas: getValue(row, "cups gas"),
    cups_luz: getValue(row, "cups luz"),
    compania_gas: getValue(row, "compañia gas", "compania gas"),
    compania_luz: getValue(row, "compañia luz", "compania luz"),
    potencia_gas: getValue(row, "potencia gas"),
    potencia_luz: getValue(row, "potencia luz"),
    facturado: parseBoolean(row["facturado"]),
    cobrado: parseBoolean(row["cobrado"]),
    pagado: parseBoolean(row["pagado"]),
    factura_pagos: getValue(row, "factura pagos"),
    factura_cobros: getValue(row, "factura cobros"),
    precio_kw_gas: getValue(row, "precio kw gas"),
    precio_kw_luz: getValue(row, "precio kw luz"),
  };
}

function parseOperarioRow(row: Record<string, unknown>) {
  const alias = getValue(row, "Alias");
  const email = getValue(row, "Correo Electronico");

  // Skip empty rows
  if (!alias && !email) return null;

  return {
    email,
    alias,
    telefonos: getValue(row, "Telefonos"),
    tiene_doc_autonomo: parseBoolean(row["¿Tenemos Doc Autonomo?"]),
    tiene_doc_escritura: parseBoolean(row["¿Tenemos Doc Escritura?"]),
    tiene_doc_cif: parseBoolean(row["¿Tenemos Doc CIF?"]),
    tiene_doc_contrato: parseBoolean(row["¿Tenemos Doc Contrato?"]),
    tipo: normalizeTipo(getValue(row, "Empresa o Autonomo")),
    nombre: getValue(row, "Nombre"),
    documento: getValue(row, "Documento"),
    empresa: getValue(row, "Empresa"),
    cif: getValue(row, "CIF"),
    cuenta_bancaria: getValue(row, "Cuenta Bancaria"),
    direccion: getValue(row, "Direccion"),
  };
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const type = formData.get("type") as string;

        if (!file || !type) {
          send({ status: "error", message: "File and type are required" });
          controller.close();
          return;
        }

        // Read Excel file
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

        const total = data.length;
        let imported = 0;
        let errors = 0;
        let current = 0;

        // Parse rows based on type
        const parseRow = type === "clientes" ? parseClienteRow : parseOperarioRow;
        const tableName = type === "clientes" ? "clientes" : "operarios";

        // Process in batches
        const validRows: object[] = [];

        for (const row of data) {
          current++;
          const parsed = parseRow(row);

          if (parsed) {
            validRows.push(parsed);
          }

          // When batch is full, insert
          if (validRows.length >= BATCH_SIZE) {
            const { error, data: insertedData } = await supabase
              .from(tableName)
              .insert(validRows)
              .select("id");

            if (error) {
              errors += validRows.length;
            } else {
              imported += insertedData?.length || validRows.length;
            }

            validRows.length = 0; // Clear batch

            // Send progress update
            send({
              status: "importing",
              current,
              total,
              imported,
              errors,
            });
          }
        }

        // Insert remaining rows
        if (validRows.length > 0) {
          const { error, data: insertedData } = await supabase
            .from(tableName)
            .insert(validRows)
            .select("id");

          if (error) {
            errors += validRows.length;
          } else {
            imported += insertedData?.length || validRows.length;
          }
        }

        // Send final status
        send({
          status: "done",
          current: total,
          total,
          imported,
          errors,
        });

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        console.error("Import error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              status: "error",
              message: "Error al importar: " + String(error),
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
