import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Helper to fetch all rows in batches (Supabase limit is 1000 per query)
async function fetchAllRows<T>(
  table: string,
  selectFields: string,
  orderBy?: { column: string; ascending: boolean }
): Promise<T[]> {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });

  if (!count) return [];

  const batchSize = 1000;
  const totalBatches = Math.ceil(count / batchSize);
  let allRows: T[] = [];

  for (let i = 0; i < totalBatches; i++) {
    let query = supabase
      .from(table)
      .select(selectFields)
      .range(i * batchSize, (i + 1) * batchSize - 1);

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    const { data } = await query;
    if (data) {
      allRows = allRows.concat(data as T[]);
    }
  }

  return allRows;
}

// Search for clients by various criteria
async function searchClientes(query: string) {
  const searchTerm = `%${query}%`;

  const { data } = await supabase
    .from("clientes")
    .select("id, nombre_apellidos, razon_social, email, telefono, direccion, estado, servicio, operador, compania_luz, compania_gas, cups_luz, cups_gas, created_at")
    .or(`nombre_apellidos.ilike.${searchTerm},razon_social.ilike.${searchTerm},email.ilike.${searchTerm},telefono.ilike.${searchTerm},compania_luz.ilike.${searchTerm},compania_gas.ilike.${searchTerm},cups_luz.ilike.${searchTerm},cups_gas.ilike.${searchTerm}`)
    .limit(20);

  return data || [];
}

// Get clients by company
async function getClientesByCompany(companyName: string) {
  const searchTerm = `%${companyName}%`;

  const { data } = await supabase
    .from("clientes")
    .select("id, nombre_apellidos, razon_social, email, telefono, estado, servicio, operador, compania_luz, compania_gas")
    .or(`compania_luz.ilike.${searchTerm},compania_gas.ilike.${searchTerm}`)
    .limit(50);

  return data || [];
}

// Get clients by estado
async function getClientesByEstado(estado: string) {
  const { data } = await supabase
    .from("clientes")
    .select("id, nombre_apellidos, razon_social, email, telefono, estado, servicio, operador, created_at")
    .ilike("estado", `%${estado}%`)
    .order("created_at", { ascending: false })
    .limit(30);

  return data || [];
}

// Get clients by operador
async function getClientesByOperador(operador: string) {
  const searchTerm = `%${operador}%`;

  const { data } = await supabase
    .from("clientes")
    .select("id, nombre_apellidos, razon_social, email, telefono, estado, servicio, operador, created_at")
    .ilike("operador", searchTerm)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

// Get company statistics
async function getCompanyStats() {
  const allClientes = await fetchAllRows<{ compania_luz: string | null; compania_gas: string | null }>(
    "clientes",
    "compania_luz, compania_gas"
  );

  const companiaLuzStats: Record<string, number> = {};
  const companiaGasStats: Record<string, number> = {};

  allClientes.forEach((c) => {
    if (c.compania_luz) {
      companiaLuzStats[c.compania_luz] = (companiaLuzStats[c.compania_luz] || 0) + 1;
    }
    if (c.compania_gas) {
      companiaGasStats[c.compania_gas] = (companiaGasStats[c.compania_gas] || 0) + 1;
    }
  });

  return { companiaLuzStats, companiaGasStats };
}

// Function to get database stats
async function getDatabaseStats() {
  // Get clientes count
  const { count: totalClientes } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  // Fetch all clientes for stats (only needed fields)
  const allClientesData = await fetchAllRows<{ estado: string | null; servicio: string | null; operador: string | null; compania_luz: string | null; compania_gas: string | null }>(
    "clientes",
    "estado, servicio, operador, compania_luz, compania_gas"
  );

  const estadoStats: Record<string, number> = {};
  const servicioStats: Record<string, number> = {};
  const operadorStats: Record<string, number> = {};
  const companiaLuzStats: Record<string, number> = {};
  const companiaGasStats: Record<string, number> = {};

  allClientesData.forEach((c) => {
    const estado = c.estado || "Sin estado";
    estadoStats[estado] = (estadoStats[estado] || 0) + 1;

    const servicio = c.servicio || "Sin servicio";
    servicioStats[servicio] = (servicioStats[servicio] || 0) + 1;

    if (c.operador) {
      operadorStats[c.operador] = (operadorStats[c.operador] || 0) + 1;
    }

    if (c.compania_luz) {
      companiaLuzStats[c.compania_luz] = (companiaLuzStats[c.compania_luz] || 0) + 1;
    }

    if (c.compania_gas) {
      companiaGasStats[c.compania_gas] = (companiaGasStats[c.compania_gas] || 0) + 1;
    }
  });

  // Get operarios count and stats
  const { count: totalOperarios } = await supabase
    .from("operarios")
    .select("*", { count: "exact", head: true });

  const allOperariosData = await fetchAllRows<{ tipo: string | null; nombre: string | null; alias: string | null }>(
    "operarios",
    "tipo, nombre, alias"
  );

  const tipoStats: Record<string, number> = {};
  const operariosList: string[] = [];
  allOperariosData.forEach((o) => {
    const tipo = o.tipo || "Sin tipo";
    tipoStats[tipo] = (tipoStats[tipo] || 0) + 1;
    if (o.nombre) operariosList.push(o.nombre);
    else if (o.alias) operariosList.push(o.alias);
  });

  // Get recent clientes (last 10)
  const { data: recentClientes } = await supabase
    .from("clientes")
    .select("nombre_apellidos, razon_social, estado, servicio, operador, compania_luz, compania_gas, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const topOperadores = Object.entries(operadorStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nombre, count]) => ({ nombre, clientes: count }));

  const topCompaniasLuz = Object.entries(companiaLuzStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nombre, count]) => ({ nombre, clientes: count }));

  const topCompaniasGas = Object.entries(companiaGasStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([nombre, count]) => ({ nombre, clientes: count }));

  return {
    clientes: {
      total: totalClientes || 0,
      porEstado: estadoStats,
      porServicio: servicioStats,
      recientes: recentClientes?.map(c => ({
        nombre: c.nombre_apellidos || c.razon_social || "Sin nombre",
        estado: c.estado || "Sin estado",
        servicio: c.servicio || "Sin servicio",
        operador: c.operador || "Sin operador",
        companiaLuz: c.compania_luz || null,
        companiaGas: c.compania_gas || null,
        fecha: c.created_at,
      })) || [],
    },
    operarios: {
      total: totalOperarios || 0,
      porTipo: tipoStats,
      lista: operariosList.slice(0, 20),
    },
    topOperadores,
    topCompaniasLuz,
    topCompaniasGas,
  };
}

