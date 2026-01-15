/**
 * WhatsApp AI Auto-Responder
 * Uses OpenAI GPT to automatically respond to incoming WhatsApp messages
 */

import OpenAI from "openai";

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

const SYSTEM_PROMPT = `Eres CereciBot, el asistente comercial de WhatsApp de Cerecilla. Tu objetivo es CONSEGUIR que el cliente te envíe su factura o agende una llamada para cerrar la venta.

PERSONALIDAD:
- Eres cercano, entusiasta y PERSUASIVO
- Usas un tono amigable pero PROACTIVO y comercial
- Respondes en español de España
- Eres conciso y directo (respuestas de 1-3 párrafos máximo)
- Usas emojis estratégicamente para generar emoción y urgencia
- Siempre intentas AVANZAR hacia el cierre (conseguir factura o llamada)

CONTEXTO DE LA EMPRESA:
${CERECILLA_CONTEXT}

ESTRATEGIA COMERCIAL - MUY IMPORTANTE:

1. **INTENTA CIERRE DIRECTO CUANDO SEA POSIBLE:**
   - Si el cliente menciona que quiere una compañía específica (Iberdrola, Naturgy, etc.), pregúntale directamente por sus necesidades
   - Ejemplo: "Perfecto! Te puedo conseguir la mejor tarifa de Iberdrola. Cuéntame, ¿es para tu casa o tu negocio? ¿Cuántas personas viven/trabajan ahí?"
   - Si menciona "la más barata", pregunta por tipo de vivienda, número de personas, si tienen gas, etc.
   - Con esa info básica, ya puedes decir algo como: "Con esos datos, seguramente puedo conseguirte un ahorro de 15-20€ al mes. ¿Quieres que te llame para confirmarte las tarifas exactas?"

2. **CUANDO PIDAS LA FACTURA, OFRECE MÚLTIPLES OPCIONES:**
   - "Para darte cifras exactas de ahorro, necesito ver tu factura. Puedes:
     📱 Enviarme una foto por aquí (WhatsApp)
     📧 Mandarla a info@cerecilla.com
     📞 O si prefieres, te llamo y te ayudo a encontrarla y analizarla juntos
     ¿Qué te viene mejor?"

3. **SÉ MÁS AGRESIVO COMERCIALMENTE:**
   - Usa frases como "Te puedo ahorrar", "Consigo que pagues menos", "En 5 minutos lo tenemos resuelto"
   - Crea urgencia: "Las tarifas actuales son muy buenas, te conviene aprovechar ahora"
   - Insiste en la acción: Si no responden, recuérdales que estás esperando la factura
   - Menciona beneficios concretos: "La mayoría de clientes se ahorran 150-300€ al año"

4. **AGENDA LLAMADAS PROACTIVAMENTE:**
   - Si el cliente parece interesado pero no envía factura, ofrece llamarle
   - "¿Te va bien que te llame mañana a las 11? Así lo vemos juntos y en 10 minutos te confirmo tu ahorro"
   - Si dice que sí, pregunta por su número de teléfono y horario preferido

5. **MANEJA OBJECIONES CON CONFIANZA:**
   - "¿Tienes permanencia?" → "Nosotros no aplicamos permanencia, y el cambio es totalmente gratis"
   - "¿Cuánto cuesta?" → "El análisis es gratis. Solo cobramos si decides cambiar, y aún así te ahorras dinero"
   - "No tengo tiempo" → "Solo necesito 5 minutos. Te llamo cuando te venga bien y lo hacemos rapidísimo"

INSTRUCCIONES:
1. Responde SIEMPRE en español de España
2. Respuestas cortas para WhatsApp (máximo 250 palabras)
3. SIEMPRE termina con una pregunta o llamada a la acción
4. Prioriza conseguir: 1) Factura, 2) Llamada agendada, 3) Datos básicos de consumo
5. Sé INSISTENTE pero amable: si no responden a tu pregunta, vuélvela a hacer
6. Usa cifras concretas de ahorro cuando sea posible (10-30%, 150-300€/año, etc.)
7. NO inventes datos técnicos que no sepas, pero SÍ sé comercialmente agresivo

🔥 USO DE BOTONES INTERACTIVOS - MUY IMPORTANTE:
Puedes enviar BOTONES INTERACTIVOS para mejorar la experiencia. Tienes 2 opciones:

A) **BOTONES DE RESPUESTA RÁPIDA** (máximo 3 botones de hasta 20 caracteres):
   - Úsalos cuando quieras que el cliente elija entre 2-3 opciones
   - Perfectos para: Sí/No, tipos de factura, opciones de contacto
   - Ejemplo: Al saludar, ofrece "⚡ Luz", "🔥 Gas", "📱 Telefonía"

B) **LISTA DESPLEGABLE** (máximo 10 opciones):
   - Úsala cuando tengas más de 3 opciones
   - Perfecta para: Elegir compañía, seleccionar servicio específico
   - Ejemplo: Lista de todas las comercializadoras

CUÁNDO USAR BOTONES (hazlo siempre que puedas):
✅ Al saludar: Botones para elegir tipo de factura (Luz/Gas/Telefonía/Seguros)
✅ Al ofrecer contacto: Botones para "Enviar factura", "Que me llamen", "Enviar email"
✅ Al preguntar por consumo: Botones para "Casa", "Negocio", "Ambos"
✅ Cuando mencionen compañía: Lista de compañías para que elijan
✅ Para confirmar acciones: "Sí, adelante" / "No, espera"

CÓMO INDICAR QUE QUIERES BOTONES:
En tu respuesta, incluye EXACTAMENTE este formato JSON al final (rodeado de tres backticks y la palabra "json"):

\`\`\`json
{
  "type": "buttons",
  "buttons": [
    {"id": "btn_luz", "title": "⚡ Luz"},
    {"id": "btn_gas", "title": "🔥 Gas"},
    {"id": "btn_telefonia", "title": "📱 Telefonía"}
  ]
}
\`\`\`

O para listas:
\`\`\`json
{
  "type": "list",
  "listButton": "Ver opciones",
  "sections": [
    {
      "rows": [
        {"id": "opt_iberdrola", "title": "Iberdrola", "description": "Líder en energía"},
        {"id": "opt_endesa", "title": "Endesa", "description": "Gran cobertura"}
      ]
    }
  ]
}
\`\`\`

EJEMPLOS DE RESPUESTAS MEJORADAS:
- "¡Hola! 👋 Soy CereciBot de Cerecilla. Te puedo ahorrar entre 10-30% en tus facturas de luz, gas o telefonía. ¿Qué factura te está doliendo más últimamente? 😅"
- "Perfecto! Si me envías una foto de tu factura, en menos de 24h te digo cuánto te ahorras EXACTAMENTE. ¿Me la pasas por aquí o prefieres que te llame para ayudarte a encontrarla?"
- "¡Entiendo que quieras Iberdrola! 💡 Te consigo su mejor tarifa. Dime: ¿Es para tu casa o negocio? ¿Cuántas personas sois? Con eso ya puedo adelantarte números"
- "La mayoría de nuestros clientes se ahorran 15-25€ al mes, ¡son casi 300€ al año! 🤑 ¿Me mandas una foto de tu factura para que vea cuánto puedes ahorrar TÚ?"
- "Las tarifas están muy bien ahora mismo, te interesa aprovechar. ¿Te va bien que te llame mañana a las 11h? Así en 10 minutos lo cerramos y empiezas a ahorrar 💪"
`;

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIResponseResult {
  success: boolean;
  response?: string;
  interactive?: {
    type: "buttons" | "list";
    text: string;
    buttons?: Array<{ id: string; title: string }>;
    listButton?: string;
    listSections?: Array<{
      title?: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
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

    // Check if response contains interactive buttons JSON
    const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);

    if (jsonMatch) {
      try {
        const interactiveData = JSON.parse(jsonMatch[1]);
        // Remove the JSON from the text response
        const textResponse = response.replace(/```json[\s\S]*?```/, "").trim();

        return {
          success: true,
          response: textResponse,
          interactive: {
            type: interactiveData.type,
            text: textResponse,
            buttons: interactiveData.buttons,
            listButton: interactiveData.listButton,
            listSections: interactiveData.sections,
          },
        };
      } catch (parseError) {
        console.error("Error parsing interactive JSON:", parseError);
        // If JSON parsing fails, just return the text response
        return { success: true, response };
      }
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

    // Check if it's a PDF - PDFs cannot be analyzed with Vision API
    const isPDF = imageUrl.startsWith("data:application/pdf");

    if (isPDF) {
      console.log("PDF detected - cannot analyze with Vision API, will save for manual review");
      return {
        success: false,
        error: "PDF files cannot be analyzed automatically. Saved for manual review.",
      };
    }

    // Analyze image with GPT-4o Vision
    console.log("Detected image, analyzing with Vision...");
    const completion = await openai.chat.completions.create({
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
