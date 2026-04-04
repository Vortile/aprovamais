"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveRegistroFinanceiro } from "@/lib/actions/financeiro";
import type { Database } from "@repo/db";

type AlunoResumo = Pick<
  Database["public"]["Tables"]["alunos"]["Row"],
  "id" | "plan_id"
> & {
  profiles: { full_name: string | null } | null;
};

const schema = z.object({
  alunoId: z.string().uuid("Selecione um aluno"),
  amount: z.string().min(1, "Informe o valor"),
  dueDate: z.string().min(1, "Informe o vencimento"),
  paidAt: z.string(),
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function RegistroForm({
  alunos,
  onSuccess,
}: {
  alunos: AlunoResumo[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      alunoId: "",
      amount: "",
      dueDate: "",
      paidAt: "",
      notes: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    const result = await saveRegistroFinanceiro(data);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    onSuccess();
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="alunoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aluno</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {alunos.map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.profiles?.full_name ?? aluno.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input placeholder="150,00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vencimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paidAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Pagamento (opcional)</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Ex: referente a outubro/2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Salvando..." : "Registrar Lançamento"}
        </Button>
      </form>
    </Form>
  );
}
