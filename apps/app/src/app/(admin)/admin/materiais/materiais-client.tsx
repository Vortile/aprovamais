"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteMaterial } from "@/lib/actions/materiais";
import { MaterialForm } from "./material-form";
import type { Database } from "@repo/db";

type MaterialRow = Database["public"]["Tables"]["materiais"]["Row"] & {
  download_url: string | null;
};

export function MateriaisClient({ materiais }: { materiais: MaterialRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MaterialRow | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);

    const result = await deleteMaterial(deleteTarget.id);

    setDeletingId(null);
    setDeleteTarget(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {materiais.length} material{materiais.length !== 1 ? "is" : ""}{" "}
          cadastrado
          {materiais.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Material
        </Button>
      </div>

      {materiais.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Nenhum material cadastrado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar primeiro material
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materiais.map((material) => (
            <Card
              key={material.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium leading-snug">
                    {material.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      disabled={deletingId === material.id}
                      onClick={() => setDeleteTarget(material)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                    className="inline-flex"
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Material</DialogTitle>
          </DialogHeader>
          <MaterialForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir material?</AlertDialogTitle>
            <AlertDialogDescription>
              O material <strong>{deleteTarget?.title}</strong> e seu arquivo
              serão excluídos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
