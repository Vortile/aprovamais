"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { PlanoForm } from "./plano-form";
import { deletePlano } from "@/lib/actions/planos";
import type { Database } from "@repo/db";

type Plano = Database["public"]["Tables"]["planos"]["Row"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function PlanosClient({ planos }: { planos: Plano[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Plano | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deletePlano(deleteTarget.id);
    setDeleting(false);
    if (!result.ok) {
      toast.error(result.error);
    } else {
      toast.success(result.message);
      router.refresh();
    }
    setDeleteTarget(null);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {planos.length} plano{planos.length !== 1 ? "s" : ""} cadastrado
          {planos.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {planos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Nenhum plano cadastrado. Crie o primeiro.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {planos.map((plano) => (
            <Card
              key={plano.id}
              className={plano.is_featured ? "ring-2 ring-primary" : ""}
            >
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {plano.badge && (
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        {plano.badge}
                      </p>
                    )}
                    <h3 className="font-semibold text-base truncate">
                      {plano.name}
                    </h3>
                    <p className="text-2xl font-black text-primary mt-1">
                      {formatCurrency(plano.monthly_amount)}
                      <span className="text-sm font-normal text-muted-foreground">
                        /mês
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {plano.is_featured && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mt-0.5" />
                    )}
                  </div>
                </div>

                {plano.features.length > 0 && (
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {plano.features.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-primary">✔</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {plano.description && (
                  <p className="text-xs text-muted-foreground">
                    {plano.description}
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Badge variant={plano.active ? "default" : "secondary"}>
                      {plano.active ? "Ativo" : "Inativo"}
                    </Badge>
                    {plano.billing_day && (
                      <span className="text-xs text-muted-foreground">
                        Dia {plano.billing_day}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditTarget(plano)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(plano)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Plano</DialogTitle>
          </DialogHeader>
          <PlanoForm onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <PlanoForm
              plano={editTarget}
              onSuccess={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano?</AlertDialogTitle>
            <AlertDialogDescription>
              O plano <strong>{deleteTarget?.name}</strong> será removido
              permanentemente. Alunos vinculados a ele perderão a associação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
