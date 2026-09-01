import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";

  let query = supabase
    .from("people")
    .select("id, full_name, job_title, email, phone, role_category, decision_maker, relationship_strength, companies(name, tier)")
    .eq("workspace_id", workspaceId)
    .order("full_name", { ascending: true });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,job_title.ilike.%${q}%`);
  }

  const { data: people } = await query;

  return (
    <Shell active="/people">
      <h1>People</h1>
      <p className="muted">Contacts across your GC relationships.</p>

      <form className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <input type="text" name="q" placeholder="Search name or title…" defaultValue={q} />
          <button type="submit">Search</button>
        </div>
      </form>

      <h2>{people?.length ?? 0} contacts</h2>
      {(!people || people.length === 0) && <p className="empty">No contacts found.</p>}
      {people?.map((p: any) => (
        <a key={p.id} href={`/people/${p.id}`} className="card" style={{ display: "block" }}>
          <div className="row">
            <div>
              <div style={{ fontWeight: 600 }}>{p.full_name}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {p.job_title || "—"}
                {p.companies?.name ? ` · ${p.companies.name}` : ""}
              </div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              {p.decision_maker && (
                <span className={`pill ${p.decision_maker.startsWith("High") ? "high" : p.decision_maker.startsWith("Medium") ? "medium" : ""}`}>
                  {p.decision_maker.split(" — ")[0]}
                </span>
              )}
              {p.relationship_strength && <span className="pill">{p.relationship_strength}</span>}
            </div>
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
            {p.email ? p.email : ""}{p.email && p.phone ? " · " : ""}{p.phone ? p.phone : ""}
          </div>
        </a>
      ))}
    </Shell>
  );
}
