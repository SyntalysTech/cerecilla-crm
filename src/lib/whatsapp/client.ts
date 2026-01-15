/**
 * WhatsApp Business Cloud API Client
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_API_VERSION = "v18.0";
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
}

export interface TemplateComponent {
  type: "header" | "body" | "button";
  sub_type?: "quick_reply" | "url";
  index?: number;
  parameters: TemplateParameter[];
}

export interface TemplateParameter {
  type: "text" | "image" | "document" | "video";
  text?: string;
  image?: { link: string };
  document?: { link: string; filename?: string };
  video?: { link: string };
}

export interface SendTemplateOptions {
  to: string; // Phone number with country code (e.g., "34643879149")
  templateName: string;
  languageCode?: string;
  components?: TemplateComponent[];
}

export interface SendTextOptions {
  to: string;
  text: string;
  previewUrl?: boolean;
}

export interface InteractiveButton {
  type: "reply";
  reply: {
    id: string;
    title: string; // Max 20 characters
  };
}

export interface InteractiveListSection {
  title?: string; // Max 24 characters
  rows: Array<{
    id: string;
    title: string; // Max 24 characters
    description?: string; // Max 72 characters
  }>;
}

export interface SendInteractiveButtonsOptions {
  to: string;
  text: string;
  buttons: InteractiveButton[]; // Max 3 buttons
  header?: string;
  footer?: string;
}

export interface SendInteractiveListOptions {
  to: string;
  text: string;
  buttonText: string; // Max 20 characters
  sections: InteractiveListSection[]; // Max 10 rows total
  header?: string;
  footer?: string;
}

export interface SendInteractiveCTAOptions {
  to: string;
  text: string;
  buttons: Array<{
    type: "phone_number" | "url";
    phone_number?: string;
    url?: string;
    text: string; // Max 20 characters
  }>;
  header?: string;
  footer?: string;
}

export interface SendMediaOptions {
  to: string;
  type: "image" | "document" | "video" | "audio";
  mediaUrl: string;
  caption?: string;
  filename?: string;
}

export interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

/**
 * Format phone number to WhatsApp format (remove + and spaces)
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 00, remove it
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }

  // If Spanish number without country code, add 34
  if (cleaned.length === 9 && (cleaned.startsWith("6") || cleaned.startsWith("7"))) {
    cleaned = "34" + cleaned;
  }

  return cleaned;
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  // Spanish mobile numbers: 34 + 9 digits starting with 6 or 7
  // Also allow other country codes
  return formatted.length >= 10 && formatted.length <= 15;
}

/**
 * Send a template message
 */
export async function sendTemplateMessage(
  config: WhatsAppConfig,
  options: SendTemplateOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = config;
  const { to, templateName, languageCode = "es", components } = options;

  const formattedPhone = formatPhoneNumber(to);

  if (!isValidPhoneNumber(to)) {
    return { success: false, error: "Número de teléfono inválido" };
  }

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
    },
  };

  if (components && components.length > 0) {
    (body.template as Record<string, unknown>).components = components;
  }

  try {
    const response = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      return {
        success: false,
        error: error.error?.message || "Error desconocido al enviar mensaje",
      };
    }

    const result = data as WhatsAppMessageResponse;
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

/**
 * Send a text message (requires 24h window)
 */
export async function sendTextMessage(
  config: WhatsAppConfig,
  options: SendTextOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = config;
  const { to, text, previewUrl = false } = options;

  const formattedPhone = formatPhoneNumber(to);

  if (!isValidPhoneNumber(to)) {
    return { success: false, error: "Número de teléfono inválido" };
  }

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "text",
    text: {
      preview_url: previewUrl,
      body: text,
    },
  };

  try {
    const response = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      return {
        success: false,
        error: error.error?.message || "Error desconocido al enviar mensaje",
      };
    }

    const result = data as WhatsAppMessageResponse;
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

/**
 * Send a media message (image, document, video)
 */
export async function sendMediaMessage(
  config: WhatsAppConfig,
  options: SendMediaOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = config;
  const { to, type, mediaUrl, caption, filename } = options;

  const formattedPhone = formatPhoneNumber(to);

  if (!isValidPhoneNumber(to)) {
    return { success: false, error: "Número de teléfono inválido" };
  }

  const mediaObject: Record<string, string> = { link: mediaUrl };
  if (caption) mediaObject.caption = caption;
  if (filename && type === "document") mediaObject.filename = filename;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type,
    [type]: mediaObject,
  };

  try {
    const response = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      return {
        success: false,
        error: error.error?.message || "Error desconocido al enviar mensaje",
      };
    }

    const result = data as WhatsAppMessageResponse;
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

/**
 * Get business profile
 */
