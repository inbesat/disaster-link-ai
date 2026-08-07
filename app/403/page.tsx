import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Access Denied | Disaster Response",
};

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="eoc-panel w-full max-w-md p-8 text-center">
        <p className="eoc-label mb-3 text-severity-red-400">ACCESS DENIED</p>
        <h1 className="text-6xl font-bold text-severity-red-500">403</h1>
        <p className="mt-4 text-slate-300">
          You do not have permission to access this resource. If you believe this is a
          mistake, contact your district admin.
        </p>
        <Link
          href="/command-center"
          className="mt-6 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-accent/80"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
