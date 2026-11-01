// Sends inquiry emails to the home owner using Resend (https://resend.com).
// If RESEND_API_KEY is not set, the email is printed to the server log instead.

function escape(s) {
  return String(s ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[ch]);
}

export async function sendInquiryEmail(home, inquiry) {
  const subject = `New BedBoard inquiry for ${home.name}`;
  const rows = [
    ["Name", inquiry.name],
    ["Phone", inquiry.phone],
    ["Who it's for", inquiry.forWhom],
    ["Payment", inquiry.payment],
    ["Move-in date", inquiry.moveInDate || "Not sure yet"],
    ["Notes", inquiry.notes || "—"],
  ];

  const text =
    `New inquiry for ${home.name}\n\n` +
    rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\nPlease call them back as soon as you can.\n`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px">
      <h2 style="color:#0f766e">New inquiry for ${escape(home.name)}</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        ${rows.map(([k, v]) => `<tr><td style="color:#64748b">${k}</td><td><b>${escape(v)}</b></td></tr>`).join("")}
      </table>
      <p>Please call them back as soon as you can.</p>
      <p style="color:#94a3b8;font-size:12px">Sent by BedBoard. Inquiries only — no medical information is collected.</p>
    </div>`;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[BedBoard] No RESEND_API_KEY set. Email to ${home.ownerEmail}:\n${text}`);
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "BedBoard <onboarding@resend.dev>",
      to: [home.ownerEmail],
      subject,
      text,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[BedBoard] Email failed:", res.status, await res.text());
    return false;
  }
  return true;
}
