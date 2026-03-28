"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Check,
  Cloud,
  CreditCard,
  GraduationCap,
  HandCoins,
  Layers3,
  LineChart,
  PiggyBank,
  Store,
  Wallet
} from "lucide-react";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const featureCards = [
  {
    icon: CreditCard,
    title: "Quick Add",
    text: "Add income or expense entries in seconds with a mobile-friendly flow."
  },
  {
    icon: Wallet,
    title: "Home Dashboard",
    text: "See income, expense, balance, savings rate, and due amounts together."
  },
  {
    icon: PiggyBank,
    title: "Budget Planner",
    text: "Track monthly category budgets before overspending becomes a surprise."
  },
  {
    icon: HandCoins,
    title: "Lend / Borrow Tracker",
    text: "Know who owes you and whom you owe without relying on memory."
  },
  {
    icon: LineChart,
    title: "Investment Tracking",
    text: "See invested amount, current value, and movement in one clean view."
  },
  {
    icon: Layers3,
    title: "Asset Tracking",
    text: "Track valuables, vehicles, devices, and property in a simple system."
  },
  {
    icon: Check,
    title: "Easy Setup",
    text: "A practical money product you can launch, test, and improve fast."
  },
  {
    icon: Cloud,
    title: "Cloud-ready",
    text: "Prepared for Supabase auth, storage, and long-term web app growth."
  },
  {
    icon: BadgeIndianRupee,
    title: "Lifetime access",
    text: "PocketFlow is designed around one-time purchase logic, not subscriptions."
  }
];

const audiences = [
  { icon: GraduationCap, title: "Students", text: "Track pocket money, part-time income, and study expenses." },
  { icon: BriefcaseBusiness, title: "Salaried Professionals", text: "Manage salary, EMI, savings, and monthly budgets." },
  { icon: Store, title: "Business Owners", text: "Get daily money clarity without complex accounting software." },
  { icon: Wallet, title: "Freelancers", text: "Handle variable income, client payments, and spending smoothly." },
  { icon: LineChart, title: "Investors", text: "Keep stocks, mutual funds, and deposits in one premium view." },
  { icon: HandCoins, title: "Everyone Else", text: "If money moves in your life, PocketFlow helps you see it clearly." }
];

const faqs = [
  {
    question: "Is this a subscription?",
    answer: "No. PocketFlow is designed around a one-time purchase model."
  },
  {
    question: "Will it work on mobile?",
    answer: "Yes. The layout, quick add flow, and dashboard cards are designed mobile first."
  },
  {
    question: "Can I track lending and borrowing?",
    answer: "Yes. PocketFlow includes lend / borrow tracking as a core feature."
  },
  {
    question: "Is my data private?",
    answer: "When connected to your own Supabase or Google account setup, the data stays within your configured environment."
  },
  {
    question: "Can I customize categories?",
    answer: "Yes. The structure is built to support category, payment method, and settings customization."
  }
];

const problems = [
  "Salary credited. Bills paid. But how much is actually left?",
  "Multiple bank apps, wallets, cash, and UPI with no full picture.",
  "You rely on memory to track who you lent money to or borrowed from.",
  "Investments are scattered across apps with no single view.",
  "Month ends and you wonder: where did all the money go?",
  "No budget plan. No savings target. Just hoping things work out."
];

const solutionPoints = [
  "See your complete financial picture in one place",
  "Track every rupee — income, expenses, budgets, savings",
  "Know exactly who owes you and whom you owe",
  "Monitor investments and assets effortlessly",
  "Works beautifully on mobile",
  "Simple enough for everyday people"
];

const oldWay = [
  "Multiple apps that don't talk to each other",
  "Complex finance software with steep learning curves",
  "Subscription-based trackers that drain your wallet",
  "Scattered notes, mental math, and guesswork",
  "No proper lend / borrow view"
];

