import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1x1 transparent GIF pixel
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get("c");
  const recipientId = searchParams.get("r");
  const email = searchParams.get("e");

  if (campaignId) {
    try {
      // Get client info
      const userAgent = request.headers.get("user-agent") || "";
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                 request.headers.get("x-real-ip") ||
                 "unknown";

      // Record the open event
      await supabase.from("email_tracking_events").insert({
        campaign_id: campaignId,
        recipient_id: recipientId || null,
        email: email || null,
        event_type: "open",
        user_agent: userAgent.substring(0, 500),
        ip_address: ip,
        created_at: new Date().toISOString(),
      });

      // Update campaign stats
      await supabase.rpc("increment_campaign_opens", { campaign_uuid: campaignId });

      // If recipient_id provided, mark as opened
      if (recipientId) {
        await supabase
          .from("email_campaign_recipients")
          .update({
            opened_at: new Date().toISOString(),
            open_count: supabase.rpc("increment", { x: 1 })
          })
          .eq("id", recipientId)
          .is("opened_at", null); // Only update if not already opened
      }
    } catch (error) {
      console.error("[Track Open] Error:", error);
    }
  }

  // Return transparent 1x1 GIF
  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
