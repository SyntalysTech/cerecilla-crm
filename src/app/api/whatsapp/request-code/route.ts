import { NextRequest, NextResponse } from "next/server";

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v18.0";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

export async function POST(request: NextRequest) {
  try {
    if (!META_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: "Faltan credenciales de Meta en las variables de entorno" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { method = "SMS", language = "es" } = body;

    // Request verification code via Graph API
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/request_code`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code_method: method.toUpperCase(), // SMS or VOICE
          language: language,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta API error (request_code):", data);
      return NextResponse.json(
        {
          error: data.error?.message || "Error al solicitar código",
          error_code: data.error?.code,
          error_subcode: data.error?.error_subcode,
          error_type: data.error?.type,
          fbtrace_id: data.error?.fbtrace_id,
          raw: data
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Código enviado por ${method}`,
      data,
    });
  } catch (error) {
    console.error("Error requesting WhatsApp code:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
