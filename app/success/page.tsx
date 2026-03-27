import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
        <h1 className="mt-6 text-4xl font-semibold">Payment successful</h1>
        <p className="mt-4 text-lg text-muted">
          This is a placeholder success page. You can connect Razorpay verification and email
          delivery next.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard">
            <Button>Open dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Back to home</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
