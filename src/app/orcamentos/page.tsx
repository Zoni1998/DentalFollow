"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, Clock, AlertCircle, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, getInitials } from "@/lib/format";

interface BudgetFollowup {
  id: string;
  treatment: string;
  amount: number;
  scheduled_at: string;
  status: string;
  created_at: string;
  patients: { id: string; name: string; phone: string } | null;
}

function getTemperature(dateStr: string): "Quente" | "Morno" | "Frio" {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return "Quente";
  if (diffDays <= 15) return "Morno";
  return "Frio";
}

export default function OrcamentosPage() {
  const [followups, setFollowups] = useState<BudgetFollowup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch("/api/followups");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      // Filtra apenas orçamentos em aberto (Pendente + Enviado)
      const open = (json.followups || []).filter(
        (f: BudgetFollowup) => f.status === "Pendente" || f.status === "Enviado"
      );
      setFollowups(open);
    } catch (err) {
      console.error("Erro ao carregar orçamentos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalPotential = followups.reduce((sum, f) => sum + f.amount, 0);

  // Agrupa por temperatura
  const quente = followups.filter(f => getTemperature(f.created_at) === "Quente");
  const morno = followups.filter(f => getTemperature(f.created_at) === "Morno");
  const frio = followups.filter(f => getTemperature(f.created_at) === "Frio");

  const quenteTotal = quente.reduce((s, f) => s + f.amount, 0);
  const mornoTotal = morno.reduce((s, f) => s + f.amount, 0);
  const frioTotal = frio.reduce((s, f) => s + f.amount, 0);

  // High-ticket: ordena por valor descending, top 5
  const highTicket = [...followups].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-6xl mx-auto w-full">
        
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-background/40 backdrop-blur-2xl backdrop-saturate-150 px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-foreground/5 border border-border hover:bg-foreground/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-foreground/80" />
                <span className="sr-only">Voltar</span>
              </Link>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">
                Orçamentos em Aberto
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <StaggerDiv className="grid gap-6">
            
            {/* Overview Metric */}
            <MotionDiv className="glass-panel rounded-2xl p-8 flex flex-col justify-center items-center text-center space-y-2">
              <span className="text-sm font-medium text-foreground/60 uppercase tracking-widest">Valor Potencial na Mesa</span>
              <div className="text-5xl font-light tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/50">
                {formatCurrency(totalPotential)}
              </div>
              <p className="text-sm text-emerald-500 flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4" />
                {followups.length} orçamentos pendentes
              </p>
            </MotionDiv>

            {/* Aging Pipeline */}
            <div className="grid gap-4 md:grid-cols-3">
              <MotionDiv className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500" />
                    0 a 7 dias
                  </span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Quente</Badge>
                </div>
                <div className="text-2xl font-light">{formatCurrency(quenteTotal)}</div>
                <p className="text-xs text-foreground/50">{quente.length} orçamentos recentes</p>
              </MotionDiv>

              <MotionDiv className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    8 a 15 dias
                  </span>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Morno</Badge>
                </div>
                <div className="text-2xl font-light">{formatCurrency(mornoTotal)}</div>
                <p className="text-xs text-foreground/50">{morno.length} orçamentos precisando de contato</p>
              </MotionDiv>

              <MotionDiv className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    15+ dias
                  </span>
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Frio</Badge>
                </div>
                <div className="text-2xl font-light">{formatCurrency(frioTotal)}</div>
                <p className="text-xs text-foreground/50">{frio.length} orçamentos quase perdidos</p>
              </MotionDiv>
            </div>

            {/* High Ticket List */}
            <MotionDiv className="glass-panel rounded-2xl overflow-hidden mt-4">
              <div className="p-6 border-b border-border flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium">Orçamentos High-Ticket</h2>
                  <p className="text-sm text-foreground/60">Foque na conversão dos maiores valores primeiro.</p>
                </div>
              </div>
              <div className="divide-y divide-border">
                {highTicket.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-foreground/60">Nenhum orçamento em aberto.</p>
                  </div>
                ) : (
                  highTicket.map((fup) => {
                    const temp = getTemperature(fup.created_at);
                    const patient = fup.patients;
                    if (!patient) return null;
                    const daysPending = Math.floor((Date.now() - new Date(fup.created_at).getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={fup.id} className="p-6 flex items-center justify-between glass-panel-hover">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-medium text-lg">
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <p className="font-medium">{patient.name}</p>
                            <p className="text-sm text-foreground/60">{fup.treatment} • {daysPending} dias pendente</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-medium text-lg">{formatCurrency(fup.amount)}</p>
                            <Badge variant="outline" className={
                              temp === "Quente" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 mt-1" :
                              temp === "Morno" ? "bg-amber-500/10 text-amber-500 border-amber-500/20 mt-1" :
                              "bg-destructive/10 text-destructive border-destructive/20 mt-1"
                            }>
                              {temp}
                            </Badge>
                          </div>
                          <Link href={`/followup/${fup.id}`}>
                            <Button variant="default">Ver Ficha</Button>
                          </Link>
                        </div>
                      </div>
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
