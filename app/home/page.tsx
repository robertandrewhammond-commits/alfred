import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";
import { revalidatePath } from "next/cache";
import { areaInitials, areaColor } from "@/lib/alfred/avatar";

async function createArea(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const kind = String(formData.get("kind") || "freeform");
  if (!name) return;

  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();
  await supabase.from("areas").insert({ workspace_id: workspaceId, name, kind });
  revalidatePath("/home");
}

export default async function HomePage() {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: areas },
    { data: overdue },
    { data: dueToday },
    { data: upcoming },
    { data: waiting },
    { data: inboxItems },
  ] = await Promise.all([
    supabase
      .from("areas")
      .select("id, name, description, kind, projects(id)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, due_date, project_id")
      .eq("workspace_id", workspaceId)
      .neq("status", "complete")
      .lt("due_date", today)
      .order("due_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("id, title, project_id")
      .eq("workspace_id", workspaceId)
      .neq("status", "complete")
      .eq("due_date", today),
    supabase
      .from("tasks")
      .select("id, title, due_date, project_id")
      .eq("workspace_id", workspaceId)
      .neq("status", "complete")
      .gt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, project_id")
      .eq("workspace_id", workspaceId)
      .eq("status", "waiting"),
    supabase
      .from("inbox_items")
      .select("id")
      .eq("workspace_id", workspaceId)
      .is("processed_at", null),
  ]);

  return (
    <Shell active="/home">
      <h1>Alfred</h1>
      <p className="muted">Pick a space to jump into.</p>

      {(!areas || areas.length === 0) && (
        <p className="empty">No areas yet — add one below.</p>
      )}
      <div className="area-grid">
        {areas?.map((a: any) => (
          <a key={a.id} href={`/areas/${a.id}`} className="area-tile">
            <div className="area-avatar" style={{ background: areaColor(a.id) }}>
              {areaInitials(a.name)}
            </div>
            <div className="area-tile-name">{a.name}</div>
            <div className="area-tile-meta">
              {a.projects?.length ?? 0} projects · {a.kind === "pipeline" ? "Pipeline" : "Freeform"}
            </div>
          </a>
        ))}
      </div>

      <h2>New area</h2>
      <form action={createArea} className="card">
        <div style={{ display: "grid", gap: 8 }}>
          <input type="text" name="name" placeholder="e.g. Estimating" />
          <select name="kind" defaultValue="freeform">
            <option value="freeform">Freeform (notes-first — knowledge, side projects)</option>
            <option value="pipeline">Pipeline (deal value, stage, win probability)</option>
          </select>
          <button type="submit">Add</button>
        </div>
      </form>

      <h2>Overdue ({overdue?.length ?? 0})</h2>
      {(!overdue || overdue.length === 0) && <p className="empty">Nothing overdue.</p>}
      {overdue?.map((t) => (
        <a key={t.id} href={`/projects/${t.project_id}`} className="card row">
          <span>{t.title}</span>
          <span className="pill high">{t.due_date}</span>
        </a>
      ))}

      <h2>Today ({dueToday?.length ?? 0})</h2>
      {(!dueToday || dueToday.length === 0) && <p className="empty">Nothing due today.</p>}
      {dueToday?.map((t) => (
        <a key={t.id} href={`/projects/${t.project_id}`} className="card row">
          <span>{t.title}</span>
        </a>
      ))}

      <h2>Upcoming</h2>
      {(!upcoming || upcoming.length === 0) && <p className="empty">Nothing on the horizon.</p>}
      {upcoming?.map((t) => (
        <a key={t.id} href={`/projects/${t.project_id}`} className="card row">
          <span>{t.title}</span>
          <span className="muted">{t.due_date}</span>
        </a>
      ))}

      <h2>Waiting On</h2>
      {(!waiting || waiting.length === 0) && <p className="empty">Not waiting on anything.</p>}
      {waiting?.map((t) => (
        <a key={t.id} href={`/projects/${t.project_id}`} className="card row">
          <span>{t.title}</span>
        </a>
      ))}

      <h2>Inbox</h2>
      <a href="/inbox" className="card row">
        <span>Unprocessed items</span>
        <span className="pill">{inboxItems?.length ?? 0}</span>
      </a>
    </Shell>
  );
}
