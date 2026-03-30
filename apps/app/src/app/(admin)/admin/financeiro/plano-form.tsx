"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { savePlano } from "@/lib/actions/planos"

const schema = z.object({
  name: z.string().trim().min(1, "Informe o nome do plano"),
  monthly_amount: z.string().trim().min(1, "Informe o valor mensal"),
  billing_day: z.string().trim(),
  description: z.string().trim(),
})

type FormValues = z.infer<typeof schema>

export function PlanoForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      monthly_amount: "",
      billing_day: "",
      description: "",
    },
  })

  async function onSubmit(values: FormValues) {
    const result = await savePlano({
      name: values.name,
      monthlyAmount: values.monthly_amount,
      billingDay: values.billing_day,
      description: values.description,
    })

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    toast.success(result.message)
    router.refresh()
    onSuccess()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do plano</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Mensal 2x por semana" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="monthly_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensalidade (R$)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="650,00" {...field} />
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
                  <Input type="number" min="1" max="31" placeholder="10" {...field} />
                </FormControl>
                <FormDescription>
                  Opcional. Serve para previsão e organização.
                </FormDescription>
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 8 aulas por mês, suporte no WhatsApp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar plano"}
          </Button>
        </div>
      </form>
    </Form>
  )
}