import { LoaderScreen } from "@/components/ui/loader-screen";

export default function CheckoutLoading() {
  return <LoaderScreen title="Preparing checkout" message="Checking your access and loading the payment screen..." />;
}
