/**
 * WhatsApp AI Auto-Responder
 * Uses OpenAI GPT to automatically respond to incoming WhatsApp messages
 */

import OpenAI from "openai";
import * as pdfParse from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cerecilla company context for the AI
const CERECILLA_CONTEXT = `
# SOBRE CERECILLA

## Quiénes Somos
Cerecilla es una empresa especializada en ahorro para hogares y empresas. Ayudamos a nuestros clientes a reducir sus facturas de luz, gas, telefonía, seguros y alarmas mediante el análisis de consumo y la búsqueda de las mejores ofertas del mercado.

## Servicios Principales (TODOS con análisis gratuito y sin compromiso)

### 1. Ahorro en Luz y Gas ⚡🔥
- Análisis gratuito de facturas
- Comparación entre comercializadoras
- Tramitación de cambios de compañía
- Optimización de potencias contratadas
- Cambio de tarifa si es necesario
- Ahorro típico: 10-30%

### 2. Telefonía y Fibra 📱
- Análisis de tarifas móviles y fibra
- Comparación de operadores
- Tramitación de cambios y portabilidades

### 3. Seguros 🛡️
- Seguros de hogar
- Seguros de vida
- Seguros de coche
- Asesoramiento personalizado

### 4. Alarmas y Seguridad 🚨
- Sistemas de alarma para hogares
- Sistemas de seguridad para negocios
- Cámaras de videovigilancia
- Sensores de movimiento y apertura
- Conexión 24h con central receptora
- Asesoramiento sobre la mejor opción según tus necesidades

## Información de Contacto
- **Teléfono:** 643 879 149
- **Email:** info@cerecilla.com
- **Horario:** Lunes a Viernes de 9:00 a 18:00
- **Web:** cerecilla.com

## Proceso de Trabajo
1. **Contacto inicial:** El cliente nos envía su factura o datos de consumo
2. **Análisis gratuito:** Estudiamos el caso sin compromiso
3. **Propuesta:** Presentamos las mejores opciones de ahorro
4. **Tramitación:** Si el cliente acepta, gestionamos todo el proceso
5. **Seguimiento:** Verificamos que el cambio se ha realizado correctamente

## Valores
- Transparencia total con el cliente
- Sin costes ocultos
- Ahorro real y demostrable
- Atención personalizada
- Profesionalidad y rapidez

## Compañías con las que Trabajamos
Trabajamos con las principales compañías del mercado:
- **Luz:** Iberdrola, Endesa, Naturgy, Repsol, TotalEnergies, etc.
- **Gas:** Naturgy, Endesa, Repsol, TotalEnergies, etc.
- **Telefonía:** Movistar, Vodafone, Orange, MásMóvil, Pepephone, etc.
- **Alarmas:** Securitas Direct, Prosegur, ADT, Movistar Prosegur, etc.

## FAQ - Preguntas Frecuentes

### ¿El análisis tiene algún coste?
No, el análisis de tus facturas es completamente gratuito y sin compromiso.

### ¿Cómo puedo enviar mi factura?
Puedes enviarnos una foto de tu factura por WhatsApp a este mismo número, por email a info@cerecilla.com, o llamarnos para que te guiemos.

### ¿Cuánto puedo ahorrar?
El ahorro depende de cada caso, pero normalmente conseguimos ahorros de entre un 10% y un 30% en las facturas de luz y gas.

### ¿Hay permanencia?
Nosotros no aplicamos permanencia. Algunas compañías pueden tener ofertas con permanencia, pero siempre te lo explicaremos antes.

### ¿Cuánto tarda el cambio?
El cambio de compañía suele tardar entre 15 y 30 días, dependiendo de la comercializadora.

### ¿Me quedaré sin suministro durante el cambio?
No, nunca te quedarás sin luz ni gas. El cambio se realiza de forma transparente.

### ¿También hacéis alarmas?
¡Sí! También ayudamos a encontrar el mejor sistema de alarma para tu hogar o negocio. Analizamos tus necesidades y te proponemos la mejor opción.
`;

