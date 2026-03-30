import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { hasAppEnv } from "@/lib/supabase/env";
import { AdminSidebar } from "@/components/admin-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasAppEnv()) {
    redirect("/setup");
  }

  const session = await requireRole("admin");

  return (
    <SidebarProvider>
      <AdminSidebar
        userName={session.profile.full_name}
        userEmail={session.email}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
