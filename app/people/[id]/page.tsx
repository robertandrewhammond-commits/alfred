import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";

export default async function PersonDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: person } = await supabase
    .from("people")
    .select(
      "id, full_name, job_title, email, phone, role_category, decision_maker, relationship_strength, notes, how_we_know_them, linkedin, next_followup, last_contact, companies(name, tier, relationship_status, market_type)"
    )
    .eq("id", params.id)
    .single();

  if (!person) {
    return (
      <Shell active="/people">
        <p className="empty">Person not found.</p>
      </Shell>
    );
  }

  const company = person.companies as any;

  return (
    <Shell active="/people">
      <a href="/people" className="muted" style={{ fontSize: 12, textDecoration: "underline" }}>
        ← Back to People
      </a>
      <h1 style={{ marginTop: 10 }}>{person.full_name}</h1>
      <p className="muted">
        {person.job_title || "—"}
        {company?.name ? ` · ${company.name}` : ""}
      </p>

      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        {person.decision_maker && (
          <span className={`pill ${person.decision_maker.startsWith("High") ? "high" : person.decision_maker.startsWith("Medium") ? "medium" : ""}`}>
            {person.decision_maker}
          </span>
        )}
        {person.relationship_strength && <span className="pill">{person.relationship_strength}</span>}
      </div>

      <h2>Contact</h2>
      <div className="card">
        {person.email && <div>{person.email}</div>}
        {person.phone && <div className="muted" style={{ marginTop: person.email ? 4 : 0 }}>{person.phone}</div>}
        {person.linkedin && (
          <div style={{ marginTop: 4 }}>
            <a href={person.linkedin} target="_blank" className="muted" style={{ textDecoration: "underline" }}>
              LinkedIn
            </a>
          </div>
        )}
        {!person.email && !person.phone && !person.linkedin && (
          <span className="empty">No contact info on file.</span>
        )}
      </div>

      {company?.name && (
        <>
          <h2>Company</h2>
          <div className="card">
            <div style={{ fontWeight: 600 }}>{company.name}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {[company.tier, company.relationship_status, company.market_type].filter(Boolean).join(" · ")}
            </div>
          </div>
        </>
      )}

      {(person.next_followup || person.last_contact) && (
        <>
          <h2>Timing</h2>
          <div className="card row">
            <span className="muted">Last contact</span>
            <span>{person.last_contact ? new Date(person.last_contact).toLocaleDateString() : "—"}</span>
          </div>
          <div className="card row">
            <span className="muted">Next follow-up</span>
            <span>{person.next_followup ? new Date(person.next_followup).toLocaleDateString() : "—"}</span>
          </div>
        </>
      )}

      {person.how_we_know_them && (
        <>
          <h2>How we know them</h2>
          <div className="card">{person.how_we_know_them}</div>
        </>
      )}

      {person.notes && (
        <>
          <h2>Relationship notes</h2>
          <div className="card" style={{ whiteSpace: "pre-wrap" }}>{person.notes}</div>
        </>
      )}
    </Shell>
  );
}
