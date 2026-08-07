"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials } from "@/lib/format";
import { comparePatientNames } from "@/lib/budget";

interface BudgetFollowup {
  id: string;
  consultation_date: string | null;
  treatment: string;
  amount: number;
  scheduled_at: string;
  status: string;
  lost_reason: string | null;
  created_at: string;
  patients: { id: string; name: string; phone: string } | null;
}

export default function HistoricoPage() {
  const [followups, setFollowups] = useState<BudgetFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"Todos" | "Fechado" | "Perdido">("Todos");

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch("/api/followups");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      
      // Filtra apenas orçamentos concluídos (Fechado + Perdido)
      const closed = (json.followups || []).filter(
        (f: BudgetFollowup) => f.status === "Fechado" || f.status === "Perdido"
      );
      
      // Mantém o histórico em ordem alfabética pelo nome do paciente.
      closed.sort(comparePatientNames);
      
      setFollowups(closed);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
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

  const filteredFollowups = followups.filter(f => filter === "Todos" || f.status === filter);
  
  const fechadosCount = followups.filter(f => f.status === "Fechado").length;
  const perdidosCount = followups.filter(f => f.status === "Perdido").length;
  const fechadosTotal = followups.filter(f => f.status === "Fechado").reduce((acc, f) => acc + f.amount, 0);

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-6xl mx-auto w-full">
        
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-background/40 backdrop-blur-2xl backdrop-saturate-150 px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Link 
                href="/orcamentos"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-foreground/5 border border-border hover:bg-foreground/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-foreground/80" />
                <span className="sr-only">Voltar</span>
              </Link>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">
                Histórico de Orçamentos
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <StaggerDiv className="grid gap-6">
            
            <div className="grid gap-4 md:grid-cols-2">
              <MotionDiv className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Convertidos (Ganhos)
                  </span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{fechadosCount}</Badge>
                </div>
                <div className="text-2xl font-light text-emerald-600">{formatCurrency(fechadosTotal)}</div>
                <p className="text-xs text-foreground/50">Valor total convertido</p>
              </MotionDiv>

              <MotionDiv className="glass-panel p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground/70 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    Não Convertidos (Perdidos)
                  </span>
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">{perdidosCount}</Badge>
                </div>
                <div className="text-2xl font-light text-destructive">{perdidosCount}</div>
                <p className="text-xs text-foreground/50">Orçamentos fechados sem venda</p>
              </MotionDiv>
            </div>

            <MotionDiv className="glass-panel rounded-2xl overflow-hidden mt-4">
              <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-medium">Todos os Registros</h2>
                  <p className="text-sm text-foreground/60">Histórico completo de orçamentos fechados e perdidos.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant={filter === "Todos" ? "default" : "outline"} size="sm" onClick={() => setFilter("Todos")}>Todos</Button>
                  <Button variant={filter === "Fechado" ? "default" : "outline"} size="sm" onClick={() => setFilter("Fechado")}>Ganhos</Button>
                  <Button variant={filter === "Perdido" ? "default" : "outline"} size="sm" onClick={() => setFilter("Perdido")}>Perdidos</Button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {filteredFollowups.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-foreground/60">Nenhum registro encontrado para este filtro.</p>
                  </div>
                ) : (
                  filteredFollowups.map((fup) => {
                    const patient = fup.patients;
                    if (!patient) return null;
                    const consultationDate = fup.consultation_date || fup.created_at;
                    
                    return (
                      <div key={fup.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel-hover opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full border font-medium text-lg shrink-0 ${fup.status === 'Fechado' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                            {getInitials(patient.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate flex items-center gap-2">
                              {patient.name}
                              <Badge variant="outline" className={fup.status === 'Fechado' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                                {fup.status}
                              </Badge>
                            </p>
                            <p className="text-sm text-foreground/60 truncate">
                              {fup.treatment} • Atendido em {formatDate(consultationDate)}
                            </p>
                            {fup.lost_reason && (
                              <p className="text-xs text-destructive/80 mt-1">Motivo: {fup.lost_reason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                          <div className="text-left sm:text-right">
                            <p className="font-medium text-lg">{formatCurrency(fup.amount)}</p>
                          </div>
                          <Link href={`/followup/${fup.id}`} className="shrink-0">
                            <Button variant="outline" size="sm">Ver Ficha</Button>
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
