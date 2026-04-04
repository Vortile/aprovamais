"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
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
import { savePlano, updatePlano } from "@/lib/actions/planos";
import type { Database } from "@repo/db";

type Plano = Database["public"]["Tables"]["planos"]["Row"];

const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome do plano"),
  badge: z.string().trim(),
  monthly_amount: z.string().trim().min(1, "Informe o valor mensal"),
  billing_day: z.string().trim(),
  description: z.string().trim(),
  features: z.array(z.object({ value: z.string().trim() })),
  is_featured: z.boolean(),
  sort_order: z.string().trim(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function PlanoForm({
  plano,
  onSuccess,
}: {
  plano?: Plano;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: plano?.name ?? "",
      badge: plano?.badge ?? "",
      monthly_amount: plano?.monthly_amount?.toString() ?? "",
      billing_day: plano?.billing_day?.toString() ?? "",
      description: plano?.description ?? "",
      features: (plano?.features ?? []).map((v) => ({ value: v })),
      is_featured: plano?.is_featured ?? false,
      sort_order: plano?.sort_order?.toString() ?? "0",
      active: plano?.active ?? true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "features",
  });

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      badge: values.badge,
      monthlyAmount: values.monthly_amount,
      billingDay: values.billing_day,
      description: values.description,
      features: values.features.map((f) => f.value).filter(Boolean),
      isFeatured: values.is_featured,
      sortOrder: Number(values.sort_order) || 0,
      active: values.active,
    };

    const result = plano
      ? await updatePlano(plano.id, payload)
      : await savePlano(payload);

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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do plano</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Avançado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="badge"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Badge</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Mais Popular" {...field} />
                </FormControl>
                <FormDescription>Rótulo acima do nome no site.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="monthly_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensalidade (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1000"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="billing_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dia de cobrança</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="10"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Opcional.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição interna</FormLabel>
              <FormControl>
                <Input placeholder="Nota interna sobre o plano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Features (bullet points) */}
        <div className="space-y-2">
          <FormLabel>Benefícios (bullet points)</FormLabel>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`features.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`Ex: 3 aulas por semana`}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ value: "" })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar benefício
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="sort_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem no site</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="0" {...field} />
                </FormControl>
                <FormDescription>
                  Menor número aparece primeiro.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-6">
          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 accent-primary"
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  Destacar como recomendado
                </FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 accent-primary"
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  Ativo (visível no site)
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Salvando..."
              : plano
                ? "Salvar alterações"
                : "Criar plano"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
