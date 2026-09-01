import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";
import { revalidatePath } from "next/cache";

async function createTask(formData: FormData) {
  "use server";
  const title = String(formData.get("title") || "").trim();
  const projectId = String(formData.get("project_id") || "");
  const workspaceId = String(formData.get("workspace_id") || "");
  if (!title || !projectId) return;

  const supabase = createClient();
  await supabase
    .from("tasks")
    .insert({ title, project_id: projectId, workspace_id: workspaceId });
  revalidatePath(`/projects/${projectId}`);
}

async function updateTaskStatus(formData: FormData) {
  "use server";
  const taskId = String(formData.get("task_id") || "");
  const status = String(formData.get("status") || "");
  const projectId = String(formData.get("project_id") || "");
  const supabase = createClient();
  await supabase.from("tasks").update({ status }).eq("id", taskId);
  revalidatePath(`/projects/${projectId}`);
}

async function addNote(formData: FormData) {
  "use server";
  const content = String(formData.get("content") || "").trim();
  const projectId = String(formData.get("project_id") || "");
  const workspaceId = String(formData.get("workspace_id") || "");
  if (!content || !projectId) return;

  const supabase = createClient();
  await supabase
    .from("notes")
    .insert({ content, project_id: projectId, workspace_id: workspaceId });
  revalidatePath(`/projects/${projectId}`);
}

const statuses = [
  "inbox",
  "not_started",
  "next",
  "in_progress",
  "waiting",
  "blocked",
  "complete",
];

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, description, status, priority, target_date, deal_value, estimated_cost, win_probability, pipeline_stage, notion_notes, areas(name)")
    .eq("id", params.id)
    .single();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .eq("project_id", params.id)
    .order("created_at", { ascending: false });

  const { data: notes } = await supabase
    .from("notes")
    .select("id, content, created_at")
    .eq("project_id", params.id)
    .order("created_at", { ascending: false });

  if (!project) {
    return (
      <Shell active="/projects">
        <p className="empty">Project not found.</p>
      </Shell>
    );
  }

  return (
    <Shell active="/projects">
      <h1>{project.name}</h1>
      <p className="muted">
        {(project.areas as any)?.name} · {project.status} · {project.priority} priority
      </p>

      {(project.deal_value || project.pipeline_stage) && (
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          {project.deal_value && (
            <span className="pill">${Number(project.deal_value).toLocaleString()}</span>
          )}
          {project.estimated_cost && (
            <span className="pill">Cost: ${Number(project.estimated_cost).toLocaleString()}</span>
          )}
          {project.win_probability != null && (
            <span className="pill">{Math.round(Number(project.win_probability) * 100)}% win</span>
          )}
          {project.pipeline_stage && <span className="pill">{project.pipeline_stage}</span>}
        </div>
      )}

      {project.notion_notes && (
        <>
          <h2>Intelligence</h2>
          <div className="card" style={{ whiteSpace: "pre-wrap" }}>{project.notion_notes}</div>
        </>
      )}

      <h2>Tasks</h2>
      <form action={createTask} className="card">
        <input type="hidden" name="project_id" value={project.id} />
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <div className="row">
          <input type="text" name="title" placeholder="New task title" />
          <button type="submit">Add</button>
        </div>
      </form>
      {(!tasks || tasks.length === 0) && (
        <p className="empty">No tasks yet.</p>
      )}
      {tasks?.map((t) => (
        <div key={t.id} className="card row">
          <span>{t.title}</span>
          <form action={updateTaskStatus} className="row" style={{ gap: 6 }}>
            <input type="hidden" name="task_id" value={t.id} />
            <input type="hidden" name="project_id" value={project.id} />
            <select name="status" defaultValue={t.status}>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <button type="submit" className="secondary">
              Save
            </button>
          </form>
        </div>
      ))}

      <h2>Notes</h2>
      <form action={addNote} className="card">
        <input type="hidden" name="project_id" value={project.id} />
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <textarea name="content" placeholder="Add a note…" rows={3} style={{ marginBottom: 8 }} />
        <button type="submit">Save note</button>
      </form>
      {(!notes || notes.length === 0) && (
        <p className="empty">No notes yet.</p>
      )}
      {notes?.map((n) => (
        <div key={n.id} className="card">
          <div>{n.content}</div>
          <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
            {new Date(n.created_at).toLocaleString()}
          </div>
        </div>
      ))}
    </Shell>
  );
}
