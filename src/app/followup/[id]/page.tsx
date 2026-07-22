"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, CheckCircle2, Phone, Calendar, Clock, ShieldCheck, XCircle, Pencil, Save, X, Loader2 } from "lucide-react";
import { ToothIcon } from "@/components/ui/tooth-icon";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { useState, useEffect, useCallback, use } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatTime, getStatusBadgeClass } from "@/lib/format";

interface FollowupDetail {
  id: string;
  treatment: string;
  amount: number;
  message: string;
  scheduled_at: string;
  status: string;
  lost_reason: string | null;
  patients: { id: string; name: string; phone: string } | null;
}

export default function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [fup, setFup] = useState<FollowupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [editData, setEditData] = useState<FollowupDetail | null>(null);

  const fetchFup = useCallback(async () => {
    try {
      const res = await fetch(`/api/followups/${resolvedParams.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setFup(json.followup);
      setEditData(json.followup);
    } catch (err) {
      console.error("Erro ao carregar ficha:", err);
      toast.error("Erro ao carregar dados do paciente");
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchFup();
  }, [fetchFup]);

  const handleSave = async () => {
    if (!editData) return;
    try {
      const res = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followup_id: editData.id,
          patient_name: editData.patients?.name,
          patient_phone: editData.patients?.phone,
          treatment: editData.treatment,
          amount: editData.amount,
          message: editData.message,
          scheduled_at: editData.scheduled_at,
          status: editData.status,
          lost_reason: editData.lost_reason,
        }),
      });

      if (!res.ok) throw new Error("Falha ao salvar");

      toast.success("Informações do paciente atualizadas!");
      setIsEditing(false);
      setFup(editData);
    } catch (err) {
      toast.error("Erro ao salvar alterações");
      console.error(err);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!fup) return;
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followup_id: fup.id }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        toast.success("Mensagem enviada via WhatsApp! 📱");
        // Atualiza status localmente
        setFup((prev) => prev ? { ...prev, status: "Enviado" } : prev);
      } else if (json.mock) {
        toast.info("Z-API não configurada — modo simulação ativo");
      } else {
        toast.error("Erro ao enviar: " + (json.error || "desconhecido"));
      }
    } catch (err) {
      toast.error("Erro ao enviar mensagem");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string, lostReason?: string) => {
    if (!fup) return;
    try {
      const res = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followup_id: fup.id,
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

      setFup((prev) => prev ? { ...prev, status: newStatus, lost_reason: lostReason || null } : prev);
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

  if (!fup) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Paciente não encontrado.</p>
        <Link href="/followup/lista" className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}>
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const patient = fup.patients;
  const displayData = isEditing ? editData! : fup;

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-5xl mx-auto w-full">
        
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border bg-background/40 backdrop-blur-2xl backdrop-saturate-150 px-6 sm:static sm:h-auto sm:border-0 sm:bg-transparent">
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
                  <Button variant="ghost" size="icon" onClick={() => { setEditData(fup); setIsEditing(false); }} className="rounded-full">
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
              <div className={cn("h-28 w-28 rounded-full flex items-center justify-center font-medium text-4xl shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-4 ring-foreground/5 bg-foreground/5 border border-foreground/10 text-foreground")}>
                {patient?.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
              {isEditing ? (
                <select 
                  value={editData!.status} 
                  onChange={e => {
                    const newStatus = e.target.value;
                    setEditData(prev => prev ? { ...prev, status: newStatus, lost_reason: newStatus !== 'Perdido' ? null : prev.lost_reason } : prev);
                  }}
                  className={cn("mt-1 py-1.5 px-4 rounded-full text-sm outline-none border focus:ring-2 focus:ring-primary bg-background", getStatusBadgeClass(new Date().toISOString() ? editData!.status : "Pendente"))}
                >
                  <option className="bg-background text-foreground" value="Pendente">Pendente</option>
                  <option className="bg-background text-foreground" value="Enviado">Enviado</option>
                  <option className="bg-background text-foreground" value="Fechado">Fechado</option>
                  <option className="bg-background text-foreground" value="Perdido">Perdido</option>
                </select>
              ) : (
                <Badge variant="outline" className={cn("mt-1 py-1.5 px-4 font-normal", getStatusBadgeClass(displayData.status))}>
                  {displayData.status}
                </Badge>
              )}
            </div>

            <div className="flex-1 grid gap-8 relative z-10 w-full mt-2">
              <div>
                {isEditing ? (
                  <Input 
                    value={editData?.patients?.name || ""}
                    onChange={e => setEditData(prev => prev ? { ...prev, patients: { ...prev.patients!, name: e.target.value } } : prev)}
                    className="text-4xl font-light h-14 bg-foreground/5 border-border focus-visible:ring-primary w-full max-w-sm"
                  />
                ) : (
                  <h2 className="text-4xl font-light tracking-tight text-foreground">{patient?.name}</h2>
                )}
                
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-foreground/80 bg-foreground/5 border border-border px-4 py-1.5 rounded-full text-sm min-w-40">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    {isEditing ? (
                      <input 
                        value={editData?.patients?.phone || ""}
                        onChange={e => setEditData(prev => prev ? { ...prev, patients: { ...prev.patients!, phone: e.target.value } } : prev)}
                        className="bg-transparent border-none outline-none w-full text-foreground/80 placeholder:text-muted-foreground"
                      />
                    ) : (
                      patient?.phone
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-foreground/80 bg-foreground/5 border border-border px-4 py-1.5 rounded-full text-sm min-w-40">
                    <ToothIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    {isEditing ? (
                      <input 
                        value={editData?.treatment || ""}
                        onChange={e => setEditData(prev => prev ? { ...prev, treatment: e.target.value } : prev)}
                        className="bg-transparent border-none outline-none w-full text-foreground/80 placeholder:text-muted-foreground"
                      />
                    ) : (
                      displayData.treatment
                    )}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-border">
                <div>
                  <span className="text-sm font-light text-muted-foreground block mb-1">Valor na Mesa</span>
                  {isEditing ? (
                    <Input 
                      value={editData?.amount?.toString() || "0"}
                      onChange={e => setEditData(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : prev)}
                      className="text-2xl font-light h-12 bg-foreground/5 border-border focus-visible:ring-primary w-full max-w-40"
                    />
                  ) : (
                    <span className="text-3xl font-light text-foreground">{formatCurrency(displayData.amount)}</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-light text-muted-foreground block mb-2">Data Programada</span>
                  <div className="flex items-center gap-4 text-foreground font-medium">
                    <div className="flex items-center gap-2 bg-foreground/5 border border-border rounded-lg px-3 py-1.5">
                      <Calendar className="h-4 w-4 text-primary shrink-0" /> 
                      <span className="font-light">{formatDate(displayData.scheduled_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-foreground/5 border border-border rounded-lg px-3 py-1.5">
                      <Clock className="h-4 w-4 text-primary shrink-0" /> 
                      <span className="font-light">{formatTime(displayData.scheduled_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {displayData.status === 'Perdido' && (
                <MotionDiv 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-6 border-t border-destructive/20"
                >
                  <span className="text-sm font-medium text-destructive block mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Motivo da Perda
                  </span>
                  {isEditing ? (
                    <select 
                      value={editData?.lost_reason || ""} 
                      onChange={e => setEditData(prev => prev ? { ...prev, lost_reason: e.target.value } : prev)}
                      className="bg-foreground/5 border border-border text-foreground text-sm rounded-lg outline-none focus:ring-2 focus:ring-destructive w-full max-w-sm p-2.5"
                    >
                      <option className="bg-background text-foreground" value="" disabled>Selecione um motivo...</option>
                      <option className="bg-background text-foreground" value="Preço muito alto">Preço muito alto</option>
                      <option className="bg-background text-foreground" value="Fechou com concorrente">Fechou com concorrente</option>
                      <option className="bg-background text-foreground" value="Sumiu (Ghosting)">Sumiu (Ghosting)</option>
                      <option className="bg-background text-foreground" value="Decidiu adiar">Decidiu adiar o tratamento</option>
                      <option className="bg-background text-foreground" value="Outro">Outro motivo</option>
                    </select>
                  ) : (
                    <span className="text-foreground/80 font-light">{displayData.lost_reason || "Motivo não informado"}</span>
                  )}
                </MotionDiv>
              )}

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
                    value={editData?.message || ""}
                    onChange={e => setEditData(prev => prev ? { ...prev, message: e.target.value } : prev)}
                    className="min-h-[150px] bg-foreground/5 border-border text-foreground font-light resize-none focus-visible:ring-primary p-4"
                  />
                ) : (
                  <>
                    {displayData.message || "Nenhuma mensagem cadastrada."}
                    <div className="absolute right-4 bottom-3 text-[10px] text-muted-foreground/80 font-medium">{formatTime(displayData.scheduled_at)}</div>
                  </>
                )}
              </div>

              <div className="mt-10">
                <Button 
                  disabled={isEditing || sending}
                  onClick={handleSendWhatsApp}
                  className="w-full sm:w-auto h-14 rounded-full px-8 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all gap-3 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:shadow-none"
                >
                  {sending ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Enviando...</>
                  ) : (
                    <><MessageCircle className="h-5 w-5" /> Enviar WhatsApp Agora</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground/80 mt-4 font-light text-center sm:text-left">
                  {isEditing ? "Salve as alterações para habilitar o envio." : "Envia a mensagem via Z-API diretamente para o WhatsApp do paciente."}
                </p>
              </div>
            </MotionDiv>

            <StaggerDiv className="flex flex-col gap-6">
              <MotionDiv className="glass-panel rounded-3xl p-8 flex flex-col gap-4">
                <h3 className="font-light text-muted-foreground mb-2">Atualizar Status</h3>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange("Fechado")}
                  className="w-full justify-start h-12 rounded-xl border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                >
                  <CheckCircle2 className="mr-3 h-5 w-5" />
                  Marcar como Fechado
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => handleStatusChange("Perdido", "Motivo não informado")}
                  className="w-full justify-start h-12 rounded-xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 text-red-600 dark:text-red-400 transition-colors"
                >
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
