"use client";

import { useState } from "react";
import { Plus, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MaterialForm } from "./material-form";
import type { Database } from "@repo/db";

type MaterialRow = Database["public"]["Tables"]["materiais"]["Row"] & {
  download_url: string | null;
};

export function MateriaisClient({ materiais }: { materiais: MaterialRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {materiais.length} material{materiais.length !== 1 ? "is" : ""}{" "}
          cadastrado
          {materiais.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Material
        </Button>
      </div>

      {materiais.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">
            Nenhum material cadastrado.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar primeiro material
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materiais.map((material) => (
            <Card
              key={material.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium leading-snug">
                    {material.title}
                  </CardTitle>
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {material.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {material.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {material.subject && (
                    <Badge variant="secondary" className="text-xs">
                      {material.subject}
                    </Badge>
                  )}
                  {material.grade_level && (
                    <Badge variant="outline" className="text-xs">
                      {material.grade_level}
                    </Badge>
                  )}
                </div>
                {material.download_url && (
                  <a
                    href={material.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Material</DialogTitle>
          </DialogHeader>
          <MaterialForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
