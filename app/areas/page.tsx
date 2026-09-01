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
  revalidatePath("/areas");
}

export default async function AreasPage() {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();

  const { data: areas } = await supabase
    .from("areas")
    .select("id, name, description, kind, projects(id)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  return (
    <Shell active="/areas">
      <h1>Areas</h1>
      <p className="muted">High-level categories of responsibility.</p>

      <h2>All areas</h2>
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
    </Shell>
  );
}
