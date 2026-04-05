import type { Metadata } from "next";
import { BookOpen, Download, FileText } from "lucide-react";
import { getMaterialDownloadUrl } from "@/lib/materials";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAppSession } from "@/lib/auth/session";
import { TABLES } from "@repo/db";

export const dynamic = "force-dynamic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Materiais | Aluno" };

export default async function AlunoMateriaisPage() {
  const session = await getCurrentAppSession();
  const supabase = createAdminClient();

  // Find the aluno record for this student
  const alunoRow = session?.profile.id
    ? await (async () => {
        const { data } = await supabase
          .from(TABLES.ALUNOS)
          .select("id")
          .eq("profile_id", session.profile.id)
          .maybeSingle();
        return data as { id: string } | null;
      })()
    : null;

  if (!alunoRow) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Materiais de estudo disponibilizados pelo professor.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Nenhum material disponível no momento.
          </p>
        </div>
      </div>
    );
  }

  // Fetch only materials assigned to this student
  const { data: assignments } = await supabase
    .from(TABLES.ALUNO_MATERIAIS)
    .select("material_id")
    .eq("aluno_id", alunoRow.id);

  const materialIds = (assignments ?? []).map(
    (a) => (a as { material_id: string }).material_id,
  );

  const materiaisWithUrls =
    materialIds.length === 0
      ? []
      : await (async () => {
          const { data } = await supabase
            .from(TABLES.MATERIAIS)
            .select("*")
            .in("id", materialIds)
            .order("created_at", { ascending: false });

          return Promise.all(
            (data ?? []).map(async (m) => {
              const material = m as {
                id: string;
                title: string;
                description: string | null;
                file_url: string | null;
                subject: string | null;
                grade_level: string | null;
                uploaded_by: string | null;
                created_at: string;
              };
              return {
                ...material,
                download_url: await getMaterialDownloadUrl(material.file_url),
              };
            }),
          );
        })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Materiais</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Materiais de estudo disponibilizados pelo professor.
        </p>
      </div>

      {!materiaisWithUrls || materiaisWithUrls.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Nenhum material disponível no momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materiaisWithUrls.map((material) => (
            <Card
              key={material.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <CardTitle className="text-base font-medium leading-snug">
                    {material.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {material.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {material.subject && (
                    <Badge variant="secondary" className="text-xs">
                      {material.subject}
                    </Badge>
                  )}
                  {material.grade_level && (
                    <Badge variant="outline" className="text-xs">
                      {material.grade_level}
                    </Badge>
                  )}
                </div>
                {material.download_url && (
                  <a
                    href={material.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
