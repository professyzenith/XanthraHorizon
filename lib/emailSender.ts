import { Resend } from "resend";
import { BriefingData } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

// Escape all special HTML characters to prevent XSS from RSS-sourced content
function htmlEscape(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHTML(briefing: BriefingData, unsubscribeUrl: string): string {
  const storyCards = briefing.stories
    .map(
      (story, i) => `
    <div style="margin-bottom:32px;padding:24px;background:#0e0c0a;border:1px solid #1e1b17;border-radius:12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="background:#1e1b17;color:#c9a853;font-size:11px;font-weight:600;padding:3px 8px;border-radius:4px;letter-spacing:0.05em;font-family:monospace;">${String(i + 1).padStart(2, "0")}</span>
        <span style="color:#6b5f4a;font-size:12px;">${htmlEscape(story.source)}</span>
      </div>
      <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#f0ece3;line-height:1.4;">
        <a href="${htmlEscape(story.url)}" style="color:#f0ece3;text-decoration:none;">${htmlEscape(story.title)}</a>
      </h2>
      <p style="margin:0 0 16px;color:#8a8070;font-size:14px;line-height:1.7;">${htmlEscape(story.summary)}</p>
      <div style="padding:12px 16px;background:#0a0805;border-left:3px solid #c9a853;border-radius:0 6px 6px 0;margin-bottom:16px;">
        <p style="margin:0;color:#c9a853;font-size:12px;font-weight:600;letter-spacing:0.05em;margin-bottom:4px;">WHY IT MATTERS</p>
        <p style="margin:0;color:#8a8070;font-size:13px;line-height:1.6;">${htmlEscape(story.why_it_matters)}</p>
      </div>
      <a href="${htmlEscape(story.url)}" style="display:inline-flex;align-items:center;gap:6px;color:#c9a853;font-size:13px;text-decoration:none;font-weight:500;">
        Read full story →
      </a>
    </div>
  `
    )
    .join("");

  const safeDate          = htmlEscape(briefing.date);
  const safeExecBrief     = htmlEscape(briefing.executive_brief);
  const safeStoryCount    = briefing.stories.length;
  const safeUnsubscribeUrl = htmlEscape(unsubscribeUrl);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xanthra Horizon — ${safeDate}</title>
</head>
<body style="margin:0;padding:0;background:#060504;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;padding-bottom:32px;border-bottom:1px solid #1e1b17;">
      <div style="display:inline-block;padding:6px 16px;background:#1e1b17;border:1px solid #2a2318;border-radius:20px;margin-bottom:20px;">
        <span style="color:#c9a853;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Xanthra Horizon</span>
      </div>
      <h1 style="margin:0 0 4px;font-size:28px;font-weight:700;color:#f0ece3;">${safeDate}</h1>
      <p style="margin:0 0 4px;color:#c9a853;font-size:13px;font-weight:600;letter-spacing:0.05em;">Know What Matters Next.</p>
      <p style="margin:0;color:#6b5f4a;font-size:14px;">${safeStoryCount} developments that matter today</p>
    </div>

    <!-- Executive Brief -->
    <div style="margin-bottom:40px;padding:24px;background:linear-gradient(135deg,#0d0b09,#110f0c);border:1px solid #2a2318;border-radius:12px;">
      <p style="margin:0 0 8px;color:#c9a853;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Today's Overview</p>
      <p style="margin:0;color:#c4b89a;font-size:16px;line-height:1.7;font-style:italic;">${safeExecBrief}</p>
    </div>

    <!-- Stories -->
    <div style="margin-bottom:40px;">
      <p style="margin:0 0 20px;color:#6b5f4a;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Top Stories</p>
      ${storyCards}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:32px;border-top:1px solid #1e1b17;">
      <p style="margin:0 0 8px;color:#52473a;font-size:12px;">
        You're receiving this because you subscribed to Xanthra Horizon.
      </p>
      <a href="${safeUnsubscribeUrl}" style="color:#52473a;font-size:12px;text-decoration:underline;">Unsubscribe</a>
    </div>

  </div>
</body>
</html>
`;
}

export async function sendBriefingEmail(
  email: string,
  briefing: BriefingData,
  subscriberId: string
): Promise<{ success: boolean; error?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const unsubscribeUrl = `${appUrl}/unsubscribe?id=${subscriberId}`;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "briefing@example.com";

  try {
    const { error } = await resend.emails.send({
      from: `Xanthra Horizon <${fromEmail}>`,
      to: email,
      subject: `Xanthra Horizon: ${briefing.date} — ${briefing.stories[0]?.title?.slice(0, 60) ?? "Know What Matters Next"}`,
      html: buildEmailHTML(briefing, unsubscribeUrl),
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
