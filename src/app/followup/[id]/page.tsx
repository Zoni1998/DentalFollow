"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, CheckCircle2, Phone, Calendar, Clock, ShieldCheck, XCircle, Pencil, Save, X } from "lucide-react";
import { ToothIcon } from "@/components/ui/tooth-icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { useState, use } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Mock data
const mockPatients: Record<string, any> = {
  "1": {
    id: 1,
    initials: "JS",
    initialsBg: "bg-foreground/5 border border-foreground/10",
    initialsColor: "text-foreground",
    name: "João Silva",
    treatment: "Implante Dentário",
    phone: "(11) 98765-4321",
    value: "R$ 3.500,00",
    date: "12/07/2026",
    time: "14:30",
    status: "Pendente",
    badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    message: "Olá João! Aqui é o Dr. Pedro. Estava revendo seu caso e notei que ficou pendente agendarmos o início do seu tratamento de Implante. Podemos fechar para essa semana? Consigo uma condição especial se iniciarmos agora."
  },
  "2": {
    id: 2,
    initials: "MO",
    initialsBg: "bg-foreground/5 border border-foreground/10",
    initialsColor: "text-foreground",
    name: "Maria Oliveira",
    treatment: "Lente de Contato",
    phone: "(11) 99988-7766",
    value: "R$ 8.000,00",
    date: "11/07/2026",
    time: "09:00",
    status: "Enviado",
    badgeBg: "bg-primary/10 text-primary border-primary/20",
    message: "Oi Maria, tudo bem? O planejamento das suas lentes já está pronto! Mandei as simulações no seu email, conseguiu dar uma olhadinha? Me avise quando quiser vir aprovar o formato."
  }
};

