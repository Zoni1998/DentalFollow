/**
 * FunÃ§Ãµes utilitÃ¡rias para formataÃ§Ã£o de dados do DentalFollow.
 */

/**
 * Formata um valor numÃ©rico para moeda brasileira (R$).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

/**
 * Gera iniciais a partir de um nome.
 * Ex: "JoÃ£o Silva" â†’ "JS"
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
 * Formata uma data ISO para exibiÃ§Ã£o amigÃ¡vel em pt-BR.
 * Ex: "2026-07-21T14:30:00" â†’ "21/07/2026"
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return "â€”";
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("pt-BR");
  }

  return new Date(isoDate).toLocaleDateString("pt-BR");
}

/**
 * Formata uma data ISO para data e hora.
 * Ex: "2026-07-21T14:30:00" â†’ "21/07/2026 - 14:30"
 */
export function formatDateTime(isoDate: string): string {
  if (!isoDate) return "â€”";
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
 * Ex: "2026-07-21T14:30:00" â†’ "14:30"
 */
export function formatTime(isoDate: string): string {
  if (!isoDate) return "â€”";
  return new Date(isoDate).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formata CPF armazenado apenas com dÃ­gitos. */
export function formatCpf(value: string | null | undefined): string {
  const digits = (value || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length !== 11) return value || "â€”";

  return digits.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
}

/**
 * Calcula quantos dias se passaram desde uma data.
 * Retorna string amigÃ¡vel: "Hoje", "Ontem", "HÃ¡ N dias".
 */
export function timeAgo(isoDate: string): string {
  if (!isoDate) return "â€”";
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `HÃ¡ ${diffDays} dias`;
  if (diffDays < 30) return `HÃ¡ ${Math.floor(diffDays / 7)} semanas`;
  return `HÃ¡ ${Math.floor(diffDays / 30)} meses`;
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
 * Verifica se uma data ISO Ã© hoje.
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

/**
 * Sanitiza o nÃºmero de telefone para o formato padrÃ£o do WhatsApp.
 * Remove todos os caracteres nÃ£o numÃ©ricos.
 * Se o nÃºmero nÃ£o comeÃ§ar com 55 (Brasil), adiciona o prefixo 55.
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.length >= 10 && !digits.startsWith("55")) {
    digits = "55" + digits;
  }
  return digits;
}

