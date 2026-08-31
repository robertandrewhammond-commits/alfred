import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? "";

  let projects: any[] = [];
  let tasks: any[] = [];
  let notes: any[] = [];

  if (q) {
    const [p, t, n] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, areas!inner(workspace_id)")
        .eq("areas.workspace_id", workspaceId)
        .ilike("name", `%${q}%`),
      supabase
        .from("tasks")
        .select("id, title, project_id")
        .eq("workspace_id", workspaceId)
        .ilike("title", `%${q}%`),
      supabase
        .from("notes")
        .select("id, content, project_id")
        .eq("workspace_id", workspaceId)
        .ilike("content", `%${q}%`),
    ]);
    projects = p.data ?? [];
    tasks = t.data ?? [];
    notes = n.data ?? [];
  }

  return (
    <Shell active="/search">
      <h1>Search</h1>
      <form className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <input type="text" name="q" placeholder="Search projects, tasks, notes…" defaultValue={q} />
          <button type="submit">Search</button>
        </div>
      </form>

      {q && (
        <>
          <h2>Projects ({projects.length})</h2>
          {projects.length === 0 && <p className="empty">No matches.</p>}
          {projects.map((p) => (
            <a key={p.id} href={`/projects/${p.id}`} className="card row">
              <span>{p.name}</span>
            </a>
          ))}

          <h2>Tasks ({tasks.length})</h2>
          {tasks.length === 0 && <p className="empty">No matches.</p>}
          {tasks.map((t) => (
            <a key={t.id} href={`/projects/${t.project_id}`} className="card row">
              <span>{t.title}</span>
            </a>
          ))}

          <h2>Notes ({notes.length})</h2>
          {notes.length === 0 && <p className="empty">No matches.</p>}
          {notes.map((n) => (
            <a key={n.id} href={`/projects/${n.project_id}`} className="card">
              <span>{n.content}</span>
            </a>
          ))}
        </>
      )}
    </Shell>
  );
}
