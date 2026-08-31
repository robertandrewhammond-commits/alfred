import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";
import { revalidatePath } from "next/cache";

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

      <h2>All areas</h2>
      {(!areas || areas.length === 0) && (
        <p className="empty">No areas yet — add one above.</p>
      )}
      {areas?.map((a: any) => (
        <a key={a.id} href={`/areas/${a.id}`} className="card row">
          <span>{a.name}</span>
          <div className="row" style={{ gap: 8 }}>
            <span className="pill">{a.kind === "pipeline" ? "Pipeline" : "Freeform"}</span>
            <span className="muted">{a.projects?.length ?? 0} projects</span>
          </div>
        </a>
      ))}
    </Shell>
  );
}