const SYSTEM_PROMPT = `Eres CereciBot, el asistente virtual de WhatsApp de Cerecilla. Tu trabajo es responder de forma amable, profesional y útil a los mensajes de los clientes.

PERSONALIDAD:
- Eres cercano pero profesional
- Usas un tono amigable y respetuoso
- Respondes en español de España
- Eres conciso pero informativo (respuestas de 1-3 párrafos máximo, apropiadas para WhatsApp)
- Puedes usar algún emoji ocasionalmente para ser más expresivo, pero no abuses

CONTEXTO DE LA EMPRESA:
${CERECILLA_CONTEXT}

INSTRUCCIONES IMPORTANTES:
1. Responde SIEMPRE en español
2. Mantén las respuestas cortas y apropiadas para WhatsApp (no más de 300 palabras)
3. Si el cliente pregunta por precios específicos, indica que depende de su consumo y que necesitas ver su factura
4. Si el cliente quiere enviar documentos, indícale que puede enviar fotos de su factura por este mismo chat
5. Si no sabes algo, di que consultarás con el equipo y le responderán pronto
6. Siempre intenta guiar hacia el siguiente paso: solicitar factura, agendar llamada, etc.
7. Si el mensaje es un saludo, responde con un saludo amable y pregunta en qué puedes ayudar
8. Si el mensaje es confuso o no tiene sentido, pide amablemente que aclaren su consulta
9. Si envían una imagen, audio, documento, etc., indica que has recibido el archivo y que el equipo lo revisará
10. NO inventes información que no esté en el contexto. Si no sabes algo, dilo honestamente.

EJEMPLOS DE RESPUESTAS:
- "Hola! 👋 Soy CereciBot, el asistente de Cerecilla. ¿En qué puedo ayudarte hoy?"
- "Claro! Para poder analizar tu caso y ver cuánto podrías ahorrar, necesitaría que me envíes una foto de tu última factura de luz o gas."
- "Entiendo! El cambio de compañía suele tardar entre 15 y 30 días, y durante ese tiempo nunca te quedarás sin suministro 💡"
- "Perfecto, he recibido tu factura! 📄 Nuestro equipo la analizará y te contactará pronto con las mejores opciones de ahorro."
`;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponseResult {
  success: boolean;
  response?: string;
  error?: string;
}

/**
 * Generate an AI response for an incoming WhatsApp message
 */
export async function generateAIResponse(
  incomingMessage: string,
  conversationHistory: ConversationMessage[] = [],
  senderName?: string
): Promise<AIResponseResult> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not configured");
    return { success: false, error: "OpenAI API key not configured" };
  }

  try {
    // Build messages array for OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation history (last 10 messages for context)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // Add the current message
    const userMessage = senderName
      ? `[Mensaje de ${senderName}]: ${incomingMessage}`
      : incomingMessage;

    messages.push({ role: "user", content: userMessage });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return { success: false, error: "No response from OpenAI" };
    }

    return { success: true, response };
  } catch (error) {
    console.error("Error generating AI response:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error generating response",
    };
  }
}

/**
 * Get fallback response when AI fails
 */
export function getFallbackResponse(): string {
  return "¡Hola! 👋 Gracias por contactar con Cerecilla. En este momento no puedo procesar tu mensaje automáticamente, pero nuestro equipo te responderá muy pronto. ¡Gracias por tu paciencia!";
}

/**
 * Check if message should trigger an auto-response
 * Some messages like status updates or reactions shouldn't get responses
 */
export function shouldAutoRespond(messageType: string, content: string): boolean {
  // Don't respond to reactions
  if (messageType === "reaction") return false;

  // Don't respond to empty messages
  if (!content || content.trim() === "") return false;

  // Don't respond to status-only messages
  if (content.startsWith("[") && content.endsWith("]")) {
    // These are system-generated content markers like [Imagen], [Audio], etc.
    // We SHOULD respond to these to acknowledge receipt
    return true;
  }

  return true;
}

/**
 * Check if auto-response is enabled
 */
export function isAutoResponseEnabled(): boolean {
  // Can be controlled via environment variable
  const enabled = process.env.WHATSAPP_AUTO_RESPONSE_ENABLED;
  return enabled !== "false"; // Enabled by default
}

/**
 * Analyze an invoice/bill image using GPT-4 Vision
 */
export interface InvoiceAnalysis {
  success: boolean;
  analysis?: {
    tipo: "luz" | "gas" | "telefonia" | "seguro" | "alarma" | "otro" | "desconocido";
    compania?: string;
    importe_total?: string;
    periodo?: string;
    consumo?: string;
    potencia_contratada?: string;
    tarifa?: string;
    nombre_titular?: string;
    direccion?: string;
    cups?: string;
    resumen: string;
    puntos_ahorro: string[];
  };
  error?: string;
}

const INVOICE_ANALYSIS_PROMPT = `Analiza esta factura o documento (puede ser imagen o texto extraído de PDF). Extrae la siguiente información si está disponible:

1. **Tipo de factura**: luz, gas, telefonía, seguro, alarma, u otro
2. **Compañía**: nombre de la empresa que emite la factura
3. **Importe total**: cantidad a pagar
4. **Período de facturación**: fechas del período
5. **Consumo**: kWh para luz, m³ para gas, datos/minutos para telefonía
6. **Potencia contratada**: solo para luz (kW)
7. **Tarifa**: tipo de tarifa contratada
8. **Nombre del titular**: si aparece
9. **Dirección de suministro**: si aparece
10. **CUPS**: código único de punto de suministro (solo luz/gas)

Además, proporciona:
- Un **resumen breve** (2-3 frases) de lo que ves en la factura, mencionando los datos más importantes
- **Puntos de posible ahorro** (2-3 sugerencias de cómo podrían ahorrar basándote en lo que ves)

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "tipo": "luz|gas|telefonia|seguro|alarma|otro|desconocido",
  "compania": "nombre o null",
  "importe_total": "cantidad o null",
  "periodo": "periodo o null",
  "consumo": "consumo o null",
  "potencia_contratada": "potencia o null",
  "tarifa": "tarifa o null",
  "nombre_titular": "nombre o null",
  "direccion": "direccion o null",
  "cups": "cups o null",
  "resumen": "Resumen breve de la factura",
  "puntos_ahorro": ["sugerencia 1", "sugerencia 2"]
}

Si no puedes identificar el documento como factura o no puedes leer el contenido, responde:
{
  "tipo": "desconocido",
  "resumen": "No he podido identificar este documento como una factura",
  "puntos_ahorro": []
}`;

