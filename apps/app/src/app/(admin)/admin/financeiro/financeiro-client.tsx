"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlanoForm } from "./plano-form";
import type { Database } from "@repo/db";

type Registro = Database["public"]["Tables"]["financeiro"]["Row"] & {
  alunos: {
    grade: string | null;
    plan_id: string | null;
    profiles: { full_name: string | null } | null;
  } | null;
};

type Plano = Database["public"]["Tables"]["planos"]["Row"];
type AlunoResumo = Pick<
  Database["public"]["Tables"]["alunos"]["Row"],
  "id" | "plan_id"
> & {
  profiles: { full_name: string | null } | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date + "T00:00:00").toLocaleDateString("pt-BR");
}

export function FinanceiroClient({
  registros,
  planos,
  alunos,
}: {
  registros: Registro[];
  planos: Plano[];
  alunos: AlunoResumo[];
}) {
  const [open, setOpen] = useState(false);
  const planById = new Map(planos.map((plan) => [plan.id, plan]));
  const alunosComPlano = alunos.filter((aluno) => aluno.plan_id);
  const alunosSemPlano = alunos.filter((aluno) => !aluno.plan_id);
  const expectedMonthly = alunosComPlano.reduce((acc, aluno) => {
    const plan = aluno.plan_id ? planById.get(aluno.plan_id) : null;
    return acc + (plan?.monthly_amount ?? 0);
  }, 0);
  const pagos = registros.filter((r) => r.paid_at);
  const pendentes = registros.filter((r) => !r.paid_at);
  const totalPago = pagos.reduce((acc, r) => acc + r.amount, 0);
  const totalPendente = pendentes.reduce((acc, r) => acc + r.amount, 0);
  const alunosPorPlano = alunos.reduce<Record<string, number>>((acc, aluno) => {
    if (!aluno.plan_id) {
      return acc;
    }

    acc[aluno.plan_id] = (acc[aluno.plan_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Esperada no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(expectedMonthly)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {alunosComPlano.length} aluno
              {alunosComPlano.length !== 1 ? "s" : ""} com plano
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalPago)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pagos.length} registros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(totalPendente)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pendentes.length} registros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alunos Sem Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {alunosSemPlano.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Eles não entram na projeção até receberem um plano
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Planos</h2>
            <p className="text-sm text-muted-foreground">
              Cadastre mensalidades padrão e acompanhe a receita prevista por
              plano.
            </p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plano</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Dia</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Receita Esperada</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhum plano cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                planos.map((plan) => {
                  const alunoCount = alunosPorPlano[plan.id] ?? 0;
                  const receitaEsperada = plan.monthly_amount * alunoCount;

                  return (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{plan.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {plan.description ?? "Sem descrição"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(plan.monthly_amount)}
                      </TableCell>
                      <TableCell>
                        {plan.billing_day
                          ? `Todo dia ${plan.billing_day}`
                          : "—"}
                      </TableCell>
                      <TableCell>{alunoCount}</TableCell>
                      <TableCell>{formatCurrency(receitaEsperada)}</TableCell>
                      <TableCell>
                        <Badge variant={plan.active ? "default" : "secondary"}>
                          {plan.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Lançamentos</h2>
          <p className="text-sm text-muted-foreground">
            Histórico dos pagamentos registrados manualmente.
          </p>
        </div>
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Nenhum registro financeiro.
                  </TableCell>
                </TableRow>
              ) : (
                registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.alunos?.profiles?.full_name ?? "—"}
                    </TableCell>
                    <TableCell>{formatCurrency(r.amount)}</TableCell>
                    <TableCell>{formatDate(r.due_date)}</TableCell>
                    <TableCell>
                      {r.paid_at ? formatDate(r.paid_at.split("T")[0]) : "—"}
                    </TableCell>
                    <TableCell>
                      {r.paid_at ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        >
                          Pago
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                          Pendente
                        </Badge>
                      )}
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
              <DialogTitle>Novo Plano</DialogTitle>
            </DialogHeader>
            <PlanoForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
