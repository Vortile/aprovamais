import type { Metadata } from "next";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { getCurrentAppSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/supabase/env";
import { MateriaisClient } from "./materiais-client";
import type { TableRow } from "@/lib/supabase/typed";
import { TABLES } from "@repo/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Materiais | Admin" };

export default async function MateriaisPage() {
  const session = await getCurrentAppSession();
  const supabase = createAdminClient();
  const isAdmin = session?.profile.role === ROLES.ADMIN;

  let materiaisQuery = supabase
    .from(TABLES.MATERIAIS)
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin && session) {
    materiaisQuery = materiaisQuery.eq("uploaded_by", session.profile.id);
  }

  const { data: materiais } = await materiaisQuery;

  // Collect unique uploader profile IDs for name lookup
  const uploaderIds = [
    ...new Set(
      ((materiais ?? []) as TableRow<"materiais">[])
        .map((m) => m.uploaded_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const uploaderNames: Record<string, string | null> = {};

  if (uploaderIds.length > 0) {
    const { data: profiles } = await supabase
      .from(TABLES.PROFILES)
      .select("id, full_name")
      .in("id", uploaderIds);

    for (const profile of profiles ?? []) {
      const p = profile as { id: string; full_name: string | null };
      uploaderNames[p.id] = p.full_name;
    }
  }

  const materiaisWithMeta = await Promise.all(
    ((materiais ?? []) as TableRow<"materiais">[]).map(async (material) => ({
      ...material,
      download_url: await getMaterialDownloadUrl(material.file_url),
      uploader_name: material.uploaded_by
        ? (uploaderNames[material.uploaded_by] ?? null)
        : null,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin
            ? "Veja e gerencie todos os materiais de estudo."
            : "Faça upload e organize seus materiais de estudo."}
        </p>
      </div>
      <MateriaisClient
        materiais={materiaisWithMeta}
        isAdmin={isAdmin ?? false}
      />
    </div>
  );
}
