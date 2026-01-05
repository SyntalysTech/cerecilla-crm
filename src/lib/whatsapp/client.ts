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
