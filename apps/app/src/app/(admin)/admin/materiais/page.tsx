import type { Metadata } from "next";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { createAdminClient } from "@/lib/supabase/admin";
import { MateriaisClient } from "./materiais-client";
import type { TableRow } from "@/lib/supabase/typed";
import { TABLES } from "@repo/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Materiais | Admin" };

export default async function MateriaisPage() {
  const supabase = createAdminClient();

  const { data: materiais } = await supabase
    .from(TABLES.MATERIAIS)
    .select("*")
    .order("created_at", { ascending: false });

  const materiaisWithUrls = await Promise.all(
    ((materiais ?? []) as TableRow<"materiais">[]).map(async (material) => ({
      ...material,
      download_url: await getMaterialDownloadUrl(material.file_url),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Faça upload e organize os materiais de estudo.
        </p>
      </div>
      <MateriaisClient materiais={materiaisWithUrls} />
    </div>
  );
}
