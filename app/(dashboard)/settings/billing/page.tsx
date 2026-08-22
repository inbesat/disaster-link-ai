"use client";

import { useState, useEffect } from "react";
import { CreditCard, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { createCheckoutSession, createCustomerPortalSession, getSubscriptionStatus } from "@/app/actions/billing";

const PRICE_IDS = {
  pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
  pro_yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || "price_pro_yearly",
  enterprise: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise",
};

type SubscriptionStatus = "free" | "active" | "past_due" | "canceled" | "trialing" | null;

interface BillingData {
  subscription_status: SubscriptionStatus;
  stripe_price_id: string | null;
  stripe_current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    void loadBilling();
  }, []);

  async function loadBilling() {
    try {
      const data = await getSubscriptionStatus();
      setBilling(data);
    } catch (error) {
      console.error("[Billing] Failed to load:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(priceId: string) {
    setActionLoading(priceId);
    try {
      const { url } = await createCheckoutSession(priceId);
      if (url) window.location.href = url;
    } catch (error: unknown) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Failed to start checkout" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManageBilling() {
    setActionLoading("portal");
    try {
      const { url } = await createCustomerPortalSession();
      if (url) window.location.href = url;
    } catch (error: unknown) {
      setToast({ type: "error", message: error instanceof Error ? error.message : "Failed to open billing portal" });
    } finally {
      setActionLoading(null);
    }
  }

  function getPlanName(priceId: string | null | undefined): string {
    if (!priceId) return "Free";
    if (priceId === PRICE_IDS.pro_monthly) return "Pro Monthly";
    if (priceId === PRICE_IDS.pro_yearly) return "Pro Yearly";
    if (priceId === PRICE_IDS.enterprise) return "Enterprise";
    return "Custom";
  }

  function getStatusBadge(status: SubscriptionStatus) {
    const badges: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      free: { label: "Free", icon: <CreditCard className="h-4 w-4" />, className: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
      active: { label: "Active", icon: <CheckCircle className="h-4 w-4" />, className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
      trialing: { label: "Trialing", icon: <Clock className="h-4 w-4" />, className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
      past_due: { label: "Past Due", icon: <AlertCircle className="h-4 w-4" />, className: "bg-red-500/10 text-red-400 border-red-500/30" },
      canceled: { label: "Canceled", icon: <XCircle className="h-4 w-4" />, className: "bg-slate-500/10 text-slate-500 border-slate-500/30" },
    };
    return badges[status || "free"] || badges.free;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-accent border-t-transparent" />
      </div>
    );
  }

  const status = billing?.subscription_status || "free";
  const badge = getStatusBadge(status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="mt-1 text-slate-400">Manage your plan, payment method, and billing history.</p>
      </div>

      {/* Current Plan Card */}
      <div className="eoc-panel rounded-xl border border-border/50">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="eoc-label text-accent">CURRENT PLAN</p>
              <h2 className="mt-1 text-xl font-semibold">{getPlanName(billing?.stripe_price_id)}</h2>
            </div>
            <div className={`flex items-center gap-2 rounded-full border px-4 py-2 ${badge.className}`}>
              {badge.icon}
              <span className="font-medium">{badge.label}</span>
            </div>
          </div>
        </div>

        {billing?.stripe_current_period_end && (
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-slate-400">{billing.cancel_at_period_end ? "Cancels on" : "Renews on"}</p>
                <p className="font-medium">
                  {new Date(billing.stripe_current_period_end).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {status === "active" && !billing.cancel_at_period_end && (
              <button
                onClick={handleManageBilling}
                disabled={actionLoading === "portal"}
                className="rounded-md border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-elevated disabled:opacity-50"
              >
                {actionLoading === "portal" ? "Opening..." : "Manage Billing"}
              </button>
            )}
          </div>
        )}

        {status === "free" && (
          <div className="p-6">
            <p className="text-slate-400 mb-4">Upgrade to unlock premium features:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlanCard
                name="Pro Monthly"
                price="$29"
                period="/month"
                features={["Advanced flood predictions", "Priority SMS alerts", "AI evacuation planning", "5 team members"]}
                priceId={PRICE_IDS.pro_monthly}
                loading={actionLoading === PRICE_IDS.pro_monthly}
                onClick={handleCheckout}
              />
              <PlanCard
                name="Pro Yearly"
                price="$290"
                period="/year"
                features={["Everything in Monthly", "2 months free", "Priority support", "5 team members"]}
                priceId={PRICE_IDS.pro_yearly}
                loading={actionLoading === PRICE_IDS.pro_yearly}
                onClick={handleCheckout}
                popular
              />
            </div>
            <div className="mt-4">
              <PlanCard
                name="Enterprise"
                price="Custom"
                period=""
                features={["Unlimited team members", "Custom integrations", "Dedicated support", "SLA guarantee", "On-premise option"]}
                priceId={PRICE_IDS.enterprise}
                loading={actionLoading === PRICE_IDS.enterprise}
                onClick={handleCheckout}
                enterprise
              />
            </div>
          </div>
        )}

        {status === "canceled" && (
          <div className="p-6">
            <p className="text-slate-400 mb-4">Your subscription has been canceled. You can resubscribe anytime.</p>
            <button
              onClick={handleManageBilling}
              disabled={actionLoading === "portal"}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/80 disabled:opacity-50"
            >
              Resubscribe
            </button>
          </div>
        )}

        {status === "past_due" && (
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden />
              <div>
                <p className="font-medium text-red-300">Payment Failed</p>
                <p className="text-sm text-slate-400">Your subscription is past due. Update your payment method to restore access.</p>
              </div>
            </div>
            <button
              onClick={handleManageBilling}
              disabled={actionLoading === "portal"}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              Update Payment Method
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`eoc-panel rounded-xl border px-4 py-3 shadow-lg flex items-center gap-3 ${
            toast.type === "success" ? "border-emerald-500/30" : "border-red-500/30"
          }`}>
            {toast.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" aria-hidden />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden />
            )}
            <span className="text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  priceId,
  loading,
  onClick,
  popular = false,
  enterprise = false,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  priceId: string;
  loading: boolean;
  onClick: (priceId: string) => void;
  popular?: boolean;
  enterprise?: boolean;
}) {
  return (
    <div className={`relative eoc-panel rounded-xl border p-5 transition ${popular ? "border-accent/50 ring-1 ring-accent/20" : "border-border"} ${enterprise ? "border-slate-700" : ""}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-slate-950">
          Best Value
        </div>
      )}
      <div className="mb-4">
        <h3 className="font-semibold">{name}</h3>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-slate-400">{period}</span>
        </div>
      </div>
      <ul className="space-y-2 mb-5">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={() => onClick(priceId)}
        disabled={loading}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
          enterprise
            ? "border border-border bg-surface-muted text-foreground hover:bg-surface-elevated"
            : popular
            ? "bg-accent text-slate-950 hover:bg-accent/80"
            : "border border-border bg-surface-muted text-foreground hover:bg-surface-elevated"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 inline-block mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </>
        ) : enterprise ? (
          "Contact Sales"
        ) : (
          `Upgrade to ${name}`
        )}
      </button>
    </div>
  );
}