"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal, MessageCircle, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";

// Mock data
const mockPatients = [
  {
    id: 1,
    initials: "JS",
    initialsBg: "bg-foreground/5 border border-foreground/10",
    initialsColor: "text-foreground",
    name: "João Silva",
    treatment: "Implante Dentário",
    phone: "(11) 98765-4321",
    value: "R$ 3.500,00",
    date: "12/07/2026 - 14:30",
    status: "Pendente",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: 2,
    initials: "MO",
    initialsBg: "bg-foreground/5 border border-foreground/10",
    initialsColor: "text-foreground",
    name: "Maria Oliveira",
    treatment: "Lente de Contato",
    phone: "(11) 99988-7766",
    value: "R$ 8.000,00",
    date: "Ontem às 09:00",
    status: "Enviado",
    badgeBg: "bg-primary/10 text-primary border-primary/20"
  }
];

export default function FollowUpLista() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");

  // Filter patients based on search and tab
  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          patient.treatment.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "todos") return matchesSearch;
    return matchesSearch && patient.status.toLowerCase() === activeTab;
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-6xl mx-auto w-full">
        
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-background/40 backdrop-blur-2xl px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
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
                <TabsTrigger value="pendente" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">Pendentes</TabsTrigger>
                <TabsTrigger value="enviado" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm">Enviados</TabsTrigger>
                <TabsTrigger value="fechado" className="rounded-lg data-[state=active]:bg-foreground/10 data-[state=active]:text-foreground data-[state=active]:shadow-sm hidden sm:flex">
                  Fechados
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
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl bg-foreground/5 border-foreground/10 hover:bg-foreground/10">
                  <Filter className="h-4 w-4 text-foreground/80" />
                </Button>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-0 outline-none">
              <StaggerDiv className="grid gap-3">
                
                {filteredPatients.length === 0 ? (
                  <MotionDiv className="text-center py-16 glass-panel rounded-2xl">
                    <p className="text-muted-foreground font-light">Nenhum paciente encontrado.</p>
                  </MotionDiv>
                ) : (
                  filteredPatients.map(patient => (
                    <MotionDiv 
                      key={patient.id} 
                      onClick={() => router.push(`/followup/${patient.id}`)}
                      className="glass-panel glass-panel-hover flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl gap-4 cursor-pointer group"
                    >
                      <div className="flex items-start gap-5">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center font-medium text-lg ${patient.initialsBg} ${patient.initialsColor}`}>
                            {patient.initials}
                          </div>
                        <div>
                          <h3 className="text-lg font-medium text-foreground">{patient.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-light text-muted-foreground">{patient.treatment}</span>
                            <span className="text-xs text-muted-foreground/60">•</span>
                            <span className="text-sm font-light text-muted-foreground">{patient.phone}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="flex flex-col sm:items-end gap-1">
                          <span className="font-medium text-foreground text-lg">{patient.value}</span>
                          <span className="text-xs text-muted-foreground/80">{patient.date}</span>
                        </div>
                        
                        <Badge variant="outline" className={`py-1 px-3 font-normal ${patient.badgeBg}`}>
                          {patient.status}
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
                                {patient.status === "Pendente" && (
                                  <>
                                    <DropdownMenuItem className="cursor-pointer py-2 font-medium text-foreground focus:bg-foreground/5 focus:text-foreground">
                                      <MessageCircle className="mr-2 h-4 w-4 text-primary" />
                                      Enviar WhatsApp Agora
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border" />
                                  </>
                                )}
                                <DropdownMenuItem className="cursor-pointer py-2 text-emerald-600 dark:text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-700 dark:focus:text-emerald-300">
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Marcar como Fechado
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer py-2 text-red-600 dark:text-red-400 focus:bg-red-500/10 focus:text-red-700 dark:focus:text-red-300">
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Marcar como Perdido
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </MotionDiv>
                  ))
                )}
              </StaggerDiv>
            </TabsContent>
          </Tabs>

        </main>
      </div>
    </div>
  );
}
