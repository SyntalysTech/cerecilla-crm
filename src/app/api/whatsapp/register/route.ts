import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v18.0";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WABA_ID = process.env.WHATSAPP_WABA_ID;
const PHONE_E164 = process.env.WHATSAPP_PHONE_E164;

// The certificate from WhatsApp Manager
const WHATSAPP_CERTIFICATE = process.env.WHATSAPP_CERTIFICATE || "CogBCkQI8+TI7JWvtgMSBmVudDp3YSIrQ2VyZWNpbGxhIFNMIEFob3JybyBlbiBFbmVyZ8OtYSB5IFNlcnZpY2lvc1D/3ojLBhpA28NALDzKWuw9J8R+2pUgye6ZGtJLC1a21LNrD/hR1in+wyL5/cezoOSlMGFI2JJ9blHOk2XY/mn9kmTv/Ni4DBIubWMB+oHYkI7wWrWxnKppKp1d7eRYzNjimERKTq08HlGzRvsy6JoglTpBVokQDQ==";

export async function POST(request: NextRequest) {
  try {
    if (!META_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: "Faltan credenciales de Meta en las variables de entorno" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pin = body.pin || "123456"; // 6-digit PIN for two-step verification

    // Register the phone number with certificate
    // This is for Cloud API registration
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/register`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin: pin,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta API error (register):", data);

      // If register fails, try with certificate approach
      // Some setups require the certificate to be submitted differently
      if (data.error?.code === 100 || data.error?.message?.includes("certificate")) {
        return NextResponse.json(
          {
            error: data.error?.message || "Error al registrar",
            error_code: data.error?.code,
            suggestion: "El número puede requerir verificación con OTP primero. Usa 'Solicitar código' y luego 'Verificar'.",
            raw: data
          },
          { status: response.status }
        );
      }

      return NextResponse.json(
        {
          error: data.error?.message || "Error al registrar número",
          error_code: data.error?.code,
          error_subcode: data.error?.error_subcode,
          error_type: data.error?.type,
          fbtrace_id: data.error?.fbtrace_id,
          raw: data
        },
        { status: response.status }
      );
    }

    // If registration successful, update status in database
    const supabase = await createClient();
    await supabase
      .from("whatsapp_settings")
      .upsert({
        waba_id: WABA_ID,
        phone_number_id: PHONE_NUMBER_ID,
        phone_e164: PHONE_E164,
        status: "REGISTERED",
        last_checked_at: new Date().toISOString(),
      }, { onConflict: "phone_number_id" });

    return NextResponse.json({
      success: true,
      message: "Número registrado correctamente",
      data,
    });
  } catch (error) {
    console.error("Error registering WhatsApp number:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
