import { createClient } from "@/lib/supabase/server";

// Every table in Alfred hangs off a workspace_id, which is what lets us
// keep Work / Independent Ventures / Personal contexts separate later via
// Row-Level Security. For V1 (single user, single context) we just make
// sure one workspace exists and return its id — the UI doesn't expose
// workspace switching yet, but the schema is already ready for it.
export async function getOrCreateWorkspaceId(): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membership) return membership.workspace_id;

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: "My Workspace" })
    .select("id")
    .single();

  if (wsError || !workspace) {
    throw new Error(wsError?.message ?? "Failed to create workspace");
  }

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: user.id, role: "owner" });

  if (memberError) throw new Error(memberError.message);

  return workspace.id;
}
