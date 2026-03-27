import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-glow">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Welcome Back
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-6xl">
            Sign in and step back into <span className="text-gradient">money clarity.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Track income, expenses, budgets, lending, investments, and assets with one
            premium system.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-xl font-semibold">One dashboard</p>
              <p className="mt-2 text-sm text-muted">
                See the full picture without switching between apps, notes, and guesswork.
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xl font-semibold">Mobile friendly</p>
              <p className="mt-2 text-sm text-muted">
                Quick add and dashboard cards are designed to feel smooth on your phone.
              </p>
            </Card>
          </div>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 text-sm text-muted transition hover:text-white"
          >
            Back to home <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <Card className="mx-auto w-full max-w-md p-6 md:p-8">
          <div className="mb-6">
            <p className="text-2xl font-semibold">Log in</p>
            <p className="mt-2 text-sm text-muted">
              Connect Supabase auth later. This UI is ready for your local testing now.
            </p>
          </div>

          <form className="space-y-4">
            <Input label="Email" icon={<Mail className="h-4 w-4" />} placeholder="you@example.com" />
            <Input
              label="Password"
              icon={<LockKeyhole className="h-4 w-4" />}
              placeholder="••••••••"
              type="password"
            />

            <div className="flex items-center justify-between text-sm text-muted">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-white/15 bg-transparent" />
                Remember me
              </label>
              <Link href="/signup" className="text-primary transition hover:opacity-90">
                Need an account?
              </Link>
            </div>

            <Button className="w-full">Sign in</Button>
            <Link href="/dashboard" className="block">
              <Button variant="secondary" className="w-full">
                Open demo dashboard
              </Button>
            </Link>
          </form>
        </Card>
      </div>
    </main>
  );
}
