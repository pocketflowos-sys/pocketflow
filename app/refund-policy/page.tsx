import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card className="p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.2em] text-primary">PocketFlow</p>
          <h1 className="mt-3 text-4xl font-semibold">Refund Policy</h1>
          <p className="mt-4 text-sm text-muted">PocketFlow is sold as a one-time access digital product.</p>
        </Card>

        <Card className="space-y-4 p-6 md:p-8 text-sm text-muted">
          <p><strong className="text-white">General rule:</strong> because access is delivered digitally after payment verification, refunds are usually not issued once the account has been unlocked.</p>
          <p><strong className="text-white">Exceptions:</strong> duplicate charges, technical activation failures, or mistaken billing issues can be reviewed case by case.</p>
          <p><strong className="text-white">How to request help:</strong> contact PocketFlow support with your payment email, approximate payment time, and the issue you faced.</p>
          <p><Link href="/support" className="text-primary">Go to support</Link></p>
        </Card>
      </div>
    </main>
  );
}
