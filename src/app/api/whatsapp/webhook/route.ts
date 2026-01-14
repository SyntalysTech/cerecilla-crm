import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  generateAIResponse,
  getFallbackResponse,
  shouldAutoRespond,
  isAutoResponseEnabled,
  analyzeInvoiceImage,
  generateInvoiceResponseMessage,
  type ConversationMessage,
  type InvoiceAnalysis,
} from "@/lib/whatsapp/ai-responder";
import { sendTextMessage, formatPhoneNumber, type WhatsAppConfig } from "@/lib/whatsapp/client";

// Use service role for webhook (no user auth context)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Support both variable names for compatibility
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!;

const WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "cerecilla_webhook_2024";

// GET: Webhook verification (Meta calls this to verify the endpoint)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  console.log("WhatsApp webhook verification:", { mode, token, challenge });

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("Webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("Webhook verification failed");
  return new NextResponse("Forbidden", { status: 403 });
}

// POST: Receive incoming messages and status updates
export async function POST(request: NextRequest) {
  console.log("=== WHATSAPP WEBHOOK POST RECEIVED ===");
  console.log("Headers:", Object.fromEntries(request.headers.entries()));

  try {
    const body = await request.json();

    console.log("WhatsApp webhook body:", JSON.stringify(body, null, 2));

    // Meta sends notifications in this format
    const entry = body.entry?.[0];
    if (!entry) {
      return NextResponse.json({ status: "ok" });
    }

    const changes = entry.changes?.[0];
    if (!changes) {
      return NextResponse.json({ status: "ok" });
    }

    const value = changes.value;
    if (!value) {
      return NextResponse.json({ status: "ok" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    // Handle incoming messages
    if (value.messages) {
      for (const message of value.messages) {
        await handleIncomingMessage(supabase, value, message);
      }
    }

    // Handle status updates (sent, delivered, read)
    if (value.statuses) {
      for (const status of value.statuses) {
        await handleStatusUpdate(supabase, status);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function handleIncomingMessage(
  supabase: SupabaseClient,
  value: Record<string, unknown>,
  message: Record<string, unknown>
) {
  const contacts = value.contacts as Array<{ profile: { name: string }; wa_id: string }> | undefined;
  const contact = contacts?.[0];

  const phoneNumber = message.from as string;
  const messageId = message.id as string;
  const timestamp = message.timestamp as string;
  const messageType = message.type as string;

  let content = "";
  let mediaUrl = null;

  // Extract content based on message type
  switch (messageType) {
    case "text":
      content = (message.text as { body: string })?.body || "";
      break;
    case "image":
      content = "[Imagen]";
      mediaUrl = (message.image as { id: string })?.id;
      break;
    case "audio":
      content = "[Audio]";
      mediaUrl = (message.audio as { id: string })?.id;
      break;
    case "video":
      content = "[Video]";
      mediaUrl = (message.video as { id: string })?.id;
      break;
    case "document":
      content = "[Documento]";
      mediaUrl = (message.document as { id: string })?.id;
      break;
    case "location":
      const loc = message.location as { latitude: number; longitude: number } | undefined;
      content = `[Ubicacion: ${loc?.latitude}, ${loc?.longitude}]`;
      break;
    case "contacts":
      content = "[Contacto]";
      break;
    case "sticker":
      content = "[Sticker]";
      break;
    case "reaction":
      const reaction = message.reaction as { emoji: string } | undefined;
      content = `[Reaccion: ${reaction?.emoji}]`;
      break;
    case "button":
      content = (message.button as { text: string })?.text || "[Boton]";
      break;
    case "interactive":
      const interactive = message.interactive as { button_reply?: { title: string }; list_reply?: { title: string } } | undefined;
      content = interactive?.button_reply?.title || interactive?.list_reply?.title || "[Interactivo]";
      break;
    default:
      content = `[${messageType}]`;
  }

  // Try to find matching cliente by phone number
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre")
    .or(`telefono.ilike.%${cleanPhone.slice(-9)}%,telefono2.ilike.%${cleanPhone.slice(-9)}%`)
    .limit(1)
    .single();

  // Insert the received message
  const { error } = await supabase.from("whatsapp_messages").insert({
    cliente_id: cliente?.id || null,
    phone_number: phoneNumber,
    wamid: messageId,
    message_type: messageType,
    content: content,
    media_url: mediaUrl,
    direction: "incoming",
    status: "received",
    sender_name: contact?.profile?.name || null,
    received_at: timestamp ? new Date(parseInt(timestamp) * 1000).toISOString() : new Date().toISOString(),
  });

  if (error) {
    console.error("Error saving incoming message:", error);
  } else {
    console.log("Incoming message saved:", { phoneNumber, content, clienteId: cliente?.id });
  }

  // Auto-respond with AI if enabled
  const autoResponseEnabled = isAutoResponseEnabled();
  const shouldRespond = shouldAutoRespond(messageType, content);
  console.log("Auto-response check:", { autoResponseEnabled, shouldRespond, messageType, content });

  if (autoResponseEnabled && shouldRespond) {
    console.log("Triggering AI auto-response for:", phoneNumber);

    // Special handling for images and documents - analyze as potential invoice
    if ((messageType === "image" || messageType === "document") && mediaUrl) {
      console.log(`${messageType} received, attempting invoice analysis...`);
      await handleMediaMessage(
        supabase,
        phoneNumber,
        mediaUrl,
        messageType,
        contact?.profile?.name,
        cliente?.id,
        messageId
      );
    } else {
      await sendAIResponse(supabase, phoneNumber, content, contact?.profile?.name, cliente?.id);
    }
  }
}

async function handleStatusUpdate(
  supabase: SupabaseClient,
  status: Record<string, unknown>
) {
  const messageId = status.id as string;
  const statusValue = status.status as string;
  const timestamp = status.timestamp as string;

  const updateData: Record<string, unknown> = {
    status: statusValue,
  };

  // Set the appropriate timestamp based on status
  const isoTimestamp = timestamp ? new Date(parseInt(timestamp) * 1000).toISOString() : new Date().toISOString();

  switch (statusValue) {
    case "sent":
      updateData.sent_at = isoTimestamp;
      break;
    case "delivered":
      updateData.delivered_at = isoTimestamp;
      break;
    case "read":
      updateData.read_at = isoTimestamp;
      break;
    case "failed":
      const errors = status.errors as Array<{ code: number; title: string }> | undefined;
      if (errors && errors.length > 0) {
        updateData.error_code = String(errors[0].code);
        updateData.error_message = errors[0].title;
      }
      break;
  }

  const { error } = await supabase
    .from("whatsapp_messages")
    .update(updateData)
    .eq("wamid", messageId);

  if (error) {
    console.error("Error updating message status:", error);
  } else {
    console.log("Message status updated:", { messageId, status: statusValue });
  }
}

/**
 * Download media from WhatsApp using the Graph API
 */
async function downloadWhatsAppMedia(
  mediaId: string,
  accessToken: string
): Promise<{ success: boolean; url?: string; mimeType?: string; error?: string }> {
  try {
    // First, get the media URL from WhatsApp
    const mediaInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!mediaInfoResponse.ok) {
      const error = await mediaInfoResponse.text();
      console.error("Error getting media info:", error);
      return { success: false, error: "Could not get media info" };
    }

    const mediaInfo = await mediaInfoResponse.json();
    const mediaUrl = mediaInfo.url;
    const mimeType = mediaInfo.mime_type;

    console.log("Media info:", { mediaUrl, mimeType });

    // The URL returned is a direct download link that requires auth
    // We return this URL - it can be used to download the actual file
    return { success: true, url: mediaUrl, mimeType };
  } catch (error) {
    console.error("Error downloading media:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Download failed",
    };
  }
}

/**
 * Handle media messages (images and documents) - download, analyze as invoice, save to CRM
 */
async function handleMediaMessage(
  supabase: SupabaseClient,
  phoneNumber: string,
  whatsappMediaId: string,
  messageType: string,
  senderName?: string,
  clienteId?: string,
  messageWamid?: string
) {
  try {
    console.log(`Processing ${messageType} message:`, { phoneNumber, whatsappMediaId, senderName });

    // Get WhatsApp config for access token
    const { data: waConfig } = await supabase
      .from("configuracion_whatsapp")
      .select("phone_number_id, access_token, is_active")
      .limit(1)
      .single();

    if (!waConfig || !waConfig.is_active) {
      console.error("WhatsApp config not found or inactive");
      return;
    }

    // Download media URL from WhatsApp
    const mediaResult = await downloadWhatsAppMedia(whatsappMediaId, waConfig.access_token);

    if (!mediaResult.success || !mediaResult.url) {
      console.error("Failed to get media URL:", mediaResult.error);
      // Still send a generic response
      await sendAIResponse(supabase, phoneNumber, "[Imagen]", senderName, clienteId);
      return;
    }

    // Determine media type based on message type and mime type
    const mediaTypeForDb = messageType === "image" ? "image" : "document";

    // Download the actual media data first (so we can save it)
    const mediaResponse = await fetch(mediaResult.url, {
      headers: {
        Authorization: `Bearer ${waConfig.access_token}`,
      },
    });

    if (!mediaResponse.ok) {
      console.error(`Failed to download ${messageType}`);
      const fallbackContent = messageType === "image" ? "[Imagen]" : "[Documento]";
      await sendAIResponse(supabase, phoneNumber, fallbackContent, senderName, clienteId);
      return;
    }

    const mediaBuffer = await mediaResponse.arrayBuffer();
    const base64Media = Buffer.from(mediaBuffer).toString("base64");

    // Create a record in whatsapp_received_files WITH the file data
    const { data: fileRecord, error: fileError } = await supabase
      .from("whatsapp_received_files")
      .insert({
        cliente_id: clienteId || null,
        phone_number: phoneNumber,
        sender_name: senderName,
        whatsapp_media_id: whatsappMediaId,
        media_type: mediaTypeForDb,
        mime_type: mediaResult.mimeType,
        file_data_base64: base64Media, // Save the file data!
        status: "pending",
      })
      .select("id")
      .single();

    if (fileError) {
      console.error("Error creating file record:", fileError);
      // Still try to send a response even if DB insert fails
      const fallbackContent = messageType === "image" ? "[Imagen]" : "[Documento]";
      await sendAIResponse(supabase, phoneNumber, fallbackContent, senderName, clienteId);
      return;
    }

    if (!fileRecord) {
      console.error("No file record created");
      const fallbackContent = messageType === "image" ? "[Imagen]" : "[Documento]";
      await sendAIResponse(supabase, phoneNumber, fallbackContent, senderName, clienteId);
      return;
    }

    // Check if it's a PDF document
    const isPDF = messageType === "document" && mediaResult.mimeType === "application/pdf";

    // Create data URL for OpenAI API
    const mediaDataUrl = `data:${mediaResult.mimeType || (isPDF ? "application/pdf" : "image/jpeg")};base64,${base64Media}`;

    // Analyze the media with GPT-4 Vision/GPT-4o
    console.log(`Analyzing ${messageType} with GPT-4o${isPDF ? " (PDF)" : " (Vision)"}...`);
    const analysisResult = await analyzeInvoiceImage(mediaDataUrl);

    let responseText: string;
    let analysisData: InvoiceAnalysis["analysis"] | undefined;

    if (analysisResult.success && analysisResult.analysis) {
      analysisData = analysisResult.analysis;
      responseText = generateInvoiceResponseMessage(analysisData, senderName);
      console.log("Invoice analysis successful:", analysisData.tipo, analysisData.compania);
    } else {
      console.log("Invoice analysis failed or not a recognizable invoice");
      const mediaEmoji = messageType === "image" ? "📷" : "📄";
      const mediaName = messageType === "image" ? "imagen" : "documento";
      responseText = `He recibido tu ${mediaName}${senderName ? `, ${senderName}` : ""}! ${mediaEmoji} Nuestro equipo lo revisará y te contactará pronto.`;
    }

    // Update the file record with analysis results
    if (fileRecord?.id) {
      if (analysisData) {
        // Successfully analyzed
        await supabase
          .from("whatsapp_received_files")
          .update({
            status: "analyzed",
            ai_analysis: analysisData,
            analysis_type: "invoice",
            detected_tipo: analysisData.tipo,
            detected_compania: analysisData.compania || null,
            detected_importe: analysisData.importe_total || null,
            detected_cups: analysisData.cups || null,
            analyzed_at: new Date().toISOString(),
          })
          .eq("id", fileRecord.id);
      } else {
        // Analysis failed (e.g., PDF) - mark as pending review
        await supabase
          .from("whatsapp_received_files")
          .update({
            status: "pending",
            analyzed_at: new Date().toISOString(),
          })
          .eq("id", fileRecord.id);
      }
    }

    // Send the response
    const config: WhatsAppConfig = {
      phoneNumberId: waConfig.phone_number_id,
      accessToken: waConfig.access_token,
    };

    const sendResult = await sendTextMessage(config, {
      to: phoneNumber,
      text: responseText,
    });

    if (!sendResult.success) {
      console.error("Failed to send image analysis response:", sendResult.error);
      return;
    }

    console.log("Image analysis response sent successfully");

    // Save the outgoing message
    await supabase.from("whatsapp_messages").insert({
      cliente_id: clienteId || null,
      phone_number: formatPhoneNumber(phoneNumber),
      message_type: "text",
      content: responseText,
      direction: "outgoing",
      wamid: sendResult.messageId || null,
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_by: null,
    });

  } catch (error) {
    console.error(`Error handling ${messageType} message:`, error);
    // Fallback to generic response
    try {
      const fallbackContent = messageType === "image" ? "[Imagen]" : "[Documento]";
      await sendAIResponse(supabase, phoneNumber, fallbackContent, senderName, clienteId);
    } catch (fallbackError) {
      console.error("Fallback response also failed:", fallbackError);
    }
  }
}

/**
 * Send an AI-generated response to the incoming message
 */
async function sendAIResponse(
  supabase: SupabaseClient,
  phoneNumber: string,
  incomingContent: string,
  senderName?: string,
  clienteId?: string
) {
  try {
    console.log("Generating AI response for:", { phoneNumber, incomingContent, senderName });

    // Get conversation history (last 20 messages for context)
    const { data: historyData } = await supabase
      .from("whatsapp_messages")
      .select("content, direction, created_at")
      .eq("phone_number", phoneNumber)
      .order("created_at", { ascending: true })
      .limit(20);

    // Build conversation history for AI
    const conversationHistory: ConversationMessage[] = (historyData || [])
      .filter((msg) => msg.content && msg.content.trim() !== "")
      .map((msg) => ({
        role: msg.direction === "incoming" ? "user" : "assistant",
        content: msg.content,
      })) as ConversationMessage[];

    // Generate AI response
    const aiResult = await generateAIResponse(incomingContent, conversationHistory, senderName);

    let responseText: string;
    if (aiResult.success && aiResult.response) {
      responseText = aiResult.response;
      console.log("AI response generated:", responseText.substring(0, 100) + "...");
    } else {
      console.error("AI generation failed:", aiResult.error);
      responseText = getFallbackResponse();
    }

    // Get WhatsApp config from database
    const { data: waConfig } = await supabase
      .from("configuracion_whatsapp")
      .select("phone_number_id, access_token, is_active")
      .limit(1)
      .single();

    if (!waConfig || !waConfig.is_active) {
      console.error("WhatsApp config not found or inactive");
      return;
    }

    const config: WhatsAppConfig = {
      phoneNumberId: waConfig.phone_number_id,
      accessToken: waConfig.access_token,
    };

    // Send the response via WhatsApp
    const sendResult = await sendTextMessage(config, {
      to: phoneNumber,
      text: responseText,
    });

    if (!sendResult.success) {
      console.error("Failed to send AI response:", sendResult.error);
      return;
    }

    console.log("AI response sent successfully, messageId:", sendResult.messageId);

    // Save the outgoing message to database
    const { error: insertError } = await supabase.from("whatsapp_messages").insert({
      cliente_id: clienteId || null,
      phone_number: formatPhoneNumber(phoneNumber),
      message_type: "text",
      content: responseText,
      direction: "outgoing",
      wamid: sendResult.messageId || null,
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_by: null, // AI-generated, no user
    });

    if (insertError) {
      console.error("Error saving AI response to database:", insertError);
    }
  } catch (error) {
    console.error("Error in sendAIResponse:", error);
  }
}
