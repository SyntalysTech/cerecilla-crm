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

// Function to get database stats
async function getDatabaseStats() {
  // Get clientes count
  const { count: totalClientes } = await supabase
    .from("clientes")
    .select("*", { count: "exact", head: true });

  // Fetch all clientes for stats (only needed fields)
  const allClientesData = await fetchAllRows<{ estado: string | null; servicio: string | null; operador: string | null }>(
    "clientes",
    "estado, servicio, operador"
  );

  const estadoStats: Record<string, number> = {};
  const servicioStats: Record<string, number> = {};
  const operadorStats: Record<string, number> = {};

  allClientesData.forEach((c) => {
    const estado = c.estado || "Sin estado";
    estadoStats[estado] = (estadoStats[estado] || 0) + 1;

    const servicio = c.servicio || "Sin servicio";
    servicioStats[servicio] = (servicioStats[servicio] || 0) + 1;

    if (c.operador) {
      operadorStats[c.operador] = (operadorStats[c.operador] || 0) + 1;
    }
  });

  // Get operarios count and stats
  const { count: totalOperarios } = await supabase
    .from("operarios")
    .select("*", { count: "exact", head: true });

  const allOperariosData = await fetchAllRows<{ tipo: string | null }>(
    "operarios",
    "tipo"
  );

  const tipoStats: Record<string, number> = {};
  allOperariosData.forEach((o) => {
    const tipo = o.tipo || "Sin tipo";
    tipoStats[tipo] = (tipoStats[tipo] || 0) + 1;
  });

  // Get recent clientes (last 5)
  const { data: recentClientes } = await supabase
    .from("clientes")
    .select("nombre_apellidos, razon_social, estado, servicio, operador, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const topOperadores = Object.entries(operadorStats)
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
      })) || [],
    },
    operarios: {
      total: totalOperarios || 0,
      porTipo: tipoStats,
    },
    topOperadores,
  };
}

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

🏆 TOP OPERADORES (por número de clientes):
${stats.topOperadores.map((o, i) => `${i + 1}. ${o.nombre}: ${o.clientes} clientes`).join("\n")}

📝 ÚLTIMOS CLIENTES REGISTRADOS:
${stats.clientes.recientes.map(c => `- ${c.nombre} (${c.estado}, ${c.servicio}) - Operador: ${c.operador}`).join("\n")}

Puedes ayudar con:
- Información sobre el estado de clientes y operarios
- Estadísticas y análisis del CRM
- Dudas sobre procesos de gestión de clientes
- Información sobre servicios de luz y gas
- Cualquier pregunta relacionada con el CRM

Cuando te pregunten por datos específicos, usa la información proporcionada arriba. Si te piden algo que no está en los datos, indícalo amablemente.
Siempre mantén un tono positivo y constructivo.`;
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true,
    });

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
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
