import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v18.0";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WABA_ID = process.env.WHATSAPP_WABA_ID;
const PHONE_E164 = process.env.WHATSAPP_PHONE_E164;

export async function POST(request: NextRequest) {
  try {
    if (!META_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: "Faltan credenciales de Meta en las variables de entorno" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Se requiere el código de verificación" },
        { status: 400 }
      );
    }

    // Verify the code via Graph API
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/verify_code`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta API error (verify_code):", data);
      return NextResponse.json(
        {
          error: data.error?.message || "Error al verificar código",
          error_code: data.error?.code,
          error_subcode: data.error?.error_subcode,
          error_type: data.error?.type,
          fbtrace_id: data.error?.fbtrace_id,
          raw: data
        },
        { status: response.status }
      );
    }

    // If verification successful, update status in database
    if (data.success) {
      const supabase = await createClient();
      await supabase
        .from("whatsapp_settings")
        .upsert({
          waba_id: WABA_ID,
          phone_number_id: PHONE_NUMBER_ID,
          phone_e164: PHONE_E164,
          status: "VERIFIED",
          last_checked_at: new Date().toISOString(),
        }, { onConflict: "phone_number_id" });
    }

    return NextResponse.json({
      success: true,
      message: "Código verificado correctamente",
      data,
    });
  } catch (error) {
    console.error("Error verifying WhatsApp code:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
