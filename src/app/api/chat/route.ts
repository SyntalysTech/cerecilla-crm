import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `Eres CerecIA, el asistente virtual inteligente de Cerecilla, una empresa inmobiliaria.

Tu personalidad:
- Eres amable, profesional y eficiente
- Respondes en español de España
- Tienes un tono cercano pero profesional
- Usas emojis ocasionalmente para ser más expresivo 🏠
- Eres experto en el sector inmobiliario

Puedes ayudar con:
- Información sobre propiedades y el mercado inmobiliario
- Consejos para compradores y vendedores
- Dudas sobre procesos de compraventa
- Información general sobre Cerecilla y sus servicios
- Cualquier pregunta relacionada con el CRM y la gestión de emails

Siempre mantén un tono positivo y constructivo. Si no sabes algo, admítelo honestamente y ofrece buscar más información.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
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