export default function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const initialPatient = mockPatients[resolvedParams.id] || mockPatients["1"];
  const [patient, setPatient] = useState(initialPatient);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    try {
      // Tenta atualizar no Supabase. Se falhar por falta de config, apenas simula.
      if (patient.id !== 1 && patient.id !== 2) {
        // IDs 1 e 2 são mocks locais
        const { error: updateError } = await supabase
          .from("patients")
          .update({
            name: patient.name,
            phone: patient.phone,
            treatment: patient.treatment,
            value: parseFloat(patient.value.replace(/\./g, "").replace(",", ".")) || 0,
          })
          .eq("id", patient.id);

        if (updateError) {
          console.warn("Supabase update error:", updateError);
        }
      }
      setIsEditing(false);
      toast.success("Informações do paciente atualizadas!");
    } catch (error) {
      setIsEditing(false);
      toast.success("Informações salvas (Mock)!");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-5xl mx-auto w-full">
        
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-background/40 backdrop-blur-2xl px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Link 
                href="/followup/lista"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-foreground/5 border border-border hover:bg-foreground/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-foreground/80" />
                <span className="sr-only">Voltar para a Lista</span>
              </Link>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">
                Ficha do Paciente
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="icon" onClick={() => { setPatient(initialPatient); setIsEditing(false); }} className="rounded-full">
                    <X className="h-4 w-4" />
                  </Button>
                  <Button onClick={handleSave} className="rounded-full gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] bg-primary text-primary-foreground hover:bg-primary/90">
                    <Save className="h-4 w-4" />
                    Salvar
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)} className="rounded-full gap-2 bg-foreground/5 border-border hover:bg-foreground/10 text-foreground">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="grid flex-1 items-start gap-8 p-6 sm:px-6 sm:py-0">
          
          <StaggerDiv className="grid gap-8 w-full">
          {/* Card Principal: Perfil e Resumo */}
          <MotionDiv className="glass-panel p-6 sm:p-10 rounded-3xl flex flex-col md:flex-row gap-8 items-start relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
            
            <div className="flex flex-col items-center gap-4">
              <div className={`h-28 w-28 rounded-full flex items-center justify-center font-medium text-4xl shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-4 ring-foreground/5 ${patient.initialsBg} ${patient.initialsColor}`}>
                {patient.initials}
              </div>
              <Badge variant="outline" className={`mt-1 py-1.5 px-4 font-normal ${patient.badgeBg}`}>
                {patient.status}
              </Badge>
            </div>

            <div className="flex-1 grid gap-8 relative z-10 w-full mt-2">
              <div>
                {isEditing ? (
                  <Input 
                    value={patient.name} 
                    onChange={e => setPatient({...patient, name: e.target.value})}
                    className="text-4xl font-light h-14 bg-foreground/5 border-border focus-visible:ring-primary w-full max-w-sm"
                  />
                ) : (
                  <h2 className="text-4xl font-light tracking-tight text-foreground">{patient.name}</h2>
                )}
                
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-foreground/80 bg-foreground/5 border border-border px-4 py-1.5 rounded-full text-sm min-w-40">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    {isEditing ? (
                      <input 
                        value={patient.phone} 
                        onChange={e => setPatient({...patient, phone: e.target.value})}
                        className="bg-transparent border-none outline-none w-full text-foreground/80 placeholder:text-muted-foreground"
                      />
                    ) : (
                      patient.phone
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-foreground/80 bg-foreground/5 border border-border px-4 py-1.5 rounded-full text-sm min-w-40">
                    <ToothIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    {isEditing ? (
                      <input 
                        value={patient.treatment} 
                        onChange={e => setPatient({...patient, treatment: e.target.value})}
                        className="bg-transparent border-none outline-none w-full text-foreground/80 placeholder:text-muted-foreground"
                      />
                    ) : (
                      patient.treatment
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border">
                <div>
                  <span className="text-sm font-light text-muted-foreground block mb-1">Valor na Mesa</span>
                  {isEditing ? (
                    <Input 
                      value={patient.value} 
                      onChange={e => setPatient({...patient, value: e.target.value})}
                      className="text-2xl font-light h-12 bg-foreground/5 border-border focus-visible:ring-primary w-full max-w-40"
                    />
                  ) : (
                    <span className="text-3xl font-light text-foreground">{patient.value}</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-light text-muted-foreground block mb-2">Data Programada</span>
                  <div className="flex items-center gap-4 text-foreground font-medium">
                    <div className="flex items-center gap-2 bg-foreground/5 border border-border rounded-lg px-3 py-1.5">
                      <Calendar className="h-4 w-4 text-primary shrink-0" /> 
                      {isEditing ? (
                        <input 
                          value={patient.date} 
                          onChange={e => setPatient({...patient, date: e.target.value})}
                          className="font-light bg-transparent border-none outline-none w-24 text-foreground"
                        />
                      ) : (
                        <span className="font-light">{patient.date}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-foreground/5 border border-border rounded-lg px-3 py-1.5">
                      <Clock className="h-4 w-4 text-primary shrink-0" /> 
                      {isEditing ? (
                        <input 
                          value={patient.time} 
                          onChange={e => setPatient({...patient, time: e.target.value})}
                          className="font-light bg-transparent border-none outline-none w-16 text-foreground"
                        />
                      ) : (
                        <span className="font-light">{patient.time}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MotionDiv>

          {/* Area do Quebra Gelo / Ação */}
          <div className="grid md:grid-cols-[1fr_320px] gap-8">
            
            <MotionDiv className="bg-foreground/[0.02] border border-border rounded-3xl p-6 sm:p-10 transition-all duration-300 hover:bg-foreground/[0.03]">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-light tracking-tight text-foreground">Mensagem de Quebra-gelo</h3>
                </div>
              </div>
              
              {/* Chat Bubble Simulation */}
              <div className="glass-panel p-6 rounded-2xl rounded-tl-sm text-foreground/80 font-light leading-relaxed relative">
                {isEditing ? (
                  <Textarea 
                    value={patient.message} 
                    onChange={e => setPatient({...patient, message: e.target.value})}
                    className="min-h-[150px] bg-foreground/5 border-border text-foreground font-light resize-none focus-visible:ring-primary p-4"
                  />
                ) : (
                  <>
                    {patient.message}
                    <div className="absolute right-4 bottom-3 text-[10px] text-muted-foreground/80 font-medium">09:41</div>
                  </>
                )}
              </div>

              <div className="mt-10">
                <Button 
                  disabled={isEditing}
                  className="w-full sm:w-auto h-14 rounded-full px-8 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all gap-3 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:shadow-none"
                >
                  <MessageCircle className="h-5 w-5" />
                  Enviar WhatsApp Agora
                </Button>
                <p className="text-xs text-muted-foreground/80 mt-4 font-light text-center sm:text-left">
                  {isEditing ? "Salve as alterações para habilitar o envio." : "Isso abrirá o WhatsApp Web / App com a mensagem preenchida."}
                </p>
              </div>
            </MotionDiv>

            <StaggerDiv className="flex flex-col gap-6">
              <MotionDiv className="glass-panel rounded-3xl p-8 flex flex-col gap-4">
                <h3 className="font-light text-muted-foreground mb-2">Atualizar Status</h3>
                
                <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-colors">
                  <CheckCircle2 className="mr-3 h-5 w-5" />
                  Marcar como Fechado
                </Button>
                
                <Button variant="outline" className="w-full justify-start h-12 rounded-xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 text-red-600 dark:text-red-400 transition-colors">
                  <XCircle className="mr-3 h-5 w-5" />
                  Marcar como Perdido
                </Button>
              </MotionDiv>

              <MotionDiv className="bg-foreground/[0.02] border border-border rounded-3xl p-8 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  <h3 className="font-light">Privacidade</h3>
                </div>
                <p className="text-sm text-muted-foreground/80 font-light leading-relaxed">
                  Os dados do paciente são visíveis apenas para você e armazenados com segurança.
                </p>
              </MotionDiv>
            </StaggerDiv>

          </div>
          </StaggerDiv>
        </main>
      </div>
    </div>
  );
}
