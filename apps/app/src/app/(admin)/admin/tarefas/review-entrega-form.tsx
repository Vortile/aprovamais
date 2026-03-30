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
import { reviewTarefa } from "@/lib/actions/tarefas";

const schema = z.object({
  teacher_feedback: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

export function ReviewEntregaForm({
  entregaId,
  initialFeedback,
  onSuccess,
}: {
  entregaId: string;
  initialFeedback: string | null;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      teacher_feedback: initialFeedback ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await reviewTarefa({
      entregaId,
      teacherFeedback: values.teacher_feedback,
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
          name="teacher_feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback do professor</FormLabel>
              <FormControl>
                <textarea
                  className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  placeholder="Deixe orientações, correções ou próximos passos."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar feedback"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
