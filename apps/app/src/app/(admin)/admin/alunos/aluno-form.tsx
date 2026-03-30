"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
import { saveAluno } from "@/lib/actions/alunos";
import type { Database } from "@repo/db";

type PlanoRow = Database["public"]["Tables"]["planos"]["Row"];
type AlunoRow = Database["public"]["Tables"]["alunos"]["Row"] & {
  profiles?: Pick<
    Database["public"]["Tables"]["profiles"]["Row"],
    "full_name"
  > | null;
};

const schema = z.object({
  full_name: z.string().trim(),
  contact_email: z
    .string()
    .trim()
    .email("Informe um email válido")
    .or(z.literal("")),
  plan_id: z.string().uuid("Selecione um plano"),
  grade: z.string().min(1, "Informe a série"),
  subject_focus: z.string(),
  notes: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function AlunoForm({
  aluno,
  plans,
  onSuccess,
}: {
  aluno: AlunoRow | null;
  plans: PlanoRow[];
  onSuccess: () => void;
}) {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: aluno?.profiles?.full_name ?? "",
      contact_email: aluno?.contact_email ?? "",
      plan_id: aluno?.plan_id ?? "",
      grade: aluno?.grade ?? "",
      subject_focus: aluno?.subject_focus?.join(", ") ?? "",
      notes: aluno?.notes ?? "",
    },
  });

  const contactEmail = form.watch("contact_email").trim();
  const canEditName = Boolean(aluno?.profile_id || contactEmail);

  async function onSubmit(values: FormValues) {
    const result = await saveAluno({
      alunoId: aluno?.id,
      fullName: values.full_name,
      contactEmail: values.contact_email,
      planId: values.plan_id,
      grade: values.grade,
      subjectFocus: values.subject_focus,
      notes: values.notes,
    });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    router.refresh();
    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome completo do aluno"
                  disabled={!canEditName}
                  {...field}
                />
              </FormControl>
              {!canEditName && (
                <FormDescription>
                  O nome será salvo quando existir uma conta vinculada. Preencha
                  o email para vincular uma conta existente ou enviar um
                  convite.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email da conta</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="aluno@exemplo.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Use este email para vincular uma conta existente, enviar um
                convite ou alterar o email de login do aluno.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="plan_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plans.length === 0 ? (
                    <SelectItem value="__sem_plano" disabled>
                      Crie um plano primeiro no Financeiro
                    </SelectItem>
                  ) : (
                    plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} ·{" "}
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(plan.monthly_amount)}
                        {!plan.active ? " · Inativo" : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Todo aluno precisa estar vinculado a um plano para entrar na
                projeção financeira.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Série / Ano</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 8º Ano, Ensino Médio 1..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject_focus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Disciplinas</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Matemática, Física (separar por vírgula)"
                  {...field}
                />
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
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Input placeholder="Notas sobre o aluno..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
