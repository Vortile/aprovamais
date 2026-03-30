"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAluno } from "@/lib/actions/alunos";
import { AlunoForm } from "./aluno-form";
import type { Database } from "@repo/db";

type PlanoRow = Database["public"]["Tables"]["planos"]["Row"];
type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"] & {
  profiles: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name" | "avatar_url"
  > | null;
  planos?: Pick<PlanoRow, "name" | "monthly_amount" | "active"> | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function AlunosClient({
  alunos,
  planos,
}: {
  alunos: AlunoRow[];
  planos: PlanoRow[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AlunoRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleAdd() {
    setEditing(null);
    setOpen(true);
  }

  function handleEdit(aluno: AlunoRow) {
    setEditing(aluno);
    setOpen(true);
  }

  async function handleDelete(aluno: AlunoRow) {
    const confirmed = window.confirm(
      aluno.profile_id
        ? "Excluir este aluno também apagará a conta de acesso vinculada. Esta ação não pode ser desfeita. Deseja continuar?"
        : "Deseja excluir este aluno?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(aluno.id);

    const result = await deleteAluno(aluno.id);

    setDeletingId(null);

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
          {alunos.length} aluno{alunos.length !== 1 ? "s" : ""} cadastrado
          {alunos.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Aluno
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Série</TableHead>
              <TableHead>Disciplinas</TableHead>
              <TableHead className="w-15" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nenhum aluno cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">
                    {aluno.profiles?.full_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {aluno.planos ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {aluno.planos.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(aluno.planos.monthly_amount)}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="destructive">Sem plano</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {aluno.contact_email ?? "Sem email cadastrado"}
                      </div>
                      <Badge
                        variant={aluno.profile_id ? "default" : "secondary"}
                      >
                        {aluno.profile_id ? "Conta vinculada" : "Sem conta"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{aluno.grade ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {aluno.subject_focus?.length ? (
                        aluno.subject_focus.map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-xs"
                          >
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(aluno)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={deletingId === aluno.id}
                          onClick={() => void handleDelete(aluno)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingId === aluno.id ? "Excluindo..." : "Excluir"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
          </DialogHeader>
          <AlunoForm
            aluno={editing}
            plans={planos}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