const pocketFlowWay = [
  "One unified system for your money life",
  "Simple, clean, premium finance experience",
  "One-time payment logic",
  "Mobile-first and easy to use",
  "Lending, borrowing, investments, and assets included"
];

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

function FadeIn({
  children,
  delay = 0
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fade}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
  return (
    <main className="grid-pattern min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="text-2xl font-semibold text-primary">
            PocketFlow
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block">
              <Button variant="ghost">Login</Button>
            </Link>
            <a href="#pricing">
              <Button>Get PocketFlow — ₹99</Button>
            </a>
          </div>
        </div>
      </header>

      <section className="section-space px-4 md:px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <FadeIn>
            <Badge>Trusted by 1,000+ users across India</Badge>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] md:text-7xl">
              Money comes in. <br />
              Money goes out. <br />
              <span className="text-gradient">Where does it all go?</span>
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-muted">
              PocketFlow gives you complete clarity over income, expenses, budgets, lending,
              investments, and assets — all in one secure workspace built for real people.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/signup">
                <Button className="w-full sm:w-auto">
                  Start your clarity journey <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" className="w-full sm:w-auto">
                  See features
                </Button>
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="relative mx-auto flex max-w-[540px] items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative z-10 grid items-end gap-5 sm:grid-cols-[0.8fr_1fr_0.8fr]">
                <div className="hidden translate-y-10 sm:block">
                  <PhoneMockup type="quick" />
                </div>
                <PhoneMockup type="dashboard" />
                <div className="hidden -translate-y-4 sm:block">
                  <PhoneMockup type="investment" />
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <SectionHeading
              kicker="The problem"
              align="center"
              title={
                <>
                  Your money deserves <span className="text-gradient">more care</span> than
                  this.
                </>
              }
              description="Whether it is ₹1 or ₹1 crore, confusion creates bad decisions."
            />
          </FadeIn>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {problems.map((item, index) => (
              <FadeIn key={item} delay={index * 0.05}>
                <Card className="h-full p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/12 text-danger">
                    <ArrowRight className="h-5 w-5 rotate-45" />
                  </div>
                  <p className="mt-5 text-lg leading-8 text-white/92">{item}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space px-4 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.95fr]">
          <FadeIn>
            <SectionHeading
              kicker="The solution"
              title={
                <>
                  One system. <span className="text-gradient">Total money clarity.</span>
                </>
              }
              description="PocketFlow is a beautifully structured money system that organizes your full financial life without the heaviness of complicated software."
            />
            <div className="mt-8">
              <Link href="/signup">
                <Button>Start your clarity journey</Button>
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card className="p-6 md:p-8">
              <div className="space-y-5">
                {solutionPoints.map((point) => (
                  <div key={point} className="flex items-start gap-4">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
                      <Check className="h-4 w-4" />
                    </div>
                    <p className="text-lg text-white/92">{point}</p>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>

      <section id="features" className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <SectionHeading
              align="center"
              title={
                <>
                  Everything you need. <span className="text-gradient">Nothing you don't.</span>
                </>
              }
              description="PocketFlow packs powerful finance tracking into a clean, intuitive product."
            />
          </FadeIn>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <FadeIn key={feature.title} delay={index * 0.04}>
                  <Card className="h-full p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-black">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="mt-5 text-2xl font-semibold">{feature.title}</p>
                    <p className="mt-3 text-lg leading-8 text-muted">{feature.text}</p>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <SectionHeading
              align="center"
              title={
                <>
                  Built for <span className="text-gradient">real people</span> with real money.
                </>
              }
              description="Whether you earn ₹10,000 or ₹10,00,000 a month, your money deserves organization."
            />
          </FadeIn>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {audiences.map((audience, index) => {
              const Icon = audience.icon;
              return (
                <FadeIn key={audience.title} delay={index * 0.04}>
                  <Card className="h-full p-6 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-black">
                      <Icon className="h-7 w-7" />
                    </div>
                    <p className="mt-5 text-2xl font-semibold">{audience.title}</p>
                    <p className="mt-3 text-lg leading-8 text-muted">{audience.text}</p>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <SectionHeading
              align="center"
              title={
                <>
                  See PocketFlow <span className="text-gradient">in action.</span>
                </>
              }
              description="A clean, intuitive interface designed for speed and clarity."
            />
          </FadeIn>
          <div className="mt-12 rounded-[36px] border border-white/8 bg-white/[0.03] p-6 md:p-10">
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-5">
              <PhoneMockup type="dashboard" />
              <PhoneMockup type="quick" />
              <PhoneMockup type="budget" />
              <PhoneMockup type="investment" />
              <PhoneMockup type="lend" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <SectionHeading
              kicker="Why PocketFlow"
              align="center"
              title={
                <>
                  This isn't just <span className="text-gradient">another tracker.</span>
                </>
              }
            />
          </FadeIn>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <FadeIn>
              <Card className="h-full border-danger/25 p-7">
                <p className="text-3xl font-semibold text-danger">The Old Way</p>
                <div className="mt-8 space-y-5">
                  {oldWay.map((item) => (
                    <div key={item} className="flex items-start gap-4">
                      <div className="mt-1 text-danger">✕</div>
                      <p className="text-lg leading-8 text-muted">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Card className="h-full p-7">
                <p className="text-3xl font-semibold text-primary">The PocketFlow Way</p>
                <div className="mt-8 space-y-5">
                  {pocketFlowWay.map((item) => (
                    <div key={item} className="flex items-start gap-4">
                      <div className="mt-1 text-success">✓</div>
                      <p className="text-lg leading-8 text-white/92">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      <section id="pricing" className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <Card className="overflow-hidden p-8 md:p-10">
              <div className="grid gap-8 md:grid-cols-[0.95fr_1.05fr] md:items-center">
                <div>
                  <Badge>One-time payment</Badge>
                  <h2 className="mt-6 text-4xl font-semibold md:text-6xl">
                    Simple pricing. <span className="text-gradient">Clear value.</span>
                  </h2>
                  <p className="mt-4 text-lg leading-8 text-muted">
                    PocketFlow is built to be practical. Sign up, pay once, and keep using it without monthly
                    subscription pressure.
                  </p>
                  <div className="mt-8 flex items-end gap-3">
                    <p className="text-6xl font-semibold">₹99</p>
                    <p className="pb-2 text-xl text-muted line-through">₹1000</p>
                  </div>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link href="/signup">
                      <Button>Get PocketFlow — ₹99</Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="secondary">Go to login</Button>
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4">
                  {[
                    "Access unlocks automatically after payment verification",
                    "No subscription",
                    "Razorpay order creation, verification, and webhook handling included",
                    "Built for mobile and desktop",
                    "Supabase-backed dashboard with protected routes"
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-3xl border border-white/8 bg-white/[0.03] px-5 py-4 text-lg text-white/92"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>

      <section id="faq" className="section-space px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <SectionHeading
              align="center"
              title={
                <>
                  Questions before you <span className="text-gradient">start?</span>
                </>
              }
            />
          </FadeIn>
          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <FadeIn key={faq.question} delay={index * 0.04}>
                <Card className="p-6 md:p-7">
                  <p className="text-2xl font-semibold">{faq.question}</p>
                  <p className="mt-3 text-lg leading-8 text-muted">{faq.answer}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <Card className="overflow-hidden px-8 py-10 md:px-12 md:py-14">
              <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                    Final call
                  </p>
                  <h2 className="mt-4 text-4xl font-semibold md:text-6xl">
                    Stop guessing. <span className="text-gradient">Start seeing.</span>
                  </h2>
                  <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
                    PocketFlow is built to turn scattered money management into one clear,
                    practical system.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                  <Link href="/signup">
                    <Button>Get PocketFlow — ₹99</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="secondary">Open login</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
