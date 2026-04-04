export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  SETUP: "/setup",
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  LOGIN: "/login",
  ADMIN: {
    ALUNOS: "/admin/alunos",
    MATERIAIS: "/admin/materiais",
    TAREFAS: "/admin/tarefas",
    PLANOS: "/admin/planos",
    FINANCEIRO: "/admin/financeiro",
    CONFIGURACOES: "/admin/configuracoes",
  },
  ALUNO: {
    MATERIAIS: "/aluno/materiais",
    TAREFAS: "/aluno/tarefas",
  },
} as const;
