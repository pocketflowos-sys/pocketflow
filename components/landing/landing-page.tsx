"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BadgeIndianRupee, CreditCard, FolderKanban, HandCoins, Landmark, Layers3, ReceiptText, Smartphone, Wallet } from "lucide-react";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const fade = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const features = [
  { icon: Wallet, title: "Dashboard", text: "See current balance, budgets, dues, cards, loans, investments, and assets together." },
  { icon: CreditCard, title: "Quick Add", text: "Save daily entries fast, or import a transaction file when needed." },
  { icon: HandCoins, title: "Lend / Borrow", text: "Know clearly who owes you and whom you owe." },
  { icon: ReceiptText, title: "Loans & EMI", text: "Track loan balance, EMI amount, and next EMI date in one place." },
  { icon: CreditCard, title: "Credit Cards", text: "Track card due date, billing date, usage, and limit." },
  { icon: Landmark, title: "Investments", text: "Monitor investments and assets effortlessly in a cleaner workspace." },
  { icon: Layers3, title: "Assets", text: "Track valuable items, property, vehicles, devices, and more." },
  { icon: FolderKanban, title: "Category page", text: "Tap a category and view related data and summary faster." }
];

const faqs = [
  { question: "Is this a subscription?", answer: "No. PocketFlow is sold as a one-time purchase. Current buyers get lifetime access. Future pricing for new users may change later." },
  { question: "Will it work on mobile?", answer: "Yes. PocketFlow currently works through the web across mobile, tablet, and desktop devices." },
  { question: "Is there a mobile app?", answer: "A dedicated mobile app is planned later. For now, PocketFlow works through the web across Android, iPhone, Windows, and Mac." },
  { question: "Can I track loans, credit cards, investments, and assets?", answer: "Yes. PocketFlow now covers loans, EMI, credit cards, investments, and assets in one workspace." },
  { question: "What about refunds?", answer: "Because access is delivered instantly after payment verification, there is no refund after payment in normal cases. If promised service is not provided, support can review the issue." }
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} transition={{ duration: 0.6, delay }}>
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <main className="grid-pattern min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link href="/" className="text-2xl font-semibold text-primary">PocketFlow</Link>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login"><Button variant="ghost" className="px-3">Login</Button></Link>
            <Link href="/signup"><Button className="px-4 text-sm sm:text-base">Get PocketFlow</Button></Link>
          </div>
        </div>
      </header>

      <section className="section-space px-4 md:px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <FadeIn>
            <Badge>Current buyer offer • Lifetime access for today’s buyers</Badge>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] sm:text-5xl md:mt-8 md:text-7xl">Money comes in. <br />Money goes out. <br /><span className="text-gradient">PocketFlow shows where it all goes.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-xl sm:leading-8">PocketFlow helps people track income, expenses, budgets, lend / borrow, credit cards, loans, EMI, investments, and assets in one clean finance workspace.</p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:gap-4"><Link href="/signup"><Button className="w-full sm:w-auto">Start now <ArrowRight className="ml-2 h-4 w-4" /></Button></Link><Link href="/login"><Button variant="secondary" className="w-full sm:w-auto">Existing user login</Button></Link></div>
            <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted"><span className="rounded-full border border-white/10 px-3 py-2">One-time payment</span><span className="rounded-full border border-white/10 px-3 py-2">Web across devices</span><span className="rounded-full border border-white/10 px-3 py-2">Fast sync</span></div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="relative mx-auto flex max-w-[620px] flex-col items-center gap-4 lg:gap-0">
              <div className="absolute inset-0 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative z-10 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-[0.85fr_1fr_0.85fr] lg:items-end">
                <Card className="order-2 p-4 sm:order-1 lg:translate-y-8"><p className="text-sm text-muted">Quick add</p><p className="mt-2 text-xl font-semibold">Faster entry on mobile</p><p className="mt-2 text-sm text-muted">Open income, expense, receivable, or payable with smarter defaults.</p></Card>
                <div className="order-1 flex justify-center sm:order-2"><PhoneMockup type="dashboard" /></div>
                <Card className="order-3 p-4 lg:-translate-y-4"><p className="text-sm text-muted">New visibility</p><p className="mt-2 text-xl font-semibold">Loans, cards, investments, assets</p><p className="mt-2 text-sm text-muted">A more complete finance product, not just a basic tracker.</p></Card>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section id="features" className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn><SectionHeading kicker="What it covers" align="center" title={<>Everything important in <span className="text-gradient">one finance workspace</span></>} description="Built for normal users who want clarity without complexity." /></FadeIn>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => { const Icon = feature.icon; return <FadeIn key={feature.title} delay={index * 0.04}><Card className="h-full p-5"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary"><Icon className="h-5 w-5" /></div><p className="mt-4 text-xl font-semibold">{feature.title}</p><p className="mt-2 text-sm text-muted">{feature.text}</p></Card></FadeIn>; })}
          </div>
        </div>
      </section>

      <section className="section-space px-4 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <FadeIn><Card className="h-full p-6 md:p-8"><p className="text-sm uppercase tracking-[0.18em] text-primary">Why it feels better</p><h2 className="mt-3 text-3xl font-semibold">Cleaner experience for real users</h2><div className="mt-5 space-y-3 text-sm text-muted"><p>• Better mobile-first layout</p><p>• Faster cross-tab and cross-device refresh</p><p>• Smarter quick add defaults</p><p>• Easier custom categories and options</p><p>• Better visibility for investments, assets, loans, and credit cards</p></div></Card></FadeIn>
          <FadeIn delay={0.08}><Card className="h-full p-6 md:p-8"><p className="text-sm uppercase tracking-[0.18em] text-primary">Mobile app plan</p><h2 className="mt-3 text-3xl font-semibold">Mobile app coming soon on Android and iOS</h2><p className="mt-4 text-muted">Right now, PocketFlow works through the web across devices and operating systems. A dedicated mobile app experience is planned later.</p><div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted"><Smartphone className="h-4 w-4" />Use it today on web. App version later.</div></Card></FadeIn>
        </div>
      </section>

      <section id="pricing" className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-4xl"><FadeIn><Card className="p-6 text-center md:p-10"><div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary"><BadgeIndianRupee className="h-4 w-4" />Current buyer pricing</div><h2 className="mt-6 text-4xl font-semibold">₹99 one-time</h2><p className="mt-4 text-lg text-muted">Current buyers get lifetime access. Future pricing for new users may change later.</p><div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-muted">No refund after payment because access is delivered instantly after verification. If promised service is not provided properly, support can review the issue.</div><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/signup"><Button className="w-full sm:w-auto">Buy current offer</Button></Link><Link href="/login"><Button variant="secondary" className="w-full sm:w-auto">Login</Button></Link></div></Card></FadeIn></div>
      </section>

      <section id="faq" className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-4xl"><FadeIn><SectionHeading kicker="Q&A" align="center" title="Common questions" description="Open only the answers you need." /></FadeIn><div className="mt-8 space-y-3">{faqs.map((item, index) => <FadeIn key={item.question} delay={index * 0.04}><details className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03]"><summary className="cursor-pointer list-none px-5 py-4 text-left font-semibold">{item.question}</summary><div className="border-t border-white/8 px-5 py-4 text-sm text-muted">{item.answer}</div></details></FadeIn>)}</div></div>
      </section>

      <footer className="border-t border-white/6 px-4 py-8 text-sm text-muted md:px-6"><div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between"><p>© PocketFlow. Personal finance clarity, made simpler.</p><div className="flex flex-wrap gap-4"><Link href="/privacy-policy" className="transition hover:text-white">Privacy</Link><Link href="/terms" className="transition hover:text-white">Terms</Link><Link href="/refund-policy" className="transition hover:text-white">Refunds</Link><Link href="/support" className="transition hover:text-white">Support</Link><Link href="/login" className="transition hover:text-white">Login</Link></div></div></footer>
    </main>
  );
}
