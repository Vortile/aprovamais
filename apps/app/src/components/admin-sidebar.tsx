"use client";

import { useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  DollarSign,
  GraduationCap,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  {
    label: "Plataforma",
    items: [
      { href: "/admin/alunos", label: "Alunos", icon: Users },
      { href: "/admin/materiais", label: "Materiais", icon: BookOpen },
      { href: "/admin/tarefas", label: "Tarefas", icon: ClipboardList },
      { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  userName: string | null;
  userEmail: string;
}

export function AdminSidebar({ userName, userEmail }: AdminSidebarProps) {
  const { signOut } = useClerk();
  const pathname = usePathname();
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : (userEmail[0]?.toUpperCase() ?? "P");

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Plataforma</span>
        </div>
        <SidebarSeparator />
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-10">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left min-w-0">
                    <span className="text-sm font-medium truncate">
                      {userName ?? "Professor"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {userEmail}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-52">
                <DropdownMenuItem asChild>
                  <Link href="/admin/configuracoes">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => void signOut({ redirectUrl: "/sign-in" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