// Define functions for OpenAI function calling
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_clientes",
      description: "Busca clientes por nombre, email, teléfono, CUPS o compañía. Usa esta función cuando el usuario pregunte por un cliente específico.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Término de búsqueda (nombre, email, teléfono, CUPS, etc.)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clientes_by_company",
      description: "Obtiene todos los clientes de una compañía eléctrica o de gas específica (Iberdrola, Endesa, Naturgy, etc.)",
      parameters: {
        type: "object",
        properties: {
          company_name: {
            type: "string",
            description: "Nombre de la compañía (ej: Iberdrola, Endesa, Naturgy, Repsol)",
          },
        },
        required: ["company_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clientes_by_estado",
      description: "Obtiene clientes filtrados por estado (SIN ESTADO, SEGUIMIENTO, PENDIENTE DOC, EN TRAMITE, COMISIONABLE, LIQUIDADO, FINALIZADO, FALLIDO)",
      parameters: {
        type: "object",
        properties: {
          estado: {
            type: "string",
            description: "Estado del cliente",
            enum: ["SIN ESTADO", "SEGUIMIENTO", "PENDIENTE DOC", "EN TRAMITE", "COMISIONABLE", "LIQUIDADO", "FINALIZADO", "FALLIDO"],
          },
        },
        required: ["estado"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_clientes_by_operador",
      description: "Obtiene todos los clientes de un operador/comercial específico",
      parameters: {
        type: "object",
        properties: {
          operador: {
            type: "string",
            description: "Nombre del operador/comercial",
          },
        },
        required: ["operador"],
      },
    },
  },
];

function buildSystemPrompt(stats: Awaited<ReturnType<typeof getDatabaseStats>>) {
  return `Eres CerecIA, el asistente virtual inteligente de Cerecilla, una empresa de servicios energéticos (luz y gas).

Tu personalidad:
- Eres amable, profesional y eficiente
- Respondes en español de España
- Tienes un tono cercano pero profesional
- Usas emojis ocasionalmente para ser más expresivo ⚡🔥
- Eres experto en el sector energético y gestión de clientes

DATOS ACTUALES DEL CRM (en tiempo real):

📊 ESTADÍSTICAS DE CLIENTES:
- Total de clientes: ${stats.clientes.total}
- Por estado: ${Object.entries(stats.clientes.porEstado).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Por servicio: ${Object.entries(stats.clientes.porServicio).map(([k, v]) => `${k}: ${v}`).join(", ")}

👥 ESTADÍSTICAS DE OPERARIOS:
- Total de operarios: ${stats.operarios.total}
- Por tipo: ${Object.entries(stats.operarios.porTipo).map(([k, v]) => `${k}: ${v}`).join(", ")}
- Operarios activos: ${stats.operarios.lista.join(", ")}

🏆 TOP OPERADORES (por número de clientes):
${stats.topOperadores.map((o, i) => `${i + 1}. ${o.nombre}: ${o.clientes} clientes`).join("\n")}

⚡ TOP COMPAÑÍAS DE LUZ:
${stats.topCompaniasLuz.map((c, i) => `${i + 1}. ${c.nombre}: ${c.clientes} clientes`).join("\n")}

🔥 TOP COMPAÑÍAS DE GAS:
${stats.topCompaniasGas.map((c, i) => `${i + 1}. ${c.nombre}: ${c.clientes} clientes`).join("\n")}

📝 ÚLTIMOS CLIENTES REGISTRADOS:
${stats.clientes.recientes.map(c => `- ${c.nombre} (${c.estado}, ${c.servicio}) - Operador: ${c.operador}${c.companiaLuz ? `, Luz: ${c.companiaLuz}` : ""}${c.companiaGas ? `, Gas: ${c.companiaGas}` : ""}`).join("\n")}

CAPACIDADES:
Tienes acceso a funciones para buscar información específica en la base de datos:
- Buscar clientes por nombre, email, teléfono, CUPS o compañía
- Ver clientes de una compañía específica (Iberdrola, Endesa, Naturgy, etc.)
- Filtrar clientes por estado
- Ver clientes de un operador específico

Cuando el usuario pregunte por información específica sobre clientes o compañías, usa las funciones disponibles para obtener los datos.

Puedes ayudar con:
- Buscar clientes específicos por nombre, teléfono, email, o CUPS
- Información sobre qué clientes tienen cada compañía
- Estado de clientes y operarios
- Estadísticas y análisis del CRM
- Dudas sobre procesos de gestión de clientes
- Información sobre servicios de luz y gas

Siempre mantén un tono positivo y constructivo.`;
}

// Execute function call
async function executeFunctionCall(name: string, args: Record<string, string>) {
  switch (name) {
    case "search_clientes": {
      const results = await searchClientes(args.query);
      return results.length > 0
        ? `Encontré ${results.length} cliente(s):\n${results.map(c =>
            `- **${c.nombre_apellidos || c.razon_social || "Sin nombre"}** (${c.estado || "Sin estado"})\n  Email: ${c.email || "N/A"} | Tel: ${c.telefono || "N/A"}\n  Luz: ${c.compania_luz || "N/A"} | Gas: ${c.compania_gas || "N/A"}\n  Operador: ${c.operador || "N/A"}`
          ).join("\n\n")}`
        : "No encontré clientes con ese criterio de búsqueda.";
    }
    case "get_clientes_by_company": {
      const results = await getClientesByCompany(args.company_name);
      return results.length > 0
        ? `Encontré ${results.length} cliente(s) con ${args.company_name}:\n${results.slice(0, 15).map(c =>
            `- **${c.nombre_apellidos || c.razon_social || "Sin nombre"}** (${c.estado || "Sin estado"}) - Luz: ${c.compania_luz || "N/A"}, Gas: ${c.compania_gas || "N/A"}`
          ).join("\n")}${results.length > 15 ? `\n\n... y ${results.length - 15} más.` : ""}`
        : `No encontré clientes con la compañía ${args.company_name}.`;
    }
    case "get_clientes_by_estado": {
      const results = await getClientesByEstado(args.estado);
      return results.length > 0
        ? `Hay ${results.length} cliente(s) en estado ${args.estado}:\n${results.slice(0, 15).map(c =>
            `- **${c.nombre_apellidos || c.razon_social || "Sin nombre"}** - Operador: ${c.operador || "N/A"}, Servicio: ${c.servicio || "N/A"}`
          ).join("\n")}${results.length > 15 ? `\n\n... y ${results.length - 15} más.` : ""}`
        : `No hay clientes en estado ${args.estado}.`;
    }
    case "get_clientes_by_operador": {
      const results = await getClientesByOperador(args.operador);
      return results.length > 0
        ? `${args.operador} tiene ${results.length} cliente(s):\n${results.slice(0, 15).map(c =>
            `- **${c.nombre_apellidos || c.razon_social || "Sin nombre"}** (${c.estado || "Sin estado"}) - ${c.servicio || "Sin servicio"}`
          ).join("\n")}${results.length > 15 ? `\n\n... y ${results.length - 15} más.` : ""}`
        : `No encontré clientes del operador ${args.operador}.`;
    }
    default:
      return "Función no reconocida.";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get fresh database stats
    const stats = await getDatabaseStats();
    const systemPrompt = buildSystemPrompt(stats);

    // First call - check if we need to use tools
    const initialCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    });

    const initialMessage = initialCompletion.choices[0].message;

    // If the model wants to use a tool
    if (initialMessage.tool_calls && initialMessage.tool_calls.length > 0) {
      const toolResults: { role: "tool"; tool_call_id: string; content: string }[] = [];

      // Execute all tool calls
      for (const toolCall of initialMessage.tool_calls) {
        // Check if it's a function tool call (type safety)
        if (toolCall.type !== "function") continue;

        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        const result = await executeFunctionCall(functionName, functionArgs);

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Make a second call with the tool results to get the final response
      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          initialMessage,
          ...toolResults,
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });

      // Stream the final response
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of finalCompletion) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            controller.error(error);
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

    // If no tool call, stream the initial response directly
    const directCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of directCompletion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
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
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return Response.json(
      { error: "Error processing chat request" },
      { status: 500 }
    );
  }
}
