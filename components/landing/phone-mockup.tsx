import { ArrowDownRight, ArrowUpRight, PiggyBank, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";

type PhoneType = "dashboard" | "quick" | "budget" | "investment" | "lend";

const titles: Record<PhoneType, string> = {
  dashboard: "Dashboard",
  quick: "Quick Add",
  budget: "Budget Planner",
  investment: "Investment View",
  lend: "Lend / Borrow"
};

export function PhoneMockup({ type }: { type: PhoneType }) {
  return (
    <div className="relative mx-auto w-[158px] sm:w-[190px] md:w-[220px]">
      <div className="rounded-[40px] border border-white/15 bg-[#060a13] p-2 shadow-glow">
        <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[#0f1524] sm:rounded-[32px]">
          <div className="flex items-center justify-between border-b border-white/6 px-3 py-2.5 text-[9px] text-muted sm:px-4 sm:py-3 sm:text-[10px]">
            <span>10:41</span>
            <span>{titles[type]}</span>
            <span>LTE</span>
          </div>

          <div className="space-y-2.5 p-3 sm:space-y-3 sm:p-4">
            {type === "dashboard" ? (
              <>
                <Card className="rounded-[24px] p-4">
                  <p className="text-xs text-muted">Tracked balance</p>
                  <p className="mt-2 text-3xl font-semibold">₹1.48L</p>
                  <div className="mt-4 h-2 rounded-full bg-white/8">
                    <div className="h-2 w-2/3 rounded-full bg-primary" />
                  </div>
                </Card>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="rounded-[24px] p-3">
                    <ArrowDownRight className="h-4 w-4 text-success" />
                    <p className="mt-3 text-lg font-semibold text-success">₹2.35L</p>
                    <p className="text-xs text-muted">Income</p>
                  </Card>
                  <Card className="rounded-[24px] p-3">
                    <ArrowUpRight className="h-4 w-4 text-danger" />
                    <p className="mt-3 text-lg font-semibold text-danger">₹86.5K</p>
                    <p className="text-xs text-muted">Expense</p>
                  </Card>
                </div>
              </>
            ) : null}

            {type === "quick" ? (
              <>
                <Card className="rounded-[24px] p-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl bg-primary px-3 py-2 text-center font-semibold text-black">
                      Expense
                    </div>
                    <div className="rounded-2xl bg-white/6 px-3 py-2 text-center text-muted">
                      Income
                    </div>
                  </div>
                </Card>
                {["Amount", "Category", "Payment method", "Notes"].map((field) => (
                  <Card key={field} className="rounded-[24px] p-3">
                    <p className="text-xs text-muted">{field}</p>
                    <p className="mt-2 text-sm text-white/80">
                      {field === "Amount" ? "₹1,250" : `Add ${field.toLowerCase()}`}
                    </p>
                  </Card>
                ))}
              </>
            ) : null}

            {type === "budget" ? (
              <>
                <Card className="rounded-[24px] p-4">
                  <PiggyBank className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-2xl font-semibold">74%</p>
                  <p className="text-xs text-muted">Monthly budget used</p>
                </Card>
                {[
                  ["Food", "₹16,000 / ₹20,000"],
                  ["Travel", "₹8,500 / ₹10,000"],
                  ["Shopping", "₹12,200 / ₹10,000"]
                ].map(([name, amount]) => (
                  <Card key={name} className="rounded-[24px] p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">{name}</p>
                      <p className="text-xs text-muted">{amount}</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/8">
                      <div
                        className={`h-2 rounded-full ${
                          name === "Shopping" ? "bg-danger w-full" : name === "Travel" ? "bg-primary w-4/5" : "bg-success w-3/4"
                        }`}
                      />
                    </div>
                  </Card>
                ))}
              </>
            ) : null}

            {type === "investment" ? (
              <>
                <Card className="rounded-[24px] p-4">
                  <p className="text-xs text-muted">Current value</p>
                  <p className="mt-2 text-3xl font-semibold">₹5.62L</p>
                  <div className="mt-4 flex h-24 items-end gap-2">
                    {[24, 42, 35, 58, 74, 82].map((height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-xl bg-primary/85"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </Card>
              </>
            ) : null}

            {type === "lend" ? (
              <>
                {[
                  ["Afsal", "Given", "₹12,000"],
                  ["Niyas", "Borrowed", "₹7,500"],
                  ["Ramees", "Given", "₹15,000"]
                ].map(([name, label, amount]) => (
                  <Card key={name} className="rounded-[24px] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-primary/12 p-2 text-primary">
                          <WalletCards className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-muted">{label}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">{amount}</p>
                    </div>
                  </Card>
                ))}
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 top-2 mx-auto h-4 w-20 rounded-full bg-black/80 sm:h-5 sm:w-24" />
    </div>
  );
}