export async function analyzeInvoiceImage(imageUrl: string): Promise<InvoiceAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not configured");
    return { success: false, error: "OpenAI API key not configured" };
  }

  try {
    console.log("Analyzing invoice media:", imageUrl);

    // Detect if it's a PDF based on data URL prefix
    const isPDF = imageUrl.startsWith("data:application/pdf");

    let completion: OpenAI.ChatCompletion;

    if (isPDF) {
      // Extract text from PDF
      console.log("Detected PDF, extracting text...");
      const base64Data = imageUrl.split(",")[1];
      const pdfBuffer = Buffer.from(base64Data, "base64");

      let pdfText = "";
      try {
        const pdfData = await pdfParse.default(pdfBuffer);
        pdfText = pdfData.text;
        console.log("PDF text extracted, length:", pdfText.length);
      } catch (pdfError) {
        console.error("Error extracting PDF text:", pdfError);
        return { success: false, error: "Could not extract text from PDF" };
      }

      // Analyze the extracted text with GPT-4o
      completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `${INVOICE_ANALYSIS_PROMPT}\n\nTexto extraído del PDF:\n\n${pdfText}`,
          },
        ],
        max_tokens: 1000,
      });
    } else {
      // Analyze image with GPT-4o Vision
      console.log("Detected image, analyzing with Vision...");
      completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: INVOICE_ANALYSIS_PROMPT },
              { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
            ],
          },
        ],
        max_tokens: 1000,
      });
    }

    const responseText = completion.choices[0]?.message?.content;
    console.log("Invoice analysis response:", responseText);

    if (!responseText) {
      return { success: false, error: "No response from OpenAI" };
    }

    // Parse JSON response
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { success: false, error: "Could not parse analysis response" };
      }

      const analysis = JSON.parse(jsonMatch[0]);
      return { success: true, analysis };
    } catch (parseError) {
      console.error("Error parsing invoice analysis:", parseError);
      return { success: false, error: "Could not parse analysis response" };
    }
  } catch (error) {
    console.error("Error analyzing invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error analyzing invoice",
    };
  }
}

/**
 * Generate a friendly response based on invoice analysis
 */
export function generateInvoiceResponseMessage(analysis: InvoiceAnalysis["analysis"], senderName?: string): string {
  if (!analysis || analysis.tipo === "desconocido") {
    return `He recibido tu imagen${senderName ? `, ${senderName}` : ""}! 📷 Nuestro equipo la revisará y te contactará pronto.`;
  }

  const greeting = senderName ? `¡Gracias por tu factura, ${senderName}! 📄` : "¡He recibido tu factura! 📄";

  let details = "";

  // Build details based on what we found
  if (analysis.tipo === "luz" || analysis.tipo === "gas") {
    const tipoEmoji = analysis.tipo === "luz" ? "⚡" : "🔥";
    details = `\n\n${tipoEmoji} Veo que es una factura de **${analysis.tipo.toUpperCase()}**`;

    if (analysis.compania) {
      details += ` de **${analysis.compania}**`;
    }
    details += ".";

    if (analysis.importe_total) {
      details += `\n💰 Importe: **${analysis.importe_total}**`;
    }
    if (analysis.consumo) {
      details += `\n📊 Consumo: ${analysis.consumo}`;
    }
    if (analysis.potencia_contratada) {
      details += `\n🔌 Potencia: ${analysis.potencia_contratada}`;
    }
    if (analysis.periodo) {
      details += `\n📅 Período: ${analysis.periodo}`;
    }
  } else if (analysis.tipo === "telefonia") {
    details = `\n\n📱 Veo que es una factura de **TELEFONÍA**`;
    if (analysis.compania) {
      details += ` de **${analysis.compania}**`;
    }
    details += ".";
    if (analysis.importe_total) {
      details += `\n💰 Importe: **${analysis.importe_total}**`;
    }
  } else {
    details = `\n\n📋 ${analysis.resumen}`;
  }

  const closing = "\n\n✅ Nuestro equipo analizará tu factura en detalle y te contactará pronto con las mejores opciones de ahorro. ¡Gracias por confiar en Cerecilla! 🍒";

  return greeting + details + closing;
}
