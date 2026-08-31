import Shell from "@/components/Shell";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWorkspaceId } from "@/lib/alfred/workspace";
import { revalidatePath } from "next/cache";

async function capture(formData: FormData) {
  "use server";
  const content = String(formData.get("content") || "").trim();
  if (!content) return;

  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();
  await supabase.from("inbox_items").insert({ workspace_id: workspaceId, content });
  revalidatePath("/inbox");
}

async function dismiss(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "");
  const supabase = createClient();
  await supabase
    .from("inbox_items")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/inbox");
}

export default async function InboxPage() {
  const workspaceId = await getOrCreateWorkspaceId();
  const supabase = createClient();

  const { data: items } = await supabase
    .from("inbox_items")
    .select("id, content, created_at")
    .eq("workspace_id", workspaceId)
    .is("processed_at", null)
    .order("created_at", { ascending: false });

  return (
    <Shell active="/inbox">
      <h1>Inbox</h1>
      <p className="muted">
        Capture anything without deciding where it belongs yet.
      </p>

      <form action={capture} className="card" style={{ marginTop: 16 }}>
        <div className="row">
          <input
            type="text"
            name="content"
            placeholder="Call John about Project X…"
          />
          <button type="submit">Capture</button>
        </div>
      </form>

      <h2>Unprocessed ({items?.length ?? 0})</h2>
      {(!items || items.length === 0) && (
        <p className="empty">Inbox is clear.</p>
      )}
      {items?.map((i) => (
        <div key={i.id} className="card row">
          <span>{i.content}</span>
          <form action={dismiss}>
            <input type="hidden" name="id" value={i.id} />
            <button type="submit" className="secondary">
              Done
            </button>
          </form>
        </div>
      ))}
    </Shell>
  );
}
