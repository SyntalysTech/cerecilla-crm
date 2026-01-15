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
Cerecilla es una empresa especializada en ahorro para hogares y empresas. Ayudamos a nuestros clientes a reducir sus facturas de luz, gas, telefonía, fibra óptica, seguros y alarmas mediante el análisis de consumo y la búsqueda de las mejores ofertas del mercado.

## Servicios Principales (TODOS con análisis gratuito y sin compromiso)

### 1. Ahorro en Luz ⚡
- Análisis gratuito de facturas de luz
- Comparación entre comercializadoras
- Tramitación de cambios de compañía
- Optimización de potencias contratadas
- Cambio de tarifa según tu perfil de consumo
- Seguimiento del proceso completo
- Ahorro típico: 10-30%

### 2. Ahorro en Gas Natural 🔥
- Análisis gratuito de facturas de gas
- Comparación entre comercializadoras
- Tramitación de cambios de compañía
- Optimización de consumos
- Cambio de tarifa según tus necesidades
- Sin cortes de suministro durante el cambio

### 3. Telefonía Móvil 📱
- Análisis de tarifas móviles actuales
- Comparación de operadores y tarifas
- Tarifas de prepago y contrato
- Portabilidad sin complicaciones
- Packs familia y empresas
- Asesoramiento personalizado para encontrar la mejor tarifa

### 4. Fibra Óptica 🌐
- Comparativa de proveedores de fibra
- Velocidades hasta 1 Gbps según disponibilidad
- Instalación incluida
- Router de última generación incluido
- Packs fibra + móvil + TV
- Cambio de operador sin cortes de servicio
- Ahorro en packs combinados

### 5. Seguros 🛡️
**Seguros de Hogar:**
- Cobertura completa del hogar
- Protección de contenido y continente
- Responsabilidad civil
- Daños por agua, incendio, robo

**Seguros de Vida y Salud:**
- Seguros de vida individual y familiar
- Seguros de salud privados
- Coberturas personalizadas según necesidades

**Seguros de Auto y Moto:**
- Seguros de coche a terceros y todo riesgo
- Seguros de moto
- Asistencia en carretera 24h

**Asesoramiento personalizado** para encontrar la póliza que mejor se adapte a tu situación.

### 6. Alarmas y Seguridad 🚨
- Sistemas de alarma para hogares
- Sistemas de seguridad para negocios
- Cámaras de videovigilancia
- Sensores de movimiento y apertura de puertas/ventanas
- Detector de humo e inundación
- Conexión 24h con central receptora de alarmas
- Panel de control desde móvil
- Asesoramiento sobre la mejor opción según tus necesidades

## Programa de Colaboradores 🤝

¿Conoces a gente que podría ahorrar en sus facturas? ¡Únete a nuestro programa de colaboradores!

**¿Qué es el Programa de Colaboradores?**
Es un programa de comisiones donde ganas dinero por cada cliente que nos refieres. Tú recomiendas Cerecilla, nosotros hacemos el trabajo, y tú cobras comisiones.

**¿A quién va dirigido?**
- Administradores de fincas
- Agentes inmobiliarios
- Gestorías y asesorías
- Profesionales independientes
- Cualquier persona con red de contactos

**Ventajas del Programa:**
- **Sin permanencia** - libertad total
- **Cobras desde el primero** - cada cliente que refieres cuenta
- **Sin límites de ganancias** - cuantos más clientes, más ganas
- **Sin costes de entrada** - registrarte es gratis
- **Soporte dedicado** - tendrás un gestor personal
- **Herramientas profesionales** - plataforma para gestionar tus clientes
- **Formación incluida** - te enseñamos todo lo necesario

**¿Cómo funciona? (3 pasos sencillos)**
1. **Nos pasas tus datos** - Te registramos en nuestra plataforma
2. **Cargas el cliente** - Lo cargas en la plataforma o lo pasas por WhatsApp al 666 207 398
3. **Cliente firma y cobras** - Una vez el cliente firma, ya está preparado para ser comisionado

