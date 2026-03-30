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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { submitTarefa } from "@/lib/actions/tarefas";

const schema = z.object({
  student_notes: z.string().trim(),
  submission_url: z.string().trim().url("URL inválida").or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function TarefaEntregaForm({
  entregaId,
  initialNotes,
  initialUrl,
  onSuccess,
}: {
  entregaId: string;
  initialNotes: string | null;
  initialUrl: string | null;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_notes: initialNotes ?? "",
      submission_url: initialUrl ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await submitTarefa({
      entregaId,
      studentNotes: values.student_notes,
      submissionUrl: values.submission_url,
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
          name="student_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumo da resposta</FormLabel>
              <FormControl>
                <textarea
                  className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="Explique o que você fez, dúvidas e observações."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="submission_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link da entrega</FormLabel>
              <FormControl>
                <Input placeholder="https://drive.google.com/..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Enviando..." : "Enviar tarefa"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
