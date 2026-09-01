"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import {
  ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText, Flame,
  IdCard, Loader2, MapPin, MessageCircle, Pencil, Phone, Save,
  Snowflake, Trash2, UserRound, X, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getBudgetTemperature, getDaysSinceConsultation } from "@/lib/budget";
import { formatCpf, formatCurrency, formatDate, formatDateTime, getStatusBadgeClass } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  cpf: string | null;
  address: string | null;
}

interface FollowupDetail {
  id: string;
  consultation_date: string | null;
  treatment: string;
  amount: number;
  message: string;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  patients: PatientProfile | null;
}

interface MessageHistoryItem {
  id: string;
  message: string;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  updated_at: string;
}

function toDateTimeLocal(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function FieldValue({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-11 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground">
      {children || "â€”"}
    </div>
  );
}

export default function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [fup, setFup] = useState<FollowupDetail | null>(null);
  const [messages, setMessages] = useState<MessageHistoryItem[]>([]);
  const [editData, setEditData] = useState<FollowupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFup = useCallback(async () => {
    try {
      const response = await fetch(`/api/followups/${id}`);
      if (!response.ok) throw new Error("Falha ao carregar a ficha");
      const data = await response.json();
      setFup(data.followup);
      setEditData(data.followup);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Erro ao carregar ficha:", error);
      toast.error("Erro ao carregar dados do paciente");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Esta chamada sincroniza a pÃ¡gina cliente com a API ao trocar o id da rota.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFup();
  }, [fetchFup]);

  const updatePatient = (field: keyof PatientProfile, value: string) => {
    setEditData((current) => current?.patients ? {
      ...current,
      patients: { ...current.patients, [field]: value },
    } : current);
  };

  const handleSave = async () => {
    if (!editData) return;
    setSaving(true);
    try {
      const response = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followup_id: editData.id,
          patient_name: editData.patients?.name,
          patient_phone: editData.patients?.phone,
          patient_cpf: editData.patients?.cpf,
          patient_address: editData.patients?.address,
          treatment: editData.treatment,
          amount: editData.amount,
          message: editData.message,
          scheduled_at: editData.scheduled_at,
          consultation_date: editData.consultation_date,
          status: editData.status,
          lost_reason: editData.lost_reason,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Falha ao salvar");
      await fetchFup();
      setIsEditing(false);
      toast.success("InformaÃ§Ãµes do paciente atualizadas!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar alteraÃ§Ãµes");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string, lostReason?: string) => {
    if (!fup) return;
    try {
      const response = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followup_id: fup.id, status, lost_reason: lostReason || null }),
      });
      if (!response.ok) throw new Error("Falha ao atualizar o status");
      await fetchFup();
      toast.success(status === "Fechado" ? "OrÃ§amento fechado!" : "OrÃ§amento marcado como perdido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar status");
    }
  };

  const handleDelete = async () => {
    if (!fup) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/followups/${fup.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Falha ao apagar a ficha");
      toast.success("Ficha apagada com sucesso!");
      router.push("/orcamentos");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao apagar ficha");
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Carregando ficha do paciente">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (!fup || !editData) return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <UserRound className="size-10 text-muted-foreground" />
      <div>
        <h1 className="text-xl font-semibold text-balance">Paciente nÃ£o encontrado</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">A ficha pode ter sido removida ou o link estÃ¡ incorreto.</p>
      </div>
      <Link href="/followup/lista" className={buttonVariants({ variant: "outline" })}>Voltar para a lista</Link>
    </div>
  );

  const displayData = isEditing ? editData : fup;
  const patient = displayData.patients;
  const consultationDate = displayData.consultation_date || displayData.created_at;
  const temperature = getBudgetTemperature(consultationDate);
  const daysSinceConsultation = getDaysSinceConsultation(consultationDate);
  const isHot = temperature === "Quente";

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
        <header className="flex flex-col gap-5 border-b border-border pb-6">
          <div className="flex items-center justify-between gap-4">
            <Link href="/followup/lista" aria-label="Voltar para a lista de pacientes" className={buttonVariants({ variant: "outline", size: "icon" })}>
              <ArrowLeft className="size-4" />
            </Link>
            <div className="flex items-center gap-2">
              <AlertDialog.Root>
                <AlertDialog.Trigger aria-label="Apagar ficha do paciente" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-destructive hover:bg-destructive/10 hover:text-destructive")}>
                  <Trash2 className="size-4" />
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Backdrop className="fixed inset-0 z-40 min-h-dvh bg-black/50" />
                  <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-5 rounded-2xl border border-border bg-background p-6 shadow-xl">
                    <div>
                      <AlertDialog.Title className="text-lg font-semibold text-balance">Apagar esta ficha?</AlertDialog.Title>
                      <AlertDialog.Description className="mt-2 text-sm text-muted-foreground text-pretty">O cadastro, o orÃ§amento e o histÃ³rico deste paciente serÃ£o removidos permanentemente.</AlertDialog.Description>
                    </div>
                    <div className="flex justify-end gap-3">
                      <AlertDialog.Close className={buttonVariants({ variant: "outline" })}>Cancelar</AlertDialog.Close>
                      <button type="button" onClick={handleDelete} disabled={deleting} className={buttonVariants({ variant: "destructive" })}>
                        {deleting && <Loader2 className="size-4 animate-spin" />} Apagar ficha
                      </button>
                    </div>
                  </AlertDialog.Popup>
                </AlertDialog.Portal>
              </AlertDialog.Root>
              <ThemeToggle />
              {isEditing ? <>
                <Button variant="outline" onClick={() => { setEditData(fup); setIsEditing(false); }} disabled={saving}><X className="size-4" />Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="shadow-none hover:shadow-none">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar
                </Button>
              </> : (
                <Button variant="outline" onClick={() => setIsEditing(true)}><Pencil className="size-4" />Editar</Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xl font-semibold">{patient?.name?.charAt(0)?.toUpperCase() || "?"}</div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Ficha do paciente</p>
                <h1 className="truncate text-2xl font-semibold text-balance sm:text-3xl">{patient?.name || "Sem nome"}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-4" />{patient?.phone || "Telefone nÃ£o informado"}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn("px-3 py-1", getStatusBadgeClass(displayData.status))}>{displayData.status}</Badge>
              <Badge variant="outline" className={cn("gap-1.5 px-3 py-1", isHot ? "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400" : "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400")}>
                {isHot ? <Flame className="size-3.5" /> : <Snowflake className="size-3.5" />}{temperature} Â· {daysSinceConsultation} {daysSinceConsultation === 1 ? "dia" : "dias"}
              </Badge>
            </div>
          </div>
        </header>

        <Tabs defaultValue="orcamento" className="w-full gap-6">
          <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border px-0 pb-1">
            <TabsTrigger value="orcamento" className="min-h-10 flex-none gap-2 px-4"><FileText className="size-4" />OrÃ§amento</TabsTrigger>
            <TabsTrigger value="cadastro" className="min-h-10 flex-none gap-2 px-4"><IdCard className="size-4" />Cadastro</TabsTrigger>
            <TabsTrigger value="mensagens" className="min-h-10 flex-none gap-2 px-4"><MessageCircle className="size-4" />Mensagens enviadas</TabsTrigger>
          </TabsList>

          <TabsContent value="orcamento" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-balance">Dados do orÃ§amento</h2>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">Tratamento, valor e datas que definem a prioridade do contato.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="treatment">Tratamento de interesse</Label>
                  {isEditing ? <Input id="treatment" value={editData.treatment} onChange={(e) => setEditData({ ...editData, treatment: e.target.value })} /> : <FieldValue>{displayData.treatment}</FieldValue>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Valor do orÃ§amento</Label>
                  {isEditing ? <Input id="amount" type="number" min="0" step="0.01" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: Number(e.target.value) || 0 })} /> : <FieldValue><span className="font-medium tabular-nums">{formatCurrency(displayData.amount)}</span></FieldValue>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="consultation-date">Data do atendimento</Label>
                  {isEditing ? <Input id="consultation-date" type="date" value={editData.consultation_date || ""} onChange={(e) => setEditData({ ...editData, consultation_date: e.target.value })} /> : <FieldValue><span className="flex items-center gap-2 tabular-nums"><CalendarDays className="size-4 text-muted-foreground" />{formatDate(consultationDate)}</span></FieldValue>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="return-date">Data de retorno</Label>
                  {isEditing ? <Input id="return-date" type="datetime-local" value={toDateTimeLocal(editData.scheduled_at)} onChange={(e) => setEditData({ ...editData, scheduled_at: new Date(e.target.value).toISOString() })} /> : <FieldValue><span className="flex items-center gap-2 tabular-nums"><Clock3 className="size-4 text-muted-foreground" />{formatDateTime(displayData.scheduled_at)}</span></FieldValue>}
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="status">SituaÃ§Ã£o do orÃ§amento</Label>
                  {isEditing ? (
                    <select id="status" value={editData.status} onChange={(e) => { const status = e.target.value; setEditData({ ...editData, status, lost_reason: status === "Perdido" ? editData.lost_reason : null }); }} className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      <option value="Pendente">Pendente</option><option value="Enviado">Enviado</option><option value="Fechado">Fechado</option><option value="Perdido">Perdido</option>
                    </select>
                  ) : <FieldValue>{displayData.status}</FieldValue>}
                </div>
                {displayData.status === "Perdido" && <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="lost-reason">Motivo da perda</Label>
                  {isEditing ? <Input id="lost-reason" value={editData.lost_reason || ""} onChange={(e) => setEditData({ ...editData, lost_reason: e.target.value })} /> : <FieldValue>{displayData.lost_reason || "Motivo nÃ£o informado"}</FieldValue>}
                </div>}
              </div>
            </section>

            <aside className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-medium">Temperatura</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className={cn("flex size-10 items-center justify-center rounded-full", isHot ? "bg-orange-500/10 text-orange-600" : "bg-sky-500/10 text-sky-600")}>{isHot ? <Flame className="size-5" /> : <Snowflake className="size-5" />}</div>
                  <div><p className="font-semibold">OrÃ§amento {temperature.toLowerCase()}</p><p className="text-xs text-muted-foreground">{isHot ? "Atendido hÃ¡ atÃ© 3 dias" : "Atendido hÃ¡ mais de 3 dias"}</p></div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-medium">Atualizar situaÃ§Ã£o</p>
                <div className="mt-4 grid gap-3">
                  <Button variant="outline" onClick={() => handleStatusChange("Fechado")} className="justify-start text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-4" />Marcar como fechado</Button>
                  <Button variant="outline" onClick={() => handleStatusChange("Perdido", "Motivo nÃ£o informado")} className="justify-start text-destructive"><XCircle className="size-4" />Marcar como perdido</Button>
                </div>
              </div>
            </aside>
          </TabsContent>

          <TabsContent value="cadastro">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6"><h2 className="text-lg font-semibold text-balance">Dados cadastrais</h2><p className="mt-1 text-sm text-muted-foreground text-pretty">InformaÃ§Ãµes pessoais e de contato do paciente.</p></div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="patient-name">Nome completo</Label>
                  {isEditing ? <Input id="patient-name" value={editData.patients?.name || ""} onChange={(e) => updatePatient("name", e.target.value)} /> : <FieldValue><span className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" />{patient?.name}</span></FieldValue>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patient-phone">WhatsApp</Label>
                  {isEditing ? <Input id="patient-phone" type="tel" value={editData.patients?.phone || ""} onChange={(e) => updatePatient("phone", e.target.value)} /> : <FieldValue><span className="flex items-center gap-2 tabular-nums"><Phone className="size-4 text-muted-foreground" />{patient?.phone}</span></FieldValue>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="patient-cpf">CPF</Label>
                  {isEditing ? <Input id="patient-cpf" inputMode="numeric" maxLength={14} value={editData.patients?.cpf || ""} onChange={(e) => updatePatient("cpf", e.target.value)} placeholder="000.000.000-00" /> : <FieldValue><span className="flex items-center gap-2 tabular-nums"><IdCard className="size-4 text-muted-foreground" />{formatCpf(patient?.cpf)}</span></FieldValue>}
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="patient-address">EndereÃ§o</Label>
                  {isEditing ? <Textarea id="patient-address" value={editData.patients?.address || ""} onChange={(e) => updatePatient("address", e.target.value)} placeholder="Rua, nÃºmero, complemento, bairro, cidade e CEP" className="min-h-28 resize-none" /> : <FieldValue><span className="flex items-start gap-2 whitespace-pre-wrap"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />{patient?.address || "EndereÃ§o nÃ£o informado"}</span></FieldValue>}
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="mensagens">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div><h2 className="text-lg font-semibold text-balance">Mensagens e agendamento</h2><p className="mt-1 text-sm text-muted-foreground text-pretty">ConteÃºdo, data programada e confirmaÃ§Ã£o dos disparos automÃ¡ticos.</p></div>
                <p className="text-xs text-muted-foreground">O envio ocorre automaticamente na data de retorno.</p>
              </div>
              {isEditing && <div className="mb-6 grid gap-5 rounded-xl border border-border bg-muted/20 p-4">
                <div className="grid gap-2"><Label htmlFor="message">Mensagem programada</Label><Textarea id="message" value={editData.message} onChange={(e) => setEditData({ ...editData, message: e.target.value })} className="min-h-32 resize-none" /></div>
                <div className="grid gap-2 sm:max-w-sm"><Label htmlFor="message-date">Data do disparo</Label><Input id="message-date" type="datetime-local" value={toDateTimeLocal(editData.scheduled_at)} onChange={(e) => setEditData({ ...editData, scheduled_at: new Date(e.target.value).toISOString() })} /></div>
              </div>}
              <div className="grid gap-4">
                {messages.map((item) => <article key={item.id} className="rounded-xl border border-border p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0"><p className="text-sm leading-6 text-pretty">{item.message}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground tabular-nums"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />Programada: {formatDateTime(item.scheduled_at)}</span>{item.sent_at && <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5" />Enviada: {formatDateTime(item.sent_at)}</span>}</div></div>
                    <Badge variant="outline" className={cn("shrink-0", getStatusBadgeClass(item.status))}>{item.status}</Badge>
                  </div>
                </article>)}
                {messages.length === 0 && <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center">
                  <MessageCircle className="size-9 text-muted-foreground" /><div><p className="font-medium">Nenhuma mensagem cadastrada</p><p className="mt-1 text-sm text-muted-foreground text-pretty">Use o modo de ediÃ§Ã£o para escrever e agendar a primeira mensagem.</p></div>{!isEditing && <Button variant="outline" onClick={() => setIsEditing(true)}><Pencil className="size-4" />Adicionar mensagem</Button>}
                </div>}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

