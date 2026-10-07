import "server-only";

type Mail = { to: string; subject: string; html: string; text: string };

/** Pluggable email sender. "console" for development, "resend" for production. */
export async function sendMail(mail: Mail) {
  const driver = process.env.MAIL_DRIVER || "console";
  if (driver === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "no-reply@example.com",
        to: mail.to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}`);
    return;
  }
  console.info(`\n📧 [mail:console] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
}