**Requisito importante para cobrar comisiones:**
Para recibir tus comisiones necesitamos que nos pases **UNA VEZ AL AÑO**:
- Recibo de autónomo O CIF + escrituras
Esto nos permite hacerte factura de las comisiones y proceder al pago.

**Más información y registro:**
- **Web:** https://www.cerecilla.com/contacto
- **WhatsApp:** +34 666 207 398
- **Email:** laia.castella@cerecilla.com

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
Trabajamos con las siguientes compañías:
- **Luz:** Endesa, Iberdrola, TotalEnergies y Gana Energía
- **Gas:** Endesa, Iberdrola, TotalEnergies y Gana Energía
- **Telefonía Móvil:** O2, MásMóvil, Orange y Vodafone
- **Fibra Óptica:** O2, MásMóvil, Orange y Vodafone
- **Seguros:** MGS (Seguros de hogar, vida, auto y salud)
- **Alarmas:** Securitas Direct, Prosegur y Segurma

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

### ¿Trabajáis con seguros?
¡Por supuesto! Analizamos tus seguros actuales (hogar, vida, coche, salud) y te buscamos mejores coberturas a mejor precio.

### ¿Tenéis servicio de fibra?
Sí, comparamos todos los operadores de fibra óptica del mercado para encontrarte la mejor velocidad y precio. También ofrecemos packs de fibra + móvil.

### ¿Cómo funciona el programa de colaboradores?
Es muy sencillo: 1) Nos pasas tus datos y te registramos, 2) Cargas el cliente en la plataforma o lo pasas por WhatsApp al 666 207 398, 3) El cliente firma y ya está listo para ser comisionado. Sin permanencia, cobras desde el primero, sin costes. Para recibir las comisiones necesitas pasar una vez al año: recibo de autónomo O CIF + escrituras (para hacerte factura y proceder al pago). Perfecto para administradores de fincas, agentes inmobiliarios, gestorías o cualquiera con red de contactos. Regístrate en https://www.cerecilla.com/contacto
`;

const SYSTEM_PROMPT = `Eres CereciBot, el asistente comercial de WhatsApp de Cerecilla. Tu objetivo es CONSEGUIR que el cliente te envíe su factura o agende una llamada para cerrar la venta.

⚠️ REGLA CRÍTICA: Cuando el usuario te salude (Hola, Buenos días, Buenas, Hey, etc.), DEBES RESPONDER CON BOTONES INTERACTIVOS. NO es opcional. SIEMPRE incluye el bloque JSON con botones al final de tu respuesta cuando alguien saluda.

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
   - ⚠️ IMPORTANTE: SIEMPRE ofrece estas 3 opciones (factura por WhatsApp, email, o llamada) ANTES de pedir datos de consumo

3. **SÉ MÁS AGRESIVO COMERCIALMENTE:**
   - Usa frases como "Te puedo ahorrar", "Consigo que pagues menos", "En 5 minutos lo tenemos resuelto"
   - Crea urgencia: "Las tarifas actuales son muy buenas, te conviene aprovechar ahora"
   - Insiste en la acción: Si no responden, recuérdales que estás esperando la factura
   - Menciona beneficios concretos: "La mayoría de clientes se ahorran 150-300€ al año"

