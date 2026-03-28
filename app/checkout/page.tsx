import { requireUser } from "@/lib/auth";
import { CheckoutPanel } from "@/components/billing/checkout-panel";

export default async function CheckoutPage() {
  await requireUser();
  return <CheckoutPanel />;
}
