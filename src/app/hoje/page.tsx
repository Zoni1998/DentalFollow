"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageCircle, Clock, Calendar, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatTime, getInitials } from "@/lib/format";

interface TodayFollowup {
  id: string;
  scheduled_at: string;
  treatment: string;
  status: string;
  patients: { id: string; name: string; phone: string } | null;
}

export default function HojePage() {
  const [tasks, setTasks] = useState<TodayFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch("/api/followups?status=Pendente");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      // Filtra apenas os de hoje
      const now = new Date();
      const today = json.followups.filter((f: TodayFollowup) => {
        const date = new Date(f.scheduled_at);
        return (
          date.getDate() === now.getDate() &&
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      });

      setTasks(today);
    } catch (err) {
      console.error("Erro ao carregar followups de hoje:", err);
      toast.error("Erro ao carregar followups de hoje");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const completedCount = doneIds.size;
  const totalCount = tasks.length;
  const progress = Math.round((completedCount / totalCount) * 100) || 0;

  const markAsDone = (id: string) => {
    setDoneIds((prev) => new Set(prev).add(id));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-5xl mx-auto w-full">
        
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
                Follow-ups de Hoje
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <StaggerDiv className="grid gap-6">
            
            {/* Progress Bar Section */}
            <MotionDiv className="glass-panel rounded-2xl p-8 flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-light">Meta Diária</h2>
                  <p className="text-foreground/60 text-sm">Foque em zerar esta lista até o fim do dia.</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-light">{completedCount}</span>
                  <span className="text-xl text-foreground/50">/{totalCount}</span>
                </div>
              </div>
              
              <div className="h-4 w-full bg-foreground/5 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-foreground/50 font-medium">
                <span>Progresso</span>
                <span>{progress}% Concluído</span>
              </div>
            </MotionDiv>

            {/* Tasks List */}
            <MotionDiv className="glass-panel rounded-2xl overflow-hidden mt-4">
              <div className="p-6 border-b border-border flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium">Agendados para Hoje</h2>
              </div>
              <div className="divide-y divide-border">
                {tasks.map((task) => {
                  const isDone = doneIds.has(task.id);
                  const patient = task.patients;
                  if (!patient) return null;
                  return (
                    <div key={task.id} className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-500 ${isDone ? 'opacity-50 bg-foreground/5' : 'glass-panel-hover'}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {isDone ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          ) : (
                            <Clock className="h-6 w-6 text-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-sm font-medium">
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <p className={`font-medium text-lg ${isDone ? 'line-through text-foreground/60' : ''}`}>{patient.name}</p>
                            <p className="text-sm text-foreground/60 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs font-normal">
                                {formatTime(task.scheduled_at)}
                              </Badge>
                              • {task.treatment}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {!isDone && (
                        <div className="flex flex-wrap items-center gap-3">
                          <Link href={`https://wa.me/55${patient.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="gap-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
                              <MessageCircle className="h-4 w-4" />
                              Chamar
                            </Button>
                          </Link>
                          <Button variant="default" className="gap-2" onClick={() => markAsDone(task.id)}>
                            <CheckCircle2 className="h-4 w-4" />
                            Feito
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {tasks.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Tudo zerado!</p>
                    <p className="text-foreground/60">Você não tem mais follow-ups para hoje.</p>
                  </div>
                )}
              </div>
            </MotionDiv>
            
          </StaggerDiv>
        </main>
      </div>
    </div>
  );
}
