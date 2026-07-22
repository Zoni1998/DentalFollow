"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Users, ArrowUpRight, Clock, Settings, Loader2 } from "lucide-react";
import { ImageLogo } from "@/components/ui/image-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { Button, buttonVariants } from "@/components/ui/button";
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

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const d = data || { totalOpen: 0, todayCount: 0, conversionRate: 0, conversionDiff: 0, upcoming: [] };

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent overflow-x-hidden">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-6xl mx-auto w-full">
        
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/40 backdrop-blur-2xl backdrop-saturate-150 px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
          <div className="flex items-center gap-4">
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)] flex items-center justify-center">
              <ImageLogo className="w-10 h-10 p-1" />
            </div>
            <span className="text-xl font-medium tracking-tight text-foreground">
              DentalFollow.
            </span>
          </div>
          
          <div className="flex items-center gap-4">
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
              
              <div className="grid gap-3">
                {d.upcoming.length === 0 ? (
                  <MotionDiv className="text-center py-16 glass-panel rounded-2xl">
                    <p className="text-muted-foreground font-light">Nenhum contato agendado. Que tal começar um novo follow-up?</p>
                  </MotionDiv>
                ) : (
                  d.upcoming.map((fup) => {
                    const patient = fup.patients;
                    if (!patient) return null;
                    return (
                      <Link 
                        key={fup.id} 
                        href={`/followup/${fup.id}`} 
                        className="glass-panel glass-panel-hover flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl gap-4 cursor-pointer"
                      >
                        <div className="flex items-start gap-5">
                          <div className="h-12 w-12 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground font-medium">
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground text-lg">{patient.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-muted-foreground">{fup.treatment}</span>
                              <span className="text-xs text-muted-foreground/60">•</span>
                              <span className="text-sm text-muted-foreground">{patient.phone}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full">
                            <span className="font-medium text-foreground">{formatCurrency(fup.amount)}</span>
                            <Badge variant="outline" className={cn("font-normal", getStatusBadgeClass(fup.status))}>
                              {fup.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground/80">{timeAgo(fup.scheduled_at)} às {formatTime(fup.scheduled_at)}</span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </MotionDiv>
          </StaggerDiv>
        </main>
      </div>
    </div>
  );
}
