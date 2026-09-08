"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  atualizarDatasEventoAction,
  registrarCheckinAction,
  reenviarIngressoAction,
  type EventoDashboardData,
} from "@/lib/actions/eventos";

function formatCurrency(centavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

function statusBadge(status: string) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    aprovado: { label: "Aprovado", variant: "default" },
    pendente: { label: "Pendente", variant: "secondary" },
    recusado: { label: "Recusado", variant: "destructive" },
    cancelado: { label: "Cancelado", variant: "outline" },
  };
  const config = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const FUNIL_LABELS: Record<keyof EventoDashboardData["funil"], string> = {
  pageViews: "Visitantes da Landing Page",
  ctaClicks: "Cliques no CTA",
  formStarted: "Iniciaram o Formulário",
  formSubmitted: "Enviaram o Formulário",
  pixGenerated: "Geraram PIX",
  cardStarted: "Iniciaram Cartão",
  paymentApproved: "Pagamentos Aprovados",
};

export function EventosClient({ data }: { data: EventoDashboardData }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingCheckin, setPendingCheckin] = useState<string | null>(null);
  const [pendingResend, setPendingResend] = useState<string | null>(null);
  const [sabado1, setSabado1] = useState(data.evento.data_sabado_1 ?? "");
  const [sabado2, setSabado2] = useState(data.evento.data_sabado_2 ?? "");
  const [sabado3, setSabado3] = useState(data.evento.data_sabado_3 ?? "");
  const [sabado4, setSabado4] = useState(data.evento.data_sabado_4 ?? "");
  const [horarioGeral, setHorarioGeral] = useState(
    data.evento.horario_geral ?? "",
  );
  const [salaTurma1, setSalaTurma1] = useState(data.evento.sala_turma_1 ?? "");
  const [salaTurma2, setSalaTurma2] = useState(data.evento.sala_turma_2 ?? "");
  const [savingDatas, setSavingDatas] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const pendingLeads = useMemo(() => {
    return data.inscricoes.filter((r) => r.status_pagamento === "pendente");
  }, [data.inscricoes]);

  const filteredInscricoes = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.inscricoes.filter((row) => {
      const matchesSearch =
        !term ||
        row.nome_aluno.toLowerCase().includes(term) ||
        row.email_aluno.toLowerCase().includes(term) ||
        row.cpf_aluno.includes(term);

      const matchesStatus =
        statusFilter === "todos" || row.status_pagamento === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data.inscricoes, search, statusFilter]);

  const maxFunil = Math.max(...Object.values(data.funil), 1);

  async function handleCheckin(inscricaoId: string, dia: 1 | 2 | 3 | 4) {
    setPendingCheckin(`${inscricaoId}-${dia}`);
    const result = await registrarCheckinAction(inscricaoId, dia);
    setPendingCheckin(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  async function handleResend(inscricaoId: string) {
    setPendingResend(inscricaoId);
    const result = await reenviarIngressoAction(inscricaoId);
    setPendingResend(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
  }

  async function handleSaveDatas() {
    setSavingDatas(true);
    const result = await atualizarDatasEventoAction(data.evento.id, {
      sabado1,
      sabado2,
      sabado3,
      sabado4,
      horarioGeral,
      salaTurma1,
      salaTurma2,
    });
    setSavingDatas(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Vagas Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.vagasConfirmadas} / {data.evento.limite_total_vagas}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Sala 1
              {data.evento.sala_turma_1 ? ` (${data.evento.sala_turma_1})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.turma1Ocupadas} / {data.evento.capacidade_por_turma}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Sala 2
              {data.evento.sala_turma_2 ? ` (${data.evento.sala_turma_2})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.turma2Ocupadas} / {data.evento.capacidade_por_turma}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Faturamento Bruto
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatCurrency(data.faturamentoBrutoCentavos)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(FUNIL_LABELS) as Array<keyof typeof FUNIL_LABELS>).map(
            (key) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{FUNIL_LABELS[key]}</span>
                  <span className="font-semibold">{data.funil[key]}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${(data.funil[key] / maxFunil) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ),
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datas, Horário e Salas dos 4 Sábados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            <label className="flex flex-col gap-1 text-sm">
              Sábado 1
              <Input
                type="date"
                value={sabado1}
                onChange={(e) => setSabado1(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sábado 2
              <Input
                type="date"
                value={sabado2}
                onChange={(e) => setSabado2(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sábado 3
              <Input
                type="date"
                value={sabado3}
                onChange={(e) => setSabado3(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sábado 4
              <Input
                type="date"
                value={sabado4}
                onChange={(e) => setSabado4(e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            <label className="flex flex-col gap-1 text-sm">
              Horário / Turnos
              <Input
                placeholder="Turma 1: 08:00 às 10:00 | Turma 2: 10:00 às 12:00"
                value={horarioGeral}
                onChange={(e) => setHorarioGeral(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sala 1
              <Input
                placeholder="Sala HY"
                value={salaTurma1}
                onChange={(e) => setSalaTurma1(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Sala 2
              <Input
                placeholder="Sala HY"
                value={salaTurma2}
                onChange={(e) => setSalaTurma2(e.target.value)}
              />
            </label>
            <Button onClick={handleSaveDatas} disabled={savingDatas}>
              {savingDatas ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <span className="material-symbols-outlined text-amber-600">
                contact_phone
              </span>
              Leads Pendentes / Abandono ({pendingLeads.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Alunos que preencheram os dados no formulário mas ainda não
              concluíram o pagamento. Entre em contato direto via WhatsApp para
              ajudar na conversão.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {pendingLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Nenhum lead pendente no momento. Todos os interessados concluíram
              a inscrição ou não há registros incompletos.
            </p>
          ) : (
            <div className="overflow-x-auto mt-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno / Contato</TableHead>
                    <TableHead>CPF / Série</TableHead>
                    <TableHead>Iniciado em</TableHead>
                    <TableHead>Recuperação no WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeads.map((row) => {
                    const cleanPhone = row.whatsapp_aluno.replace(/\D/g, "");
                    const wppDigits = cleanPhone.startsWith("55")
                      ? cleanPhone
                      : `55${cleanPhone}`;
                    const msg = encodeURIComponent(
                      `Olá ${row.nome_aluno}, tudo bem? Vi que você iniciou sua inscrição no Intensivão ENEM Medicina do Aprova+. Ficou com alguma dúvida sobre o curso ou sobre o pagamento em até 10x de R$ 39,90 no cartão? Posso te ajudar!`,
                    );
                    const wppUrl = `https://wa.me/${wppDigits}?text=${msg}`;

                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="font-semibold text-sm">
                            {row.nome_aluno}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.email_aluno}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            WhatsApp: {row.whatsapp_aluno}
                          </div>
                          {row.nome_responsavel && (
                            <div className="text-[11px] text-amber-600 mt-0.5">
                              Resp: {row.nome_responsavel} (
                              {row.whatsapp_responsavel ?? "S/N"})
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>CPF: {row.cpf_aluno}</div>
                          <div className="text-muted-foreground uppercase">
                            Série: {row.serie_atual}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(row.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <a
                            href={wppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg transition-colors shadow-sm"
                          >
                            <span className="material-symbols-outlined text-sm">
                              chat
                            </span>
                            Chamar no WhatsApp
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Inscrições</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Filtrar por status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-input rounded-md px-2.5 py-1 text-xs font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os status</option>
              <option value="aprovado">Aprovados</option>
              <option value="pendente">Pendentes</option>
              <option value="cancelado">Cancelados</option>
              <option value="recusado">Recusados</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Buscar por nome, e-mail ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInscricoes.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.nome_aluno}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.email_aluno}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.turma_alocada
                        ? `${row.sala_alocada ?? `Sala ${row.turma_alocada}`} (${row.horario_turma})`
                        : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(row.status_pagamento)}</TableCell>
                    <TableCell className="capitalize">
                      {row.forma_pagamento ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {([1, 2, 3, 4] as const).map((dia) => (
                          <Button
                            key={dia}
                            size="sm"
                            variant="outline"
                            disabled={
                              row.status_pagamento !== "aprovado" ||
                              pendingCheckin === `${row.id}-${dia}`
                            }
                            onClick={() => handleCheckin(row.id, dia)}
                          >
                            D{dia}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          row.status_pagamento !== "aprovado" ||
                          pendingResend === row.id
                        }
                        onClick={() => handleResend(row.id)}
                      >
                        Reenviar ingresso
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredInscricoes.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      Nenhuma inscrição encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
