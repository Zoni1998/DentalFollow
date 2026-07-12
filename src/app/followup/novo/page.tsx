"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { supabase } from "@/lib/supabase";

export default function NovoFollowup() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("nome") as string;
    const phone = formData.get("telefone") as string;
    const treatment = formData.get("tratamento") as string;
    const value = formData.get("valor") as string;
    const message = formData.get("mensagem") as string;
    const date = formData.get("data") as string;
    const time = formData.get("hora") as string;

    try {
      // 1. Insert patient
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert([{
          name,
          phone,
          treatment,
          value: parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0,
          status: "Pendente"
        }])
        .select()
        .single();

      if (patientError) throw patientError;

      // 2. Schedule message if provided
      if (message && date && time && patientData) {
        // Build ISO timestamp (e.g. 2026-07-12T14:30:00.000Z)
        const scheduledFor = new Date(`${date}T${time}:00`).toISOString();

        const { error: msgError } = await supabase
          .from("scheduled_messages")
          .insert([{
            patient_id: patientData.id,
            message_text: message,
            scheduled_for: scheduledFor,
            status: "Agendado"
          }]);

        if (msgError) throw msgError;
      }

      toast.success("Paciente cadastrado com sucesso!", {
        description: "O orçamento foi registrado e o follow-up agendado."
      });
      
      router.push("/");
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao salvar paciente", {
        description: error.message || "Tente novamente mais tarde."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-3xl mx-auto w-full">
        
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
                Novo Paciente
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-start gap-8 p-6 sm:px-6 sm:py-0 md:gap-12">
          <StaggerDiv className="glass-panel p-6 sm:p-10 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
            
            <MotionDiv className="mb-10 relative z-10">
              <h2 className="text-2xl font-light tracking-tight text-foreground">Detalhes do Paciente</h2>
              <p className="text-sm text-muted-foreground mt-2 font-light">Preencha as informações do orçamento para organizar o follow-up.</p>
            </MotionDiv>

            <form className="grid gap-8 relative z-10" onSubmit={handleSubmit}>
              
              <MotionDiv className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-3">
                  <Label htmlFor="nome" className="text-sm font-medium text-foreground/80">Nome Completo</Label>
                  <Input 
                    id="nome"
                    name="nome"
                    type="text" 
                    placeholder="Ex: João da Silva" 
                    required
                    className="h-12 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="telefone" className="text-sm font-medium text-foreground/80">WhatsApp</Label>
                  <Input 
                    id="telefone"
                    name="telefone"
                    type="tel" 
                    placeholder="(11) 99999-9999" 
                    required
                    className="h-12 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
                  />
                </div>
              </MotionDiv>

              <MotionDiv className="grid gap-6 sm:grid-cols-2">
                <div className="grid gap-3">
                  <Label htmlFor="tratamento" className="text-sm font-medium text-foreground/80">Tratamento de Interesse</Label>
                  <Input 
                    id="tratamento"
                    name="tratamento"
                    type="text" 
                    placeholder="Ex: Implante, Lente de Contato" 
                    required
                    className="h-12 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="valor" className="text-sm font-medium text-foreground/80">Valor do Orçamento (R$)</Label>
                  <Input 
                    id="valor"
                    name="valor"
                    type="text" 
                    placeholder="0,00" 
                    className="h-12 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl"
                  />
                </div>
              </MotionDiv>

              <MotionDiv className="grid gap-3">
                <Label htmlFor="mensagem" className="text-sm font-medium text-foreground/80">Mensagem de Quebra-gelo (Opcional)</Label>
                <Textarea 
                  id="mensagem"
                  name="mensagem"
                  placeholder="Escreva algo para lembrar o que foi conversado na consulta..." 
                  className="min-h-32 bg-foreground/5 border-foreground/10 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl resize-none p-4"
                />
              </MotionDiv>

              <MotionDiv className="grid gap-6 sm:grid-cols-2">
                 <div className="grid gap-3">
                  <Label htmlFor="data" className="text-sm font-medium text-foreground/80">Data do Retorno</Label>
                  <Input 
                    id="data"
                    name="data"
                    type="date" 
                    className="h-12 bg-foreground/5 border-foreground/10 text-foreground focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl [color-scheme:dark]"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="hora" className="text-sm font-medium text-foreground/80">Horário</Label>
                  <Input 
                    id="hora"
                    name="hora"
                    type="time" 
                    className="h-12 bg-foreground/5 border-foreground/10 text-foreground focus-visible:ring-primary/50 focus-visible:border-primary/50 rounded-xl [color-scheme:dark]"
                  />
                </div>
              </MotionDiv>

              <MotionDiv className="pt-6 flex items-center justify-end gap-4 border-t border-border mt-2">
                <Link 
                  href="/"
                  className={cn(buttonVariants({ variant: "ghost" }), "rounded-full px-6 hover:bg-foreground/5 text-foreground/80 hover:text-foreground")}
                >
                  Cancelar
                </Link>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 rounded-full px-8 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all gap-2 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isSubmitting ? (
                    <>Salvando... <Loader2 className="h-4 w-4 ml-1 animate-spin" /></>
                  ) : (
                    <>Salvar e Agendar <Send className="h-4 w-4 ml-1" /></>
                  )}
                </Button>
              </MotionDiv>

            </form>
          </StaggerDiv>
        </main>
      </div>
    </div>
  );
}
