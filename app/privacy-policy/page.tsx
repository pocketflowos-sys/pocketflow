import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">PocketFlow</p>
          <h1 className="mt-3 text-4xl font-semibold">Privacy Policy</h1>
          <p className="mt-4 text-sm text-muted">PocketFlow stores the financial information you manually enter in order to provide dashboards, budgets, lend / borrow tracking, investment tracking, and asset tracking.</p>
        </Card>

        <Card className="space-y-4 p-6 md:p-8 text-sm text-muted">
          <p><strong className="text-white">What we collect:</strong> your account identity details, payment verification status, and the financial entries you choose to save.</p>
          <p><strong className="text-white">Why we collect it:</strong> to run the PocketFlow product, secure paid access, and let you sync your workspace across sessions and devices.</p>
          <p><strong className="text-white">How it is protected:</strong> PocketFlow uses authenticated access, user-level database protection rules, and payment verification checks before granting access.</p>
          <p><strong className="text-white">What we do not claim:</strong> PocketFlow is a manual money tracking tool. It does not promise automatic bank syncing or financial advice.</p>
          <p><strong className="text-white">Support:</strong> for privacy or account requests, contact the PocketFlow support email configured in your deployment.</p>
          <p><Link href="/" className="text-primary">Back to home</Link></p>
        </Card>
      </div>
    </main>
  );
}
