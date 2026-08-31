import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";

export default async function HomePage() {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: overdue },
    { data: dueToday },
    { data: upcoming },
    { data: waiting },
    { data: inboxItems },
    { data: highPriorityProjects },
  ] = await Promise.all([
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
    supabase
      .from("projects")
      .select("id, name, priority, areas!inner(workspace_id)")
      .eq("areas.workspace_id", workspaceId)
      .eq("priority", "high")
      .neq("status", "complete"),
  ]);

  return (
    <Shell active="/home">
      <h1>Good {timeOfDay()}.</h1>
      <p className="muted">Here's what needs your attention.</p>

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

      <h2>High Priority Projects</h2>
      {(!highPriorityProjects || highPriorityProjects.length === 0) && (
        <p className="empty">None flagged high priority.</p>
      )}
      {highPriorityProjects?.map((p: any) => (
        <a key={p.id} href={`/projects/${p.id}`} className="card row">
          <span>{p.name}</span>
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

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
