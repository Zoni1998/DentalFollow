"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal, CheckCircle2, XCircle, Search, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { toast } from "sonner";
import { formatCurrency, getInitials, formatDateTime, getStatusBadgeClass } from "@/lib/format";

interface Followup {
  id: string;
  treatment: string;
  amount: number;
  message: string;
  scheduled_at: string;
  status: string;
  lost_reason: string | null;
  patients: { id: string; name: string; phone: string } | null;
}

export default function FollowUpLista() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowups = useCallback(async () => {
    try {
      const res = await fetch("/api/followups");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setFollowups(json.followups || []);
    } catch (err) {
      console.error("Erro ao carregar followups:", err);
      toast.error("Erro ao carregar lista de pacientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  // Filter patients based on search and tab
  const filteredFollowups = followups.filter((fup) => {
    const patient = fup.patients;
    const name = patient?.name?.toLowerCase() || "";
    const treatment = fup.treatment?.toLowerCase() || "";
    const matchesSearch =
      name.includes(searchTerm.toLowerCase()) ||
      treatment.includes(searchTerm.toLowerCase());

    if (activeTab === "todos") return matchesSearch;
    return (
      matchesSearch &&
      fup.status.toLowerCase() === activeTab.toLowerCase()
    );
  });

  const handleStatusChange = async (followupId: string, newStatus: string, lostReason?: string) => {
    try {
      const res = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followup_id: followupId,
          status: newStatus,
          lost_reason: lostReason || null,
        }),
      });

      if (!res.ok) throw new Error("Falha ao atualizar");

      toast.success(
        newStatus === "Fechado" ? "Paciente marcado como Fechado! 🎉" :
        newStatus === "Perdido" ? "Marcado como Perdido." :
        "Status atualizado!"
      );

      // Atualiza localmente
      setFollowups((prev) =>
        prev.map((f) =>
          f.id === followupId
            ? { ...f, status: newStatus, lost_reason: lostReason || null }
            : f
        )
      );
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
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
                Pacientes em Follow-up
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-start gap-8 p-6 sm:px-6 sm:py-0 md:gap-12">
          
          <Tabs defaultValue="todos" className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
              <TabsList className="bg-foreground/5 border border-foreground/10 p-1.5 rounded-xl">
                <TabsTrigger value="todos" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">Todos</TabsTrigger>
                <TabsTrigger value="Pendente" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">Pendentes</TabsTrigger>
                <TabsTrigger value="Enviado" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">Enviados</TabsTrigger>
                <TabsTrigger value="Fechado" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm hidden sm:flex">
                  Fechados
                </TabsTrigger>
                <TabsTrigger value="Perdido" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm hidden sm:flex">
                  Perdidos
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar paciente..." 
                    className="pl-9 h-11 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-muted-foreground/80 rounded-xl focus-visible:ring-primary/50 focus-visible:border-primary/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-0 outline-none">
              <StaggerDiv className="grid gap-3">
                
                {filteredFollowups.length === 0 ? (
                  <MotionDiv className="text-center py-16 glass-panel rounded-2xl">
                    <p className="text-muted-foreground font-light">
                      {followups.length === 0
                        ? "Nenhum paciente cadastrado ainda. Crie seu primeiro follow-up!"
                        : "Nenhum paciente encontrado com estes filtros."}
                    </p>
                  </MotionDiv>
                ) : (
                  filteredFollowups.map((fup) => {
                    const patient = fup.patients;
                    if (!patient) return null;
                    return (
                      <MotionDiv 
                        key={fup.id} 
                        onClick={() => router.push(`/followup/${fup.id}`)}
                        className="glass-panel glass-panel-hover flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl gap-4 cursor-pointer group"
                      >
                        <div className="flex items-start gap-5">
                            <div className="h-12 w-12 rounded-full flex items-center justify-center font-medium text-lg bg-foreground/5 border border-foreground/10 text-foreground">
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-foreground">{patient.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm font-light text-muted-foreground">{fup.treatment}</span>
                              <span className="text-xs text-muted-foreground/60">•</span>
                              <span className="text-sm font-light text-muted-foreground">{patient.phone}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          <div className="flex flex-col sm:items-end gap-1">
                            <span className="font-medium text-foreground text-lg">{formatCurrency(fup.amount)}</span>
                            <span className="text-xs text-muted-foreground/80">{formatDateTime(fup.scheduled_at)}</span>
                          </div>
                          
                          <Badge variant="outline" className={cn("py-1 px-3 font-normal", getStatusBadgeClass(fup.status))}>
                            {fup.status}
                          </Badge>

                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full h-10 w-10 hover:bg-foreground/10")}>
                                <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                <span className="sr-only">Abrir menu</span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-border bg-popover/95 backdrop-blur-xl">
                                <DropdownMenuGroup>
                                  <DropdownMenuLabel className="font-normal text-muted-foreground text-xs">Ações</DropdownMenuLabel>
                                  {fup.status === "Pendente" && (
                                    <>
                                      <DropdownMenuItem className="cursor-pointer py-2 font-medium text-foreground focus:bg-foreground/5 focus:text-foreground" onClick={() => handleStatusChange(fup.id, "Enviado")}>
                                        Marcar como Enviado
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-border" />
                                    </>
                                  )}
                                  <DropdownMenuItem className="cursor-pointer py-2 text-emerald-600 dark:text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-700 dark:focus:text-emerald-300" onClick={() => handleStatusChange(fup.id, "Fechado")}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Marcar como Fechado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer py-2 text-red-600 dark:text-red-400 focus:bg-red-500/10 focus:text-red-700 dark:focus:text-red-300" onClick={() => handleStatusChange(fup.id, "Perdido", "Motivo não informado")}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Marcar como Perdido
                                  </DropdownMenuItem>
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </MotionDiv>
                    );
                  })
                )}
              </StaggerDiv>
            </div>
          </Tabs>

        </main>
      </div>
    </div>
  );
}
