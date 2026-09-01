import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";
import { revalidatePath } from "next/cache";

async function createProject(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const areaId = String(formData.get("area_id") || "");
  const priority = String(formData.get("priority") || "medium");
  if (!name || !areaId) return;

  const supabase = createClient();
  await supabase.from("projects").insert({ area_id: areaId, name, priority });
  revalidatePath(`/areas/${areaId}`);
}

async function addAreaNote(formData: FormData) {
  "use server";
  const content = String(formData.get("content") || "").trim();
  const areaId = String(formData.get("area_id") || "");
  const workspaceId = String(formData.get("workspace_id") || "");
  if (!content || !areaId) return;

  const supabase = createClient();
  await supabase.from("notes").insert({ content, area_id: areaId, workspace_id: workspaceId });
  revalidatePath(`/areas/${areaId}`);
}

export default async function AreaDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();

  const { data: area } = await supabase
    .from("areas")
    .select("id, name, description, kind")
    .eq("id", params.id)
    .single();

  if (!area) {
    return (
      <Shell active="/home">
        <p className="empty">Area not found.</p>
      </Shell>
    );
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, priority, deal_value, pipeline_stage, win_probability, target_date")
    .eq("area_id", area.id)
    .order("created_at", { ascending: false });

  const { data: notes } = await supabase
    .from("notes")
    .select("id, content, created_at")
    .eq("area_id", area.id)
    .order("created_at", { ascending: false });

  const isPipeline = area.kind === "pipeline";

  const totalDealValue = (projects ?? []).reduce(
    (sum, p: any) => sum + (Number(p.deal_value) || 0),
    0
  );

  return (
    <Shell active="/home">
      <h1>{area.name}</h1>
      <p className="muted">
        {isPipeline ? "Pipeline space" : "Freeform space"}
        {isPipeline && totalDealValue > 0 && (
          <> · ${totalDealValue.toLocaleString()} total pipeline value</>
        )}
      </p>

      <h2>New project</h2>
      <form action={createProject} className="card">
        <input type="hidden" name="area_id" value={area.id} />
        <div style={{ display: "grid", gap: 8 }}>
          <input type="text" name="name" placeholder="Project name" required />
          <select name="priority" defaultValue="medium">
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
          <button type="submit">Add project</button>
        </div>
      </form>

      <h2>Projects ({projects?.length ?? 0})</h2>
      {(!projects || projects.length === 0) && (
        <p className="empty">No projects yet — add one above.</p>
      )}
      {projects?.map((p: any) => (
        <a key={p.id} href={`/projects/${p.id}`} className="card row">
          <div>
            <div>{p.name}</div>
            {isPipeline && p.pipeline_stage && (
              <div className="muted" style={{ fontSize: 12 }}>
                {p.pipeline_stage}
                {p.win_probability != null ? ` · ${Math.round(Number(p.win_probability) * 100)}% win` : ""}
              </div>
            )}
          </div>
          <div className="row" style={{ gap: 8 }}>
            {isPipeline && p.deal_value && (
              <span className="pill">${Number(p.deal_value).toLocaleString()}</span>
            )}
            <span className={`pill ${p.priority}`}>{p.priority}</span>
            <span className="pill">{p.status}</span>
          </div>
        </a>
      ))}

      <h2>Notes</h2>
      <form action={addAreaNote} className="card">
        <input type="hidden" name="area_id" value={area.id} />
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <textarea name="content" placeholder="Add a note to this space…" rows={3} style={{ marginBottom: 8 }} />
        <button type="submit">Save note</button>
      </form>
      {(!notes || notes.length === 0) && <p className="empty">No notes yet.</p>}
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
