"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  ArrowUpRight,
  Clock,
  Settings,
  Loader2,
  Smartphone,
  CalendarDays,
} from "lucide-react";
import { ImageLogo } from "@/components/ui/image-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getInitials, formatTime, getStatusBadgeClass, timeAgo } from "@/lib/format";

interface DashboardData {
  totalOpen: number;
  todayCount: number;
  conversionRate: number;
  conversionDiff: number;
  upcoming: Array<{
    id: string;
    scheduled_at: string;
    status: string;
    treatment: string;
    amount: number;
    patients: { id: string; name: string; phone: string } | null;
  }>;
}

type WhatsAppConnectionState = "loading" | "connected" | "disconnected" | "unavailable";

interface WhatsAppConnectionStatus {
  state: WhatsAppConnectionState;
  phone: string | null;
}

function formatWhatsAppNumber(value: string | null) {
  if (!value) return "Nenhum número conectado";

  const digits = value.replace(/\D/g, "");

  if (digits.length === 13 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12 && digits.startsWith("55")) {
    return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return value;
}

function getContactDayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getContactDayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === tomorrow.toDateString()) return "Amanhã";

  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date);

  return label.charAt(0).toLocaleUpperCase("pt-BR") + label.slice(1);
}

function WhatsAppConnectionCard({
  status,
  className,
}: {
  status: WhatsAppConnectionStatus;
  className?: string;
}) {
  const isConnected = status.state === "connected";
  const statusLabel = {
    loading: "Verificando conexão",
    connected: "Conectado",
    disconnected: "Desconectado",
    unavailable: "Status indisponível",
  }[status.state];
  const numberLabel = isConnected
    ? formatWhatsAppNumber(status.phone)
    : status.state === "disconnected"
      ? "Nenhum número conectado"
      : "WhatsApp";

  return (
    <Link
      href="/configuracoes"
      aria-label={`${numberLabel}. ${statusLabel}. Abrir configurações do WhatsApp`}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-sm transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          isConnected
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Smartphone className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 text-left">
        <p className="max-w-56 truncate text-sm font-medium tabular-nums">{numberLabel}</p>
        <p
          aria-live="polite"
          className={cn(
            "flex items-center gap-1.5 text-xs",
            isConnected
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full",
              isConnected ? "bg-emerald-500" : "bg-muted-foreground/50"
            )}
          />
          {statusLabel}
        </p>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsAppStatus, setWhatsAppStatus] = useState<WhatsAppConnectionStatus>({
    state: "loading",
    phone: null,
  });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWhatsAppStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/whatsapp/qr", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        setWhatsAppStatus({ state: "unavailable", phone: null });
        return;
      }

      setWhatsAppStatus({
        state: result.connected ? "connected" : "disconnected",
        phone: result.connected ? result.phone ?? null : null,
      });
    } catch (error) {
      console.error("Erro ao verificar conexão do WhatsApp:", error);
      setWhatsAppStatus({ state: "unavailable", phone: null });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    fetchWhatsAppStatus();
  }, [fetchData, fetchWhatsAppStatus]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const d = data || { totalOpen: 0, todayCount: 0, conversionRate: 0, conversionDiff: 0, upcoming: [] };
  const groupedUpcoming = d.upcoming.reduce<
    Array<{ key: string; label: string; followups: DashboardData["upcoming"] }>
  >((groups, followup) => {
    const key = getContactDayKey(followup.scheduled_at);
    const currentGroup = groups.at(-1);

    if (!currentGroup || currentGroup.key !== key) {
      groups.push({
        key,
        label: getContactDayLabel(followup.scheduled_at),
        followups: [followup],
      });
    } else {
      currentGroup.followups.push(followup);
    }

    return groups;
  }, []);

  return (
    <div className="flex min-h-dvh w-full flex-col bg-transparent overflow-x-hidden">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-6xl mx-auto w-full">
        
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/40 backdrop-blur-2xl backdrop-saturate-150 px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
          <div className="flex items-center gap-4">
            <div className="overflow-hidden rounded-xl border border-primary/25 shadow-[0_0_24px_rgba(139,92,246,0.24)]">
              <ImageLogo className="w-11 h-11" />
            </div>
            <span className="text-xl font-medium tracking-tight text-foreground">
              DentalFollow.
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <WhatsAppConnectionCard status={whatsAppStatus} className="hidden md:flex" />
            <ThemeToggle />
            <Link 
              href="/configuracoes"
              className="flex items-center justify-center h-10 w-10 rounded-full bg-foreground/5 border border-border hover:bg-foreground/10 transition-colors"
            >
              <Settings className="h-5 w-5 text-foreground/80" />
              <span className="sr-only">Configurações</span>
            </Link>
            <Link 
              href="/followup/novo"
              className={cn(buttonVariants({ size: "default" }), "gap-2 rounded-full px-6 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all bg-primary hover:bg-primary/90 text-primary-foreground")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">Novo Follow-up</span>
            </Link>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-8 p-6 sm:px-6 sm:py-4 md:gap-12">
          <WhatsAppConnectionCard status={whatsAppStatus} className="w-full md:hidden" />
          
          <StaggerDiv className="grid gap-8 md:gap-12 w-full">
            <MotionDiv>
              <h1 className="text-4xl font-light tracking-tight text-foreground">
                Visão Geral
              </h1>
              <p className="text-muted-foreground mt-2 font-light">
                Acompanhe seus orçamentos pendentes e maximize suas conversões.
              </p>
            </MotionDiv>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              
              {/* Orçamentos em Aberto */}
              <MotionDiv>
                <Link href="/orcamentos" className="block h-full">
                  <Card className="glass-panel glass-panel-hover border-primary/30 relative overflow-hidden group h-full">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full -mr-10 -mt-10 group-hover:bg-primary/30 transition-all duration-700" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full -ml-10 -mb-10" />
                    
                    <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                      <CardTitle className="text-sm font-medium text-foreground/80">
                        Orçamentos em Aberto
                      </CardTitle>
                      <div className="bg-primary/20 p-1.5 rounded-full">
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-4">
                      <div className="text-5xl font-extralight tracking-tight text-foreground mb-2">
                        <span className="text-2xl text-muted-foreground mr-1">R$</span>
                        <span className="font-normal text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
                          {d.totalOpen.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-light">
                        Valor potencial na mesa
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </MotionDiv>

              {/* Follow-ups Hoje */}
              <MotionDiv>
                <Link href="/hoje" className="block h-full">
                  <Card className="glass-panel glass-panel-hover group h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Follow-ups Hoje
                      </CardTitle>
                      <div className="bg-foreground/5 border border-foreground/10 p-2 rounded-lg group-hover:border-foreground/20 transition-colors">
                        <Clock className="h-4 w-4 text-foreground/80" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-4xl font-light text-foreground">{d.todayCount}</div>
                      <p className="text-sm text-muted-foreground mt-2 font-light">
                        Pacientes aguardando contato
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </MotionDiv>

              {/* Conversão */}
              <MotionDiv>
                <Link href="/conversao" className="block h-full">
                  <Card className="glass-panel glass-panel-hover group h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Conversão (Mês)
                      </CardTitle>
                      <div className="bg-foreground/5 border border-foreground/10 p-2 rounded-lg group-hover:border-foreground/20 transition-colors">
                        <Users className="h-4 w-4 text-foreground/80" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="text-4xl font-light text-foreground">{d.conversionRate}%</div>
                      {d.conversionDiff !== 0 && (
                        <p className={`text-sm mt-2 font-light flex items-center gap-1 ${d.conversionDiff > 0 ? "text-emerald-400" : "text-destructive"}`}>
                          <ArrowUpRight className="h-3 w-3" />
                          {d.conversionDiff > 0 ? "+" : ""}{d.conversionDiff}% em relação ao mês anterior
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </MotionDiv>
            </div>

            {/* Próximos Contatos */}
            <MotionDiv className="grid gap-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium tracking-tight text-foreground">Próximos Contatos</h2>
                <Link 
                  href="/followup/lista"
                  className="text-sm font-medium text-primary hover:text-primary-foreground transition-colors"
                >
                  Ver todos os pacientes →
                </Link>
              </div>
              
              <div className="grid gap-5">
                {d.upcoming.length === 0 ? (
                  <MotionDiv className="flex flex-col items-center gap-4 rounded-2xl py-12 text-center glass-panel">
                    <div>
                      <p className="font-medium text-foreground">Nenhum contato agendado</p>
                      <p className="mt-1 text-sm text-muted-foreground text-pretty">Cadastre um paciente e programe a data de envio da mensagem para vê-lo aqui.</p>
                    </div>
                    <Link href="/followup/novo" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
                      <Plus className="size-4" />
                      Novo follow-up
                    </Link>
                  </MotionDiv>
                ) : (
                  groupedUpcoming.map((group) => (
                    <section key={group.key} aria-labelledby={`contact-day-${group.key}`} className="grid gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <CalendarDays className="size-4" aria-hidden="true" />
                        <h3 id={`contact-day-${group.key}`}>{group.label}</h3>
                        <span className="tabular-nums">({group.followups.length})</span>
                      </div>

                      <div className="grid gap-3">
                        {group.followups.map((fup) => {
                          const patient = fup.patients;
                          if (!patient) return null;

                          return (
                            <Link
                              key={fup.id}
                              href={`/followup/${fup.id}`}
                              className="glass-panel glass-panel-hover flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center"
                            >
                              <div className="flex min-w-0 items-start gap-5">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 font-medium text-foreground">
                                  {getInitials(patient.name)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="truncate text-lg font-medium text-foreground">{patient.name}</h4>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="line-clamp-1 text-sm text-muted-foreground">{fup.treatment}</span>
                                    <span className="text-xs text-muted-foreground/60">•</span>
                                    <span className="text-sm text-muted-foreground tabular-nums">{patient.phone}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                                <div className="flex w-full items-center justify-between gap-4 sm:justify-end">
                                  <span className="font-medium text-foreground tabular-nums">{formatCurrency(fup.amount)}</span>
                                  <Badge variant="outline" className={cn("font-normal", getStatusBadgeClass(fup.status))}>
                                    {fup.status}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground/80 tabular-nums">
                                  {timeAgo(fup.scheduled_at)} às {formatTime(fup.scheduled_at)}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  ))
                )}
              </div>
            </MotionDiv>
          </StaggerDiv>
        </main>
      </div>
    </div>
  );
}