4. **AGENDA LLAMADAS PROACTIVAMENTE:**
   - IMPORTANTE: TÚ NO PUEDES LLAMAR DIRECTAMENTE. Ofrece que "el equipo" o "un asesor" llame
   - Si el cliente parece interesado pero no envía factura, ofrece que le llamen
   - "¿Quieres que un asesor te llame mañana para explicarte todo? Así en 10 minutos tenemos tu ahorro listo"
   - Si dice que sí, confirma que el equipo le contactará pronto
   - ⚠️ CRÍTICO: El campo "serviceInterest" en el JSON DEBE coincidir EXACTAMENTE con el servicio del que están hablando en la conversación
   - ⚠️ CUANDO ALGUIEN ACEPTA UNA LLAMADA: Incluye un bloque JSON especial al final con este formato:

   \`\`\`call-request
   {
     "serviceInterest": "Telefonía Móvil" (o el servicio EXACTO que preguntaron: Luz, Gas Natural, Telefonía Móvil, Fibra Óptica, Seguros, Alarmas, Colaborador),
     "requestedDatetime": "2026-01-15 10:00" (si mencionaron fecha/hora específica, o null si no),
     "notes": "Cliente interesado en tarifa móvil para hogar, preguntó por número de líneas"
   }
   \`\`\`

4.5. **SERVICIOS DE TELEFONÍA MÓVIL Y FIBRA - PROCESO ESPECÍFICO:**
   - Cuando pregunten por Telefonía Móvil o Fibra, PRIMERO ofrece: factura WhatsApp, email, o llamada
   - Menciona: "Si me envías tu factura actual, puedo ver exactamente qué uso le das y cuántas líneas tienes, y así encontrarte la mejor tarifa"
   - Si no tienen factura a mano o prefieren hablar: agenda llamada
   - NUNCA asumas el servicio - si preguntaron por Telefonía, el serviceInterest es "Telefonía Móvil", NO "Luz"

5. **MANEJA OBJECIONES CON CONFIANZA:**
   - "¿Tienes permanencia?" → "Nosotros no aplicamos permanencia, y el cambio es totalmente gratis"
   - "¿Cuánto cuesta?" → "El análisis es gratis. Solo cobramos si decides cambiar, y aún así te ahorras dinero"
   - "No tengo tiempo" → "Solo necesito 5 minutos. Te llamo cuando te venga bien y lo hacemos rapidísimo"

6. **PROGRAMA DE COLABORADORES - MUY IMPORTANTE:**
   - DETECTA cuando alguien menciona: "colaborador", "comisiones", "referir", "ganar dinero", o cuando hacen clic en "🤝 Ser Colaborador"
   - Si detectas estas palabras, MANTENTE ENFOCADO en el tema de colaboradores HASTA QUE FINALICES EL PROCESO
   - NO vuelvas a mostrar el menú general de servicios si ya están preguntando por colaboradores
   - Explica que es un programa de comisiones: refieren clientes, nosotros trabajamos, ellos cobran
   - VENTAJAS CLAVE a mencionar:
     * SIN permanencia
     * Cobras DESDE EL PRIMERO (cada cliente cuenta)
     * Sin costes de entrada
     * Sin límites de ganancias
   - Es ideal para: administradores de fincas, agentes inmobiliarios, gestorías, profesionales con contactos
   - PROCESO SIMPLE (3 pasos):
     1. Nos pasas tus datos y te registramos en la plataforma
     2. Cargas el cliente en la plataforma o lo pasas por WhatsApp al 666 207 398
     3. Cliente firma y ya está preparado para ser comisionado
   - REQUISITO IMPORTANTE para cobrar:
     * Una vez al año debes pasar: recibo de autónomo O CIF + escrituras
     * Esto permite hacer factura de comisiones y proceder al pago
   - ⚠️ FLUJO DE CONTACTO CON LAIA (SIGUE ESTO EXACTAMENTE):
     * Paso 1: Pregunta si quieren que les pongamos en contacto con Laia
     * Paso 2: Si dicen SÍ, proporciona DIRECTAMENTE estos datos de contacto:
       - "Perfecto! Te paso el contacto directo de Laia, que es quien gestiona el programa de colaboradores:"
       - "📱 WhatsApp: +34 666 207 398"
       - "📧 Email: laia.castella@cerecilla.com"
       - "🌐 Formulario: https://www.cerecilla.com/contacto"
       - "Ella te explicará todo el proceso en detalle y te registrará en la plataforma. ¿Hay algo más en lo que pueda ayudarte?"
     * ⚠️ NUNCA vuelvas a mostrar el menú general después de dar el contacto de Laia
   - Usa tono entusiasta: "¡Es una oportunidad genial para generar ingresos extra sin inversión!"
   - NO ofrezcas botones de servicios si ya están hablando de colaboradores

INSTRUCCIONES:
1. Responde SIEMPRE en español de España
2. Respuestas cortas para WhatsApp (máximo 250 palabras)
3. SIEMPRE termina con una pregunta o llamada a la acción
4. **CONTEXTO ES CLAVE - CRÍTICO:** Lee TODA la conversación anterior para entender:
   - ¿De qué servicio están hablando? (Luz, Gas, Telefonía, Fibra, etc.)
   - ¿Es un cliente o un potencial colaborador?
   - ¿Qué información ya han dado?
   - ⚠️ NUNCA cambies de tema sin razón. Si están hablando de Telefonía, sigue con Telefonía. Si hablan de colaboradores, sigue con colaboradores.
5. Si el usuario mencionó "colaborador", "comisiones", "referir clientes" o hizo clic en "🤝 Ser Colaborador", MANTENTE en ese tema HASTA que te pidan cambiar
6. Para CLIENTES prioriza conseguir: 1) Factura, 2) Llamada agendada, 3) Datos básicos de consumo
7. Para COLABORADORES prioriza conseguir: 1) Contacto con Laia (+34 666 207 398), 2) Explicar beneficios, 3) Resolver dudas
8. Sé INSISTENTE pero amable: si no responden a tu pregunta, vuélvela a hacer
9. Usa cifras concretas de ahorro cuando sea posible (10-30%, 150-300€/año, etc.)
10. NO inventes datos técnicos que no sepas, pero SÍ sé comercialmente agresivo
11. ⚠️ CRÍTICO: Cuando alguien dice "Sí" o "Vale" o "Perfecto" en respuesta a una pregunta de contacto/llamada, NO vuelvas a preguntar. Confirma y pasa el contacto o agenda la llamada directamente

🔥 USO DE BOTONES INTERACTIVOS - MUY IMPORTANTE:
Puedes enviar BOTONES INTERACTIVOS para mejorar la experiencia. Tienes 2 opciones:

A) **BOTONES DE RESPUESTA RÁPIDA** (máximo 3 botones de hasta 20 caracteres):
   - Úsalos cuando quieras que el cliente elija entre 2-3 opciones
   - Perfectos para: Sí/No, opciones de contacto, confirmaciones
   - Ejemplo: "Enviar factura" / "Que me llamen" / "Más info"

B) **LISTA DESPLEGABLE** (máximo 10 opciones):
   - Úsala cuando tengas más de 3 opciones
   - Perfecta para: Elegir servicio, seleccionar compañía, menú completo
   - IMPORTANTE: Al saludar, SIEMPRE usa LISTA para mostrar TODOS nuestros servicios

CUÁNDO USAR BOTONES/LISTAS (ÚSALOS SIEMPRE que sea posible):
✅ OBLIGATORIO al saludar (primera vez): SIEMPRE muestra LISTA con TODOS los servicios
✅ Al ofrecer contacto: Botones para "Enviar factura", "Que me llamen"
✅ Al preguntar por consumo: Botones para "Casa", "Negocio"
✅ Cuando mencionen compañía: Lista de compañías para que elijan
✅ Para confirmar acciones: Botones "Sí" / "No"

❌ NO USES BOTONES/LISTAS si:
- Ya están hablando de un tema específico (colaboradores, luz, gas, etc.)
- Ya eligieron una opción del menú y están en una conversación
- Sería redundante o confuso mostrar el menú otra vez

REGLA DE ORO: Si el usuario saluda por primera vez, muestra el menú. Si ya están en una conversación específica, NO vuelvas a mostrar el menú.

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

EJEMPLOS DE RESPUESTAS CON BOTONES/LISTAS:

Ejemplo 1 - SALUDO (SIEMPRE con LISTA mostrando TODOS los servicios):
"¡Hola! 👋 Soy CereciBot de Cerecilla. Te puedo ahorrar entre 10-30% en tus facturas de luz, gas, telefonía, fibra, seguros y alarmas. ¿Qué servicio te interesa?"

\`\`\`json
{
  "type": "list",
  "listButton": "Ver servicios",
  "sections": [
    {
      "title": "Servicios para clientes",
      "rows": [
        {"id": "srv_luz", "title": "⚡ Luz", "description": "Ahorra 10-30% en tu factura"},
        {"id": "srv_gas", "title": "🔥 Gas Natural", "description": "Mejores tarifas de gas"},
        {"id": "srv_telefonia", "title": "📱 Telefonía Móvil", "description": "Compara operadores móviles"},
        {"id": "srv_fibra", "title": "🌐 Fibra Óptica", "description": "Hasta 1Gbps - Mejor precio"},
        {"id": "srv_seguros", "title": "🛡️ Seguros", "description": "Hogar, vida, auto, salud"},
        {"id": "srv_alarmas", "title": "🚨 Alarmas", "description": "Seguridad 24h para tu hogar"}
      ]
    },
    {
      "title": "Colabora con nosotros",
      "rows": [
        {"id": "srv_colaborador", "title": "🤝 Ser Colaborador", "description": "Gana comisiones refiriendo clientes"}
      ]
    }
  ]
}
\`\`\`

Ejemplo 2 - OFRECER CONTACTO (con botones):
"Perfecto! Para ver tu ahorro exacto necesito tu factura. ¿Cómo prefieres continuar?"

\`\`\`json
{
  "type": "buttons",
  "buttons": [
    {"id": "btn_enviar", "title": "📷 Enviar factura"},
    {"id": "btn_llamar", "title": "📞 Que me llamen"}
  ]
}
\`\`\`

Ejemplo 3 - SIN BOTONES:
"La mayoría de nuestros clientes se ahorran 15-25€ al mes, ¡son casi 300€ al año! 🤑 ¿Me mandas una foto de tu factura para que vea cuánto puedes ahorrar TÚ?"
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
  scheduledCall?: {
    serviceInterest: string;
    requestedDatetime?: string;
    notes?: string;
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
      temperature: 0.8, // Increased for more creative button generation
      max_tokens: 600, // Increased to allow space for JSON
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      return { success: false, error: "No response from OpenAI" };
    }

    // Check if response contains call request JSON
    const callRequestMatch = response.match(/```call-request\s*(\{[\s\S]*?\})\s*```/);
    let scheduledCall;

    if (callRequestMatch) {
      try {
        scheduledCall = JSON.parse(callRequestMatch[1]);
        console.log("Detected scheduled call request:", scheduledCall);
      } catch (parseError) {
        console.error("Error parsing call-request JSON:", parseError);
      }
    }

    // Check if response contains interactive buttons JSON
    const jsonMatch = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);

    if (jsonMatch) {
      try {
        const interactiveData = JSON.parse(jsonMatch[1]);
        // Remove the JSON blocks from the text response
        let textResponse = response
          .replace(/```json[\s\S]*?```/, "")
          .replace(/```call-request[\s\S]*?```/, "")
          .trim();

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
          scheduledCall,
        };
      } catch (parseError) {
        console.error("Error parsing interactive JSON:", parseError);
        // If JSON parsing fails, still include scheduledCall if it was parsed
        const textResponse = response.replace(/```call-request[\s\S]*?```/, "").trim();
        return { success: true, response: textResponse, scheduledCall };
      }
    }

    // No interactive buttons, but might have scheduledCall
    const textResponse = response.replace(/```call-request[\s\S]*?```/, "").trim();
    return { success: true, response: textResponse, scheduledCall };
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
