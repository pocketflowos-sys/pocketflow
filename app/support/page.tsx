import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function SupportPage() {
  const supportEmail = process.env.SUPPORT_EMAIL ?? "support@pocketflowos.in";

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">PocketFlow support</p>
          <h1 className="mt-3 text-4xl font-semibold">Need help?</h1>
          <p className="mt-4 text-sm text-muted">
            For payment issues, account access problems, or product questions, contact PocketFlow support.
          </p>
          <p className="mt-5 text-lg font-medium text-white">{supportEmail}</p>
        </Card>

        <Card className="space-y-4 p-6 md:p-8 text-sm text-muted">
          <p>Include your account email, device, issue details, and screenshots if possible.</p>
          <p>For payment issues, include the payment time and the email used during checkout.</p>
          <p><Link href="/" className="text-primary">Back to home</Link></p>
        </Card>
      </div>
    </main>
  );
}
