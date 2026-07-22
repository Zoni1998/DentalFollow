/**
 * Funções utilitárias para formatação de dados do AppDrPedro.
 */

/**
 * Formata um valor numérico para moeda brasileira (R$).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

/**
 * Gera iniciais a partir de um nome.
 * Ex: "João Silva" → "JS"
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("");
}

/**
 * Formata uma data ISO para exibição amigável em pt-BR.
 * Ex: "2026-07-21T14:30:00" → "21/07/2026"
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString("pt-BR");
}

/**
 * Formata uma data ISO para data e hora.
 * Ex: "2026-07-21T14:30:00" → "21/07/2026 - 14:30"
 */
export function formatDateTime(isoDate: string): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formata apenas a hora de uma data ISO.
 * Ex: "2026-07-21T14:30:00" → "14:30"
 */
export function formatTime(isoDate: string): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calcula quantos dias se passaram desde uma data.
 * Retorna string amigável: "Hoje", "Ontem", "Há N dias".
 */
export function timeAgo(isoDate: string): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
  return `Há ${Math.floor(diffDays / 30)} meses`;
}

/**
 * Mapeia status para classes CSS de badge (cores).
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Pendente":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Enviado":
      return "bg-primary/10 text-primary border-primary/20";
    case "Fechado":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Perdido":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-foreground/10 text-foreground/80 border-foreground/20";
  }
}

/**
 * Verifica se uma data ISO é hoje.
 */
export function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