export async function getBusinessProfile(config: WhatsAppConfig): Promise<{
  success: boolean;
  profile?: {
    about?: string;
    address?: string;
    description?: string;
    email?: string;
    vertical?: string;
    websites?: string[];
  };
  error?: string;
}> {
  const { phoneNumberId, accessToken } = config;

  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,vertical,websites`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      return {
        success: false,
        error: error.error?.message || "Error al obtener perfil",
      };
    }

    return {
      success: true,
      profile: data.data?.[0] || {},
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

/**
 * Get message templates from Meta
 */
export async function getMessageTemplates(
  businessAccountId: string,
  accessToken: string
): Promise<{
  success: boolean;
  templates?: Array<{
    id: string;
    name: string;
    status: string;
    category: string;
    language: string;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${WHATSAPP_API_BASE}/${businessAccountId}/message_templates?fields=id,name,status,category,language`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      return {
        success: false,
        error: error.error?.message || "Error al obtener plantillas",
      };
    }

    return {
      success: true,
      templates: data.data || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

/**
 * Build template components from variables
 */
export function buildTemplateComponents(
  variables: Record<string, string>,
  variableMapping: string[]
): TemplateComponent[] {
  const parameters: TemplateParameter[] = variableMapping.map((varName) => ({
    type: "text" as const,
    text: variables[varName] || "",
  }));

  if (parameters.length === 0) return [];

  return [
    {
      type: "body",
      parameters,
    },
  ];
}

/**
 * Send an interactive message with reply buttons (max 3 buttons)
 * BRUTAL: Quick reply buttons for fast user interaction
 */
export async function sendInteractiveButtons(
  config: WhatsAppConfig,
  options: SendInteractiveButtonsOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = config;
  const { to, text, buttons, header, footer } = options;

  const formattedPhone = formatPhoneNumber(to);

  if (!isValidPhoneNumber(to)) {
    return { success: false, error: "Número de teléfono inválido" };
  }

  if (buttons.length === 0 || buttons.length > 3) {
    return { success: false, error: "Debe haber entre 1 y 3 botones" };
  }

  const interactiveBody: Record<string, unknown> = {
    type: "button",
    body: { text },
    action: {
      buttons: buttons.map((btn) => ({
        type: "reply",
        reply: {
          id: btn.reply.id,
          title: btn.reply.title.substring(0, 20), // Max 20 chars
        },
      })),
    },
  };

  if (header) {
    (interactiveBody as Record<string, unknown>).header = {
      type: "text",
      text: header,
    };
  }

  if (footer) {
    (interactiveBody as Record<string, unknown>).footer = {
      text: footer,
    };
  }

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "interactive",
    interactive: interactiveBody,
  };

  try {
    const response = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      console.error("WhatsApp Interactive Buttons Error:", error);
      return {
        success: false,
        error: error.error?.message || "Error al enviar botones",
      };
    }

    const result = data as WhatsAppMessageResponse;
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

/**
 * Send an interactive message with a list (max 10 options)
 * BRUTAL: Dropdown list for multiple options without cluttering the chat
 */
export async function sendInteractiveList(
  config: WhatsAppConfig,
  options: SendInteractiveListOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = config;
  const { to, text, buttonText, sections, header, footer } = options;

  const formattedPhone = formatPhoneNumber(to);

  if (!isValidPhoneNumber(to)) {
    return { success: false, error: "Número de teléfono inválido" };
  }

  const totalRows = sections.reduce((sum, section) => sum + section.rows.length, 0);
  if (totalRows === 0 || totalRows > 10) {
    return { success: false, error: "Debe haber entre 1 y 10 opciones en total" };
  }

  const interactiveBody: Record<string, unknown> = {
    type: "list",
    body: { text },
    action: {
      button: buttonText.substring(0, 20), // Max 20 chars
      sections: sections.map((section) => ({
        title: section.title?.substring(0, 24), // Max 24 chars
        rows: section.rows.map((row) => ({
          id: row.id,
          title: row.title.substring(0, 24), // Max 24 chars
          description: row.description?.substring(0, 72), // Max 72 chars
        })),
      })),
    },
  };

  if (header) {
    (interactiveBody as Record<string, unknown>).header = {
      type: "text",
      text: header,
    };
  }

  if (footer) {
    (interactiveBody as Record<string, unknown>).footer = {
      text: footer,
    };
  }

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "interactive",
    interactive: interactiveBody,
  };

  try {
    const response = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      console.error("WhatsApp Interactive List Error:", error);
      return {
        success: false,
        error: error.error?.message || "Error al enviar lista",
      };
    }

    const result = data as WhatsAppMessageResponse;
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}

/**
 * Send an interactive message with Call-to-Action buttons
 * BRUTAL: Action buttons for phone calls or URLs
 */
export async function sendInteractiveCTA(
  config: WhatsAppConfig,
  options: SendInteractiveCTAOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = config;
  const { to, text, buttons, header, footer } = options;

  const formattedPhone = formatPhoneNumber(to);

  if (!isValidPhoneNumber(to)) {
    return { success: false, error: "Número de teléfono inválido" };
  }

  if (buttons.length === 0 || buttons.length > 2) {
    return { success: false, error: "Debe haber entre 1 y 2 botones CTA" };
  }

  const interactiveBody: Record<string, unknown> = {
    type: "cta_url",
    body: { text },
    action: {
      name: "cta_url",
      parameters: {
        display_text: buttons[0].text.substring(0, 20),
        url: buttons[0].url || `tel:${buttons[0].phone_number}`,
      },
    },
  };

  if (header) {
    (interactiveBody as Record<string, unknown>).header = {
      type: "text",
      text: header,
    };
  }

  if (footer) {
    (interactiveBody as Record<string, unknown>).footer = {
      text: footer,
    };
  }

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedPhone,
    type: "interactive",
    interactive: interactiveBody,
  };

  try {
    const response = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as WhatsAppError;
      console.error("WhatsApp Interactive CTA Error:", error);
      return {
        success: false,
        error: error.error?.message || "Error al enviar CTA",
      };
    }

    const result = data as WhatsAppMessageResponse;
    return {
      success: true,
      messageId: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error de conexión",
    };
  }
}
