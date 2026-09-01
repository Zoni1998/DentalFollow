"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { formatCurrency, getInitials, formatDate, formatDateTime, getStatusBadgeClass } from "@/lib/format";
import { comparePatientNames } from "@/lib/budget";

interface Followup {
  id: string;
  consultation_date: string | null;
  created_at: string;
  treatment: string;
  amount: number;
  message: string;
  scheduled_at: string;
  status: string;
  lost_reason: string | null;
  patients: { id: string; name: string; phone: string } | null;
}

const PATIENTS_PER_PAGE = 8;

function getAlphabeticalGroup(name: string) {
  const firstCharacter = name.trim().charAt(0).toLocaleUpperCase("pt-BR");
  const normalized = firstCharacter.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return /^[A-Z]$/.test(normalized) ? normalized : "#";
}

export default function FollowUpLista() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFollowups();
  }, [fetchFollowups]);

  // Filter patients based on search and tab
  const filteredFollowups = followups
    .filter((fup) => {
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
    })
    .sort(comparePatientNames);

  const totalPages = Math.max(1, Math.ceil(filteredFollowups.length / PATIENTS_PER_PAGE));
  const visiblePage = Math.min(currentPage, totalPages);
  const firstVisibleIndex = (visiblePage - 1) * PATIENTS_PER_PAGE;
  const paginatedFollowups = filteredFollowups.slice(
    firstVisibleIndex,
    firstVisibleIndex + PATIENTS_PER_PAGE
  );
  const alphabeticalGroups = paginatedFollowups.reduce<
    Array<{ letter: string; followups: Followup[] }>
  >((groups, followup) => {
    const letter = getAlphabeticalGroup(followup.patients?.name || "");
    const currentGroup = groups.at(-1);

    if (!currentGroup || currentGroup.letter !== letter) {
      groups.push({ letter, followups: [followup] });
    } else {
      currentGroup.followups.push(followup);
    }

    return groups;
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

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
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-transparent">
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
          
          <Tabs defaultValue="todos" className="w-full" onValueChange={handleTabChange}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
              <TabsList className="max-w-full justify-start overflow-x-auto bg-foreground/5 border border-foreground/10 p-1.5 rounded-xl">
                <TabsTrigger value="todos" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">Todos</TabsTrigger>
                <TabsTrigger value="Pendente" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">Pendentes</TabsTrigger>
                <TabsTrigger value="Enviado" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">Enviados</TabsTrigger>
                <TabsTrigger value="Fechado" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  Fechados
                </TabsTrigger>
                <TabsTrigger value="Perdido" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">
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
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-0 outline-none">
              <StaggerDiv className="grid gap-3">
                
                {filteredFollowups.length === 0 ? (
                  <MotionDiv className="flex flex-col items-center gap-4 rounded-2xl py-12 text-center glass-panel">
                    <p className="text-muted-foreground text-pretty">
                      {followups.length === 0
                        ? "Nenhum paciente cadastrado ainda. Crie seu primeiro follow-up!"
                        : "Nenhum paciente encontrado com estes filtros."}
                    </p>
                    {followups.length === 0 && (
                      <Link href="/followup/novo" className={buttonVariants({ variant: "outline" })}>
                        Criar primeiro follow-up
                      </Link>
                    )}
                  </MotionDiv>
                ) : (
                  alphabeticalGroups.map((group) => (
                    <section key={group.letter} aria-labelledby={`group-${group.letter}`} className="grid gap-3">
                      <div className="flex items-center gap-3 py-2">
                        <h2
                          id={`group-${group.letter}`}
                          className="flex size-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-foreground"
                        >
                          {group.letter}
                        </h2>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      {group.followups.map((fup) => {
                        const patient = fup.patients;
                        if (!patient) return null;

                        return (
                          <MotionDiv
                            key={fup.id}
                            onClick={() => router.push(`/followup/${fup.id}`)}
                            className="glass-panel glass-panel-hover flex cursor-pointer flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center"
                          >
                            <div className="flex min-w-0 items-start gap-5">
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-lg font-medium text-foreground">
                                {getInitials(patient.name)}
                              </div>
                              <div className="min-w-0">
                                <h3 className="truncate text-lg font-medium text-foreground">{patient.name}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                  <span className="line-clamp-1 text-sm font-light text-muted-foreground">{fup.treatment}</span>
                                  <span className="text-xs text-muted-foreground/60">•</span>
                                  <span className="text-sm font-light text-muted-foreground tabular-nums">{patient.phone}</span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground/80 tabular-nums">
                                  Atendido em {formatDate(fup.consultation_date || fup.created_at)}
                                </p>
                              </div>
                            </div>

                            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                              <div className="flex flex-col gap-1 sm:items-end">
                                <span className="text-lg font-medium text-foreground tabular-nums">{formatCurrency(fup.amount)}</span>
                                <span className="text-xs text-muted-foreground/80 tabular-nums">{formatDateTime(fup.scheduled_at)}</span>
                              </div>

                              <Badge variant="outline" className={cn("px-3 py-1 font-normal", getStatusBadgeClass(fup.status))}>
                                {fup.status}
                              </Badge>

                              <div onClick={(event) => event.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    aria-label={`Abrir ações de ${patient.name}`}
                                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-10 rounded-full hover:bg-foreground/10")}
                                  >
                                    <MoreHorizontal className="size-5 text-muted-foreground" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover shadow-xl">
                                    <DropdownMenuGroup>
                                      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Ações</DropdownMenuLabel>
                                      {fup.status === "Pendente" && (
                                        <>
                                          <DropdownMenuItem className="cursor-pointer py-2 font-medium text-foreground focus:bg-foreground/5 focus:text-foreground" onClick={() => handleStatusChange(fup.id, "Enviado")}>
                                            Marcar como Enviado
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator className="bg-border" />
                                        </>
                                      )}
                                      <DropdownMenuItem className="cursor-pointer py-2 text-emerald-600 focus:bg-emerald-500/10 focus:text-emerald-700 dark:text-emerald-400 dark:focus:text-emerald-300" onClick={() => handleStatusChange(fup.id, "Fechado")}>
                                        <CheckCircle2 className="mr-2 size-4" />
                                        Marcar como Fechado
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer py-2 text-red-600 focus:bg-red-500/10 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300" onClick={() => handleStatusChange(fup.id, "Perdido", "Motivo não informado")}>
                                        <XCircle className="mr-2 size-4" />
                                        Marcar como Perdido
                                      </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </MotionDiv>
                        );
                      })}
                    </section>
                  ))
                )}
              </StaggerDiv>

              {filteredFollowups.length > 0 && (
                <nav
                  aria-label="Paginação dos pacientes"
                  className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-muted-foreground tabular-nums">
                    Mostrando {firstVisibleIndex + 1}–{Math.min(firstVisibleIndex + PATIENTS_PER_PAGE, filteredFollowups.length)} de {filteredFollowups.length} pacientes
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Página anterior"
                      disabled={visiblePage === 1}
                      onClick={() => setCurrentPage(Math.max(1, visiblePage - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="min-w-24 text-center text-sm text-muted-foreground tabular-nums">
                      Página {visiblePage} de {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Próxima página"
                      disabled={visiblePage === totalPages}
                      onClick={() => setCurrentPage(Math.min(totalPages, visiblePage + 1))}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </nav>
              )}
            </div>
          </Tabs>

        </main>
      </div>
    </div>
  );
}
