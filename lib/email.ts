type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendTransactionalEmail(payload: SendEmailPayload) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM ?? "PocketFlow <support@pocketflowos.in>";

  if (!brevoApiKey) {
    return {
      success: false,
      skipped: true,
      message: "Missing BREVO_API_KEY. Email sending skipped.",
      payload,
      from
    };
  }

  const match = from.match(/^(.*)<(.+)>$/);
  const sender = match
    ? { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() }
    : { name: "PocketFlow", email: from };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": brevoApiKey
    },
    body: JSON.stringify({
      sender,
      to: [{ email: payload.to }],
      subject: payload.subject,
      htmlContent: payload.html
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return {
    success: true,
    provider: "brevo"
  };
}
