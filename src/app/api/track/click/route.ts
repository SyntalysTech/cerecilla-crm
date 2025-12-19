import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const campaignId = searchParams.get("c");
  const recipientId = searchParams.get("r");
  const email = searchParams.get("e");
  const url = searchParams.get("url");
  const linkId = searchParams.get("l");

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  // Decode the URL
  let redirectUrl: string;
  try {
    redirectUrl = decodeURIComponent(url);
  } catch {
    redirectUrl = url;
  }

  if (campaignId) {
    try {
      // Get client info
      const userAgent = request.headers.get("user-agent") || "";
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                 request.headers.get("x-real-ip") ||
                 "unknown";

      // Record the click event
      await supabase.from("email_tracking_events").insert({
        campaign_id: campaignId,
        recipient_id: recipientId || null,
        email: email || null,
        event_type: "click",
        link_url: redirectUrl,
        link_id: linkId || null,
        user_agent: userAgent.substring(0, 500),
        ip_address: ip,
        created_at: new Date().toISOString(),
      });

      // Update campaign stats
      await supabase.rpc("increment_campaign_clicks", { campaign_uuid: campaignId });

      // If recipient_id provided, mark as clicked and also opened
      if (recipientId) {
        await supabase
          .from("email_campaign_recipients")
          .update({
            clicked_at: new Date().toISOString(),
            opened_at: new Date().toISOString(), // A click implies an open
          })
          .eq("id", recipientId);
      }
    } catch (error) {
      console.error("[Track Click] Error:", error);
    }
  }

  // Redirect to the original URL
  return Response.redirect(redirectUrl, 302);
}
