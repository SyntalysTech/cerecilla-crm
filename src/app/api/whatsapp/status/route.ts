import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || "v18.0";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WABA_ID = process.env.WHATSAPP_WABA_ID;
const PHONE_E164 = process.env.WHATSAPP_PHONE_E164;

export async function GET() {
  try {
    if (!META_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: "Faltan credenciales de Meta en las variables de entorno" },
        { status: 500 }
      );
    }

    // Get phone number status from Graph API
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,platform_type,throughput,status,name_status,account_mode`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta API error (status):", data);
      return NextResponse.json(
        {
          error: data.error?.message || "Error al obtener estado",
          error_code: data.error?.code,
          error_subcode: data.error?.error_subcode,
          error_type: data.error?.type,
          fbtrace_id: data.error?.fbtrace_id,
          raw: data
        },
        { status: response.status }
      );
    }

    // Update database with current status
    const supabase = await createClient();
    const status = data.code_verification_status || data.status || "UNKNOWN";

    await supabase
      .from("whatsapp_settings")
      .upsert({
        waba_id: WABA_ID,
        phone_number_id: PHONE_NUMBER_ID,
        phone_e164: PHONE_E164 || data.display_phone_number,
        status: status,
        verified_name: data.verified_name,
        quality_rating: data.quality_rating,
        platform_type: data.platform_type,
        last_checked_at: new Date().toISOString(),
      }, { onConflict: "phone_number_id" });

    return NextResponse.json({
      success: true,
      phone_number_id: PHONE_NUMBER_ID,
      waba_id: WABA_ID,
      display_phone_number: data.display_phone_number,
      verified_name: data.verified_name,
      status: status,
      code_verification_status: data.code_verification_status,
      quality_rating: data.quality_rating,
      platform_type: data.platform_type,
      throughput: data.throughput,
      name_status: data.name_status,
      account_mode: data.account_mode,
      raw: data,
    });
  } catch (error) {
    console.error("Error getting WhatsApp status:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
