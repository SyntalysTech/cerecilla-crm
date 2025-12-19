// Helper function to add tracking to HTML emails
export function addTrackingToHtml(
  html: string,
  campaignId: string,
  recipientId: string,
  email: string,
  baseUrl: string
): string {
  let trackedHtml = html;

  // Add tracking pixel before closing </body> or at the end
  const trackingPixel = `<img src="${baseUrl}/api/track/open?c=${campaignId}&r=${recipientId}&e=${encodeURIComponent(email)}" width="1" height="1" style="display:none;" alt="" />`;

  if (trackedHtml.includes("</body>")) {
    trackedHtml = trackedHtml.replace("</body>", `${trackingPixel}</body>`);
  } else {
    trackedHtml += trackingPixel;
  }

  // Replace links with tracking links
  const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi;
  trackedHtml = trackedHtml.replace(linkRegex, (match, before, url, after) => {
    // Skip mailto:, tel:, and # links
    if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("#")) {
      return match;
    }
    // Skip unsubscribe links (they have their own tracking)
    if (url.includes("/api/unsubscribe")) {
      return match;
    }
    const trackedUrl = `${baseUrl}/api/track/click?c=${campaignId}&r=${recipientId}&e=${encodeURIComponent(email)}&url=${encodeURIComponent(url)}`;
    return `<a ${before}href="${trackedUrl}"${after}>`;
  });

  return trackedHtml;
}
