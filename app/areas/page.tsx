import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";
import { revalidatePath } from "next/cache";

async function createArea(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();
  await supabase.from("areas").insert({ workspace_id: workspaceId, name });
  revalidatePath("/areas");
}

export default async function AreasPage() {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();

  const { data: areas } = await supabase
    .from("areas")
    .select("id, name, description, projects(id)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  return (
    <Shell active="/areas">
      <h1>Areas</h1>
      <p className="muted">High-level categories of responsibility.</p>

      <h2>New area</h2>
      <form action={createArea} className="card">
        <div className="row">
          <input type="text" name="name" placeholder="e.g. Estimating" />
          <button type="submit">Add</button>
        </div>
      </form>

      <h2>All areas</h2>
      {(!areas || areas.length === 0) && (
        <p className="empty">No areas yet — add one above.</p>
      )}
      {areas?.map((a) => (
        <a key={a.id} href={`/projects?area=${a.id}`} className="card row">
          <span>{a.name}</span>
          <span className="muted">{a.projects?.length ?? 0} projects</span>
        </a>
      ))}
    </Shell>
  );
}
