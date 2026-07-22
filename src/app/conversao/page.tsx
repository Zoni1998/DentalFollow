"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, PieChart, TrendingUp, DollarSign, Target, Award, Clock, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { formatCurrency } from "@/lib/format";

interface ConversionData {
  conversionRate: number;
  conversionDiff: number;
  monthClosedValue: number;
  monthClosedCount: number;
  avgCloseDays: number;
  topTreatments: Array<{ treatment: string; totalValue: number; count: number }>;
  lostReasons: Array<{ reason: string; count: number }>;
}

export default function ConversaoPage() {
  const [data, setData] = useState<ConversionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConversion = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const dashboard = await res.json();

      // Busca todos os followups para calcular métricas detalhadas
      const fupsRes = await fetch("/api/followups");
      const fupsJson = await fupsRes.json();
      const allFups = fupsJson.followups || [];

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const monthFups = allFups.filter((f: any) => new Date(f.created_at) >= startOfMonth);
      const closed = monthFups.filter((f: any) => f.status === "Fechado");
      const lost = monthFups.filter((f: any) => f.status === "Perdido");

      const monthClosedValue = closed.reduce((s: number, f: any) => s + f.amount, 0);

      // Tempo médio de fechamento (created_at → updated_at dos fechados)
      let avgDays = 0;
      if (closed.length > 0) {
        const totalDays = closed.reduce((s: number, f: any) => {
          const created = new Date(f.created_at);
          const updated = new Date(f.updated_at || f.scheduled_at);
          return s + Math.max(1, Math.floor((updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
        }, 0);
        avgDays = Math.round(totalDays / closed.length);
      }

      // Top tratamentos (por valor fechado)
      const treatmentMap: Record<string, { totalValue: number; count: number }> = {};
      closed.forEach((f: any) => {
        if (!treatmentMap[f.treatment]) {
          treatmentMap[f.treatment] = { totalValue: 0, count: 0 };
        }
        treatmentMap[f.treatment].totalValue += f.amount;
        treatmentMap[f.treatment].count += 1;
      });
      const topTreatments = Object.entries(treatmentMap)
        .map(([treatment, v]) => ({ treatment, ...v }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 3);

      // Motivos de perda
      const reasonMap: Record<string, number> = {};
      lost.forEach((f: any) => {
        const reason = f.lost_reason || "Não informado";
        reasonMap[reason] = (reasonMap[reason] || 0) + 1;
      });
      const lostReasons = Object.entries(reasonMap)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        conversionRate: dashboard.conversionRate || 0,
        conversionDiff: dashboard.conversionDiff || 0,
        monthClosedValue,
        monthClosedCount: closed.length,
        avgCloseDays: avgDays,
        topTreatments,
        lostReasons,
      });
    } catch (err) {
      console.error("Erro ao carregar conversão:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversion();
  }, [fetchConversion]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const d = data || { conversionRate: 0, conversionDiff: 0, monthClosedValue: 0, monthClosedCount: 0, avgCloseDays: 0, topTreatments: [], lostReasons: [] };

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
                Inteligência e Conversão
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-start gap-6 p-4 sm:px-6 sm:py-0 md:gap-8">
          <StaggerDiv className="grid gap-6">
            
            {/* Top Metrics Row */}
            <div className="grid gap-4 md:grid-cols-3">
              <MotionDiv className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-primary">
                  <span className="text-sm font-medium">Taxa de Conversão</span>
                  <Target className="h-5 w-5" />
                </div>
                <div className="text-4xl font-light mt-2">{d.conversionRate}%</div>
                {d.conversionDiff !== 0 && (
                  <p className={`text-sm mt-1 flex items-center gap-1 ${d.conversionDiff > 0 ? "text-emerald-500" : "text-destructive"}`}>
                    <TrendingUp className="h-3 w-3" />
                    {d.conversionDiff > 0 ? "+" : ""}{d.conversionDiff}% vs último mês
                  </p>
                )}
              </MotionDiv>

              <MotionDiv className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-emerald-500">
                  <span className="text-sm font-medium">Receita Fechada</span>
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="text-4xl font-light mt-2">{formatCurrency(d.monthClosedValue)}</div>
                <p className="text-sm text-foreground/50 mt-1">{d.monthClosedCount} fechamentos neste mês</p>
              </MotionDiv>

              <MotionDiv className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-amber-500">
                  <span className="text-sm font-medium">Tempo Médio de Fechamento</span>
                  <Clock className="h-5 w-5" />
                </div>
                <div className="text-4xl font-light mt-2">{d.avgCloseDays} dias</div>
                <p className="text-sm text-foreground/50 mt-1">Da avaliação ao pagamento</p>
              </MotionDiv>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Top Treatments */}
              <MotionDiv className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">Tratamentos Campeões</h2>
                </div>
                <div className="p-6 space-y-6">
                  {d.topTreatments.length === 0 ? (
                    <p className="text-center text-foreground/60 py-8">Nenhum fechamento registrado ainda.</p>
                  ) : (
                    d.topTreatments.map((t, idx) => {
                      const maxVal = Math.max(...d.topTreatments.map(x => x.totalValue), 1);
                      const pct = Math.round((t.totalValue / maxVal) * 100);
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="font-medium text-lg">{t.treatment}</p>
                              <p className="text-sm text-foreground/60">{t.count} fechamentos</p>
                            </div>
                            <p className="font-medium text-emerald-500">{formatCurrency(t.totalValue)}</p>
                          </div>
                          <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </MotionDiv>

              {/* Lost Reasons */}
              <MotionDiv className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-border flex items-center gap-3">
                  <PieChart className="h-5 w-5 text-destructive" />
                  <h2 className="text-lg font-medium">Motivos de Perda (Por que não fecham?)</h2>
                </div>
                <div className="p-6 space-y-6">
                  {d.lostReasons.length === 0 ? (
                    <p className="text-center text-foreground/60 py-8">Nenhuma perda registrada. 🎉</p>
                  ) : (
                    d.lostReasons.map((r, idx) => {
                      const totalLost = d.lostReasons.reduce((acc, curr) => acc + curr.count, 0);
                      const percent = Math.round((r.count / totalLost) * 100);
                      const colors = ["bg-destructive", "bg-amber-500", "bg-foreground/40", "bg-primary", "bg-muted-foreground"];
                      return (
                        <div key={idx} className="flex items-center gap-4">
                          <div className={`w-3 h-12 rounded-full ${colors[idx % colors.length]}`} />
                          <div className="flex-1">
                            <p className="font-medium">{r.reason}</p>
                            <p className="text-sm text-foreground/60">{r.count} {r.count === 1 ? "paciente perdido" : "pacientes perdidos"}</p>
                          </div>
                          <div className="text-2xl font-light text-foreground/40">{percent}%</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </MotionDiv>
            </div>
            
          </StaggerDiv>
        </main>
      </div>
    </div>
  );
}
