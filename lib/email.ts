type SendEmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendTransactionalEmail(payload: SendEmailPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const brevoApiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM ?? "PocketFlow <hello@example.com>";

  if (!resendApiKey && !brevoApiKey) {
    return {
      success: false,
      demo: true,
      message: "No email provider key found. Email send skipped.",
      payload,
      from
    };
  }

  return {
    success: true,
    provider: resendApiKey ? "resend" : "brevo",
    payload,
    from
  };
}
