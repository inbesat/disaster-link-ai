import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  LifeBuoy,
  Mail,
  Phone,
} from "lucide-react";
import HelpImage from "@/components/help/HelpImage";
import {
  HELP_TOPICS,
  getHelpTopic,
} from "@/lib/help-content";

// ---------------------------------------------------------------------
// app/(public)/help/[topic]/page.tsx — one help article.
//
// Numbered steps + real screenshot + related topics + contact strip.
// Statically generated for every topic in lib/help-content.ts
// (generateStaticParams), so articles are instant to open.
// ---------------------------------------------------------------------

type Params = { params: { topic: string } };

export function generateStaticParams() {
  return HELP_TOPICS.map((t) => ({ topic: t.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const topic = getHelpTopic(params.topic);
  if (!topic) return { title: "Help" };
  return {
    title: topic.title,
    description: topic.summary,
  };
}

export default function HelpArticlePage({ params }: Params) {
  const topic = getHelpTopic(params.topic);
  if (!topic) notFound();

  const related = topic.related
    .map((id) => getHelpTopic(id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-col bg-[var(--dl-navy)] pb-24 text-[var(--dl-text-on-navy)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(37,99,235,0.15),transparent)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        {/* Breadcrumb back */}
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          All help topics
        </Link>

        {/* Header */}
        <header className="mt-5">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {topic.title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
            {topic.summary}
          </p>
        </header>

        {/* Screenshot */}
        <HelpImage
          src={topic.image}
          alt={`${topic.title} — screenshot`}
          topicTitle={topic.title}
          className="mt-7"
        />

        {/* Steps */}
        <ol className="mt-9 space-y-5" aria-label={`Steps: ${topic.title}`}>
          {topic.steps.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--dl-blue)]/20 font-mono text-sm font-bold text-[var(--dl-blue-light)] ring-1 ring-[var(--dl-blue)]/40"
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <h2 className="text-sm font-bold text-white">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Success note */}
        <p className="mt-8 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          That&apos;s it — you&apos;re set. If anything didn&apos;t match what you see, tell us and
          we&apos;ll fix the guide.
        </p>

        {/* Related */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-10">
            <h2 id="related-heading" className="eoc-label mb-3 text-slate-500">
              Related topics
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/help/${r.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
                  >
                    <span className="min-w-0 truncate text-sm font-semibold text-slate-200">
                      {r.title}
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Contact strip */}
        <section
          aria-labelledby="article-contact"
          className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
        >
          <div className="flex items-center gap-3">
            <LifeBuoy aria-hidden="true" className="h-5 w-5 text-[var(--dl-blue-light)]" />
            <h2 id="article-contact" className="text-base font-bold text-white">
              Didn&apos;t find your answer?
            </h2>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:safesphere095@gmail.com?subject=Help:%20question%20about%20SafeSphere"
              className="inline-flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
            >
              <Mail aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--dl-blue-light)]" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Email support</span>
                <span className="block truncate text-xs text-slate-400">safesphere095@gmail.com</span>
              </span>
            </a>
            <a
              href="tel:+919625130964"
              className="inline-flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 transition hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dl-blue)]"
            >
              <Phone aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-400" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">Helpline</span>
                <span className="block truncate text-xs text-slate-400">+91-9625130964</span>
              </span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
