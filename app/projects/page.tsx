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
  await supabase
    .from("projects")
    .insert({ area_id: areaId, name, priority });
  revalidatePath("/projects");
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { area?: string };
}) {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();

  const { data: areas } = await supabase
    .from("areas")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  let query = supabase
    .from("projects")
    .select("id, name, status, priority, target_date, area_id, deal_value, pipeline_stage, areas!inner(id, name, workspace_id)")
    .eq("areas.workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (searchParams.area) query = query.eq("area_id", searchParams.area);

  const { data: projects } = await query;

  return (
    <Shell active="/projects">
      <h1>Projects</h1>
      <p className="muted">
        {searchParams.area
          ? `Filtered to one area — `
          : "All areas — "}
        <a href="/projects" className="muted" style={{ textDecoration: "underline" }}>
          show all
        </a>
      </p>

      <h2>New project</h2>
      <form action={createProject} className="card">
        <div style={{ display: "grid", gap: 8 }}>
          <input type="text" name="name" placeholder="Project name" required />
          <select name="area_id" required defaultValue="">
            <option value="" disabled>
              Choose an area
            </option>
            {areas?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select name="priority" defaultValue="medium">
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
          <button type="submit">Add project</button>
        </div>
      </form>

      <h2>All projects</h2>
      {(!projects || projects.length === 0) && (
        <p className="empty">No projects yet — add one above.</p>
      )}
      {projects?.map((p: any) => (
        <a key={p.id} href={`/projects/${p.id}`} className="card row">
          <div>
            <div>{p.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>{p.areas?.name}</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {p.deal_value && (
              <span className="pill">${Number(p.deal_value).toLocaleString()}</span>
            )}
            {p.pipeline_stage && <span className="pill">{p.pipeline_stage}</span>}
            <span className={`pill ${p.priority}`}>{p.priority}</span>
            <span className="pill">{p.status}</span>
          </div>
        </a>
      ))}
    </Shell>
  );
}
