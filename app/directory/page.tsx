import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DirectoryMember = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  organization: string | null;
  avatar_url: string | null;
  assigned_district: string | null;
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface-elevated text-lg font-bold text-accent">
      {initials || "?"}
    </div>
  );
}

export default async function DirectoryPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, email, role, organization, avatar_url, assigned_district")
    .order("name", { ascending: true });

  const members: DirectoryMember[] = data ?? [];

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <header className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-slate-400 transition hover:text-accent">
          ← Back to home
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <span className="h-3 w-3 animate-pulse-ring rounded-full bg-severity-green-500" />
          <div>
            <h1 className="text-2xl font-bold">Responder Directory</h1>
            <p className="text-sm text-slate-400">
              {members.length} verified {members.length === 1 ? "member" : "members"} on
              the response network
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <div key={member.id} className="eoc-panel p-5">
            <div className="flex items-center gap-4">
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={member.name ?? member.email}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-full border border-border object-cover"
                />
              ) : (
                <Initials name={member.name ?? member.email} />
              )}
              <div className="min-w-0">
                <h3 className="truncate font-semibold">
                  {member.name ?? "Unnamed Responder"}
                </h3>
                <p className="eoc-label mt-1">
                  {member.role?.replace("_", " ") ?? "responder"}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-sm text-slate-300">
              <p>
                <span className="eoc-label mr-2">ORG</span>
                {member.organization ?? "—"}
              </p>
              <p>
                <span className="eoc-label mr-2">DISTRICT</span>
                {member.assigned_district ?? member.email}
              </p>
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-severity-green-600 bg-severity-green-600/10 px-3 py-1 text-xs font-semibold text-severity-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-severity-green-500" />
              Status: Active
            </span>
          </div>
        ))}
      </section>

      {members.length === 0 && (
        <p className="mx-auto mt-16 max-w-6xl text-center text-sm text-slate-500">
          No responders registered yet. Check back after team members complete their
          profile setup.
        </p>
      )}
    </main>
  );
}
