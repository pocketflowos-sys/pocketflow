import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">PocketFlow</p>
          <h1 className="mt-3 text-4xl font-semibold">Terms of Use</h1>
          <p className="mt-4 text-sm text-muted">By using PocketFlow, you agree to use the product only for lawful personal or business finance tracking purposes.</p>
        </Card>

        <Card className="space-y-4 p-6 md:p-8 text-sm text-muted">
          <p><strong className="text-white">Product scope:</strong> PocketFlow is a manual financial organization tool. It is not accounting software, tax advice, investment advice, or a bank.</p>
          <p><strong className="text-white">Account access:</strong> you are responsible for protecting your login details and using a strong password.</p>
          <p><strong className="text-white">Payments:</strong> access is unlocked after successful payment verification.</p>
          <p><strong className="text-white">Availability:</strong> we aim for reliable access but do not guarantee uninterrupted service at all times.</p>
          <p><strong className="text-white">Changes:</strong> PocketFlow may improve, adjust, or remove features over time in order to maintain the service responsibly.</p>
          <p><Link href="/" className="text-primary">Back to home</Link></p>
        </Card>
      </div>
    </main>
  );
}
