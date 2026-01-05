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

// Parse date from Excel (handles various formats and Excel serial numbers)
function parseDate(value: unknown): string | null {
  if (!value) return null;

  // If it's an Excel serial date number
  if (typeof value === "number") {
    // Excel dates are number of days since 1900-01-01 (with a bug for 1900 being a leap year)
    const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return date.toISOString();
  }

  // If it's already a string, try to parse it
  if (typeof value === "string") {
    const dateStr = value.trim();
    if (!dateStr) return null;

    // Try various date formats
    // Format: DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // Format: YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // Format: DD/MM/YYYY HH:MM:SS or similar
    const dateTimeMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (dateTimeMatch) {
      const [, day, month, year, hour, minute, second] = dateTimeMatch;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        second ? parseInt(second) : 0
      );
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // Try direct Date parse as last resort
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return null;
}

function parseClienteRow(row: Record<string, unknown>) {
  const operador = getValue(row, "operador");
  const nombre = getValue(row, "nombre y apellidos");

  // Skip empty rows
  if (!operador && !nombre) return null;

  // Try to get date from various possible column names
  const fechaRaw = row["fecha"] ?? row["Fecha"] ?? row["fecha alta"] ?? row["Fecha Alta"] ??
                   row["fecha_alta"] ?? row["created_at"] ?? row["fecha registro"] ?? row["Fecha Registro"];
  const fecha = parseDate(fechaRaw);

  // Get separate address fields if provided (including __EMPTY columns from Excel)
  const tipoVia = getValue(row, "tipo_via", "tipo via", "Tipo Via", "Tipo Vía", "tipo calle", "Tipo Calle");

  // nombre_via can be in "direccion" column when followed by __EMPTY columns for number/piso/etc
  const direccionRaw = getValue(row, "direccion", "Direccion", "dirección", "Dirección");
  const hasEmptyColumns = row["__EMPTY"] !== undefined;

  // If we have __EMPTY columns, the "direccion" column is actually the street name
  const nombreVia = hasEmptyColumns
    ? direccionRaw
    : getValue(row, "nombre_via", "nombre via", "Nombre Via", "Nombre Vía", "calle", "Calle");

  // Get number, piso, puerta from __EMPTY columns or named columns
  const numero = getValue(row, "__EMPTY", "numero", "Numero", "Número");
  const piso = getValue(row, "__EMPTY_2", "piso", "Piso", "planta", "Planta");
  const puerta = getValue(row, "__EMPTY_3", "puerta", "Puerta");
  const codigoPostal = getValue(row, "__EMPTY_4", "codigo_postal", "codigo postal", "Codigo Postal", "Código Postal", "cp", "CP");
  const poblacion = getValue(row, "__EMPTY_5", "poblacion", "Poblacion", "Población", "localidad", "Localidad", "ciudad", "Ciudad");
  const provincia = getValue(row, "__EMPTY_6", "provincia", "Provincia");

  // Escalera might be in a separate column
  const escalera = getValue(row, "escalera", "Escalera");

  // Get observaciones - these will be stored in cliente_observaciones table, not in cliente
  const observacionesRaw = getValue(row, "observaciones", "Observaciones", "notas", "Notas", "comentarios", "Comentarios");
  const observacionesAdminRaw = getValue(row, "observaciones_admin", "Observaciones Admin", "observaciones admin", "notas admin");

  // If observaciones starts with "ADMIN:" or "- ADMIN:", it should go to observaciones_admin
  let observaciones = observacionesRaw;
  let observacionesAdmin = observacionesAdminRaw;

  if (observacionesRaw && !observacionesAdminRaw) {
    // Check if content is admin observations
    if (observacionesRaw.startsWith("ADMIN:") || observacionesRaw.includes(" - ADMIN:")) {
      observacionesAdmin = observacionesRaw;
      observaciones = null;
    }
  }

  // Build the result object (observaciones will be added to cliente_observaciones table separately)
  const result: Record<string, unknown> = {
    operador,
    servicio: normalizeServicio(getValue(row, "servicio")),
    estado: getValue(row, "estado"),
    tiene_suministro: parseBoolean(row["¿Tiene suministro?"]),
    es_cambio_titular: parseBoolean(row["¿Es cambio de titular?"]),
    tipo_persona: normalizeTipoPersona(getValue(row, "empresa o persona")),
    nombre_apellidos: nombre,
    razon_social: getValue(row, "razon social", "Razon Social", "razón social"),
    documento_nuevo_titular: getValue(row, "documento nuevo titular", "Documento Nuevo Titular"),
    documento_anterior_titular: getValue(row, "documento anterior titular", "Documento Anterior Titular"),
    email: getValue(row, "email", "Email", "correo", "Correo"),
    telefono: getValue(row, "telefono", "Telefono", "teléfono", "Teléfono"),
    cuenta_bancaria: getValue(row, "cuenta bancaria", "Cuenta Bancaria"),
    // Store observaciones temporarily for later insertion into cliente_observaciones
    _observaciones: observaciones,
    _observaciones_admin: observacionesAdmin,
    cups_gas: getValue(row, "cups gas", "CUPS Gas", "cups_gas"),
    cups_luz: getValue(row, "cups luz", "CUPS Luz", "cups_luz"),
    compania_gas: getValue(row, "compañia gas", "compania gas", "Compañia Gas", "Compania Gas"),
    compania_luz: getValue(row, "compañia luz", "compania luz", "Compañia Luz", "Compania Luz"),
    potencia_gas: getValue(row, "potencia gas", "Potencia Gas"),
    potencia_luz: getValue(row, "potencia luz", "Potencia Luz"),
    facturado: parseBoolean(row["facturado"] ?? row["Facturado"]),
    cobrado: parseBoolean(row["cobrado"] ?? row["Cobrado"]),
    pagado: parseBoolean(row["pagado"] ?? row["Pagado"]),
    factura_pagos: getValue(row, "factura pagos", "Factura Pagos"),
    factura_cobros: getValue(row, "factura cobros", "Factura Cobros"),
    precio_kw_gas: getValue(row, "precio kw gas", "Precio kW Gas"),
    precio_kw_luz: getValue(row, "precio kw luz", "Precio kW Luz"),
  };

  // Handle address: use separate fields
  if (nombreVia || numero || codigoPostal || poblacion || provincia) {
    // Use separate address fields - detect tipo_via from nombreVia if not provided
    let detectedTipoVia = tipoVia;
    let cleanNombreVia = nombreVia;

    if (!tipoVia && nombreVia) {
      // Try to detect tipo_via from the start of nombreVia
      const tiposVia = ["Calle", "Avenida", "Plaza", "Paseo", "Urbanización", "Polígono", "Carretera", "Camino"];
      for (const tipo of tiposVia) {
        if (nombreVia.toLowerCase().startsWith(tipo.toLowerCase() + " ")) {
          detectedTipoVia = tipo;
          cleanNombreVia = nombreVia.substring(tipo.length + 1).trim();
          break;
        }
      }
      // Default to "Calle" if no tipo detected
      if (!detectedTipoVia) {
        detectedTipoVia = "Calle";
      }
    }

    result.tipo_via = detectedTipoVia;
    result.nombre_via = cleanNombreVia;
    result.numero = numero;
    result.escalera = escalera;
    result.piso = piso;
    result.puerta = puerta;
    result.codigo_postal = codigoPostal;
    result.poblacion = poblacion;
    result.provincia = provincia;

    // Also compose direccion from parts for backward compatibility
    const parts = [
      detectedTipoVia,
      cleanNombreVia,
      numero,
      escalera ? `Esc. ${escalera}` : null,
      piso ? `${piso}º` : null,
      puerta ? puerta : null,
    ].filter(Boolean);
    const addressLine = parts.join(" ");
    const locationLine = [codigoPostal, poblacion, provincia].filter(Boolean).join(", ");
    result.direccion = [addressLine, locationLine].filter(Boolean).join(", ");
  } else if (direccionRaw && !hasEmptyColumns) {
    // Use direccion completa as-is (no separate columns)
    result.direccion = direccionRaw;
  }

  // Only add created_at if we have a valid date
  if (fecha) {
    result.created_at = fecha;
  }

  return result;
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
        let lastError = "";

        console.log(`Starting import of ${total} rows for ${type}`);

        // Parse rows based on type
        const parseRow = type === "clientes" ? parseClienteRow : parseOperarioRow;
        const tableName = type === "clientes" ? "clientes" : "operarios";

        // Send initial progress
        send({
          status: "importing",
          current: 0,
          total,
          imported: 0,
          errors: 0,
        });

        // Process in batches
        const validRows: Array<{ data: Record<string, unknown>; observaciones: string | null; observaciones_admin: string | null }> = [];

        // Helper to insert a batch and create observaciones
        async function insertBatch(rows: typeof validRows) {
          // Prepare rows for insertion (remove temporary observaciones fields)
          const rowsToInsert = rows.map(r => {
            const { _observaciones, _observaciones_admin, ...clienteData } = r.data as Record<string, unknown>;
            return clienteData;
          });

          const { error, data: insertedData } = await supabase
            .from(tableName)
            .insert(rowsToInsert)
            .select("id");

          if (error) {
            console.error("Batch insert error:", error.message);
            lastError = error.message;
            errors += rows.length;
            return;
          }

          imported += insertedData?.length || rows.length;

          // For clientes, create observaciones entries
          if (type === "clientes" && insertedData) {
            const observacionesToInsert: Array<{
              cliente_id: string;
              mensaje: string;
              es_admin: boolean;
              user_email: string;
              user_name: string;
            }> = [];

            for (let i = 0; i < insertedData.length; i++) {
              const clienteId = insertedData[i].id;
              const obs = rows[i].data._observaciones as string | null;
              const obsAdmin = rows[i].data._observaciones_admin as string | null;

              if (obs) {
                observacionesToInsert.push({
                  cliente_id: clienteId,
                  mensaje: obs,
                  es_admin: false,
                  user_email: "importacion@cerecilla.com",
                  user_name: "Importación Excel",
                });
              }

              if (obsAdmin) {
                observacionesToInsert.push({
                  cliente_id: clienteId,
                  mensaje: obsAdmin,
                  es_admin: true,
                  user_email: "importacion@cerecilla.com",
                  user_name: "Importación Excel",
                });
              }
            }

            if (observacionesToInsert.length > 0) {
              const { error: obsError } = await supabase
                .from("cliente_observaciones")
                .insert(observacionesToInsert);

              if (obsError) {
                console.error("Error inserting observaciones:", obsError.message);
              }
            }
          }
        }

        for (const row of data) {
          current++;
          const parsed = parseRow(row);

          if (parsed) {
            validRows.push({
              data: parsed,
              observaciones: (parsed as Record<string, unknown>)._observaciones as string | null,
              observaciones_admin: (parsed as Record<string, unknown>)._observaciones_admin as string | null,
            });
          }

          // When batch is full, insert
          if (validRows.length >= BATCH_SIZE) {
            await insertBatch(validRows);
            validRows.length = 0; // Clear batch

            // Send progress update
            send({
              status: "importing",
              current,
              total,
              imported,
              errors,
              lastError: lastError || undefined,
            });
          }
        }

        // Insert remaining rows
        if (validRows.length > 0) {
          await insertBatch(validRows);
        }

        console.log(`Import finished: ${imported} imported, ${errors} errors`);

        // Send final status
        send({
          status: "done",
          current: total,
          total,
          imported,
          errors,
          lastError: errors > 0 ? lastError : undefined,
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
