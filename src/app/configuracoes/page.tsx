"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Smartphone, QrCode, CheckCircle2, ShieldCheck, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";
import { toast } from "sonner";

const CLIENT_TIMEOUT_MS = 25_000;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function Configuracoes() {
  const [connectionState, setConnectionState] = useState<"disconnected" | "generating" | "qrcode" | "connected">("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  // Verifica status ao carregar a página
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetchWithTimeout("/api/whatsapp/qr");
      const json = await res.json();

      if (json.mock) {
        setIsMock(true);
        return; // Mantém disconnected se for mock
      }

      if (json.connected) {
        setConnectionState("connected");
        setPhone(json.phone || null);
        setError(null);
      } else if (json.qrcode) {
        setQrCode(json.qrcode);
        setConnectionState("qrcode");
        setError(null);
      } else {
        setConnectionState("disconnected");
      }
    } catch (err) {
      console.error("Erro ao verificar status:", err);
      setConnectionState("disconnected");
    }
  }, []);

  const handleConnect = async () => {
    setConnectionState("generating");
    setError(null);

    try {
      let res = await fetchWithTimeout("/api/whatsapp/qr", { method: "POST" });
      let json = await res.json();

      if (json.mock) {
        setIsMock(true);
        // Simula o fluxo se Z-API não estiver configurada
        setTimeout(() => {
          setConnectionState("qrcode");
          // Gera um QR code simulado
          setQrCode(null);
        }, 2000);
        return;
      }

      if (json.error) {
        setError(json.error);
        setConnectionState("disconnected");
        toast.error(json.error);
        return;
      }

      if (json.connected) {
        setConnectionState("connected");
        setPhone(json.phone || null);
        toast.success("WhatsApp já está conectado!");
        return;
      }

      if (json.qrcode) {
        setQrCode(json.qrcode);
        setConnectionState("qrcode");
        return;
      }

      // A criação pode terminar antes de o Baileys disponibilizar o QR.
      // Consulta por alguns segundos antes de mostrar erro ao usuário.
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await wait(1_500);
        res = await fetchWithTimeout("/api/whatsapp/qr");
        json = await res.json();

        if (json.error) {
          throw new Error(json.error);
        }

        if (json.connected) {
          setConnectionState("connected");
          setPhone(json.phone || null);
          return;
        }

        if (json.qrcode) {
          setQrCode(json.qrcode);
          setConnectionState("qrcode");
          return;
        }
      }

      throw new Error("A nova instância foi criada, mas o QR Code ainda não ficou disponível.");
    } catch (err) {
      const message = err instanceof Error && err.name === "AbortError"
        ? "A Evolution API demorou demais para responder."
        : err instanceof Error
          ? err.message
          : "Erro de conexão com o servidor";
      setError(message);
      setConnectionState("disconnected");
      toast.error(message);
    }
  };

  const handleRefresh = () => {
    setConnectionState("generating");
    handleConnect();
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetchWithTimeout("/api/whatsapp/qr", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erro ao desconectar");
      }
      setConnectionState("disconnected");
      setQrCode(null);
      setPhone(null);
      setError(null);
      toast.success("WhatsApp desconectado e instância antiga removida!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao desconectar o aparelho.";
      setError(message);
      toast.error(message);
      console.error(err);
    }
  };

  const handleSwitchWhatsApp = async () => {
    const confirmed = window.confirm(
      "Trocar o WhatsApp removerá a conexão atual e criará um QR Code novo. Deseja continuar?"
    );

    if (!confirmed) return;
    setPhone(null);
    setQrCode(null);
    await handleConnect();
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-4xl mx-auto w-full">
        
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
                Integrações
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-start gap-8 p-6 sm:px-6 sm:py-0 md:gap-12">
          
          <StaggerDiv className="grid gap-8 w-full">
            <MotionDiv className="glass-panel p-8 sm:p-12 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
              
              {isMock && (
                <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 relative z-10">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Modo Simulação</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      A API de WhatsApp não está configurada. Defina <code className="text-primary">EVOLUTION_API_URL</code> e <code className="text-primary">EVOLUTION_API_KEY</code> no arquivo .env para usar o envio real.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-12 items-start relative z-10">
                <div className="flex-1">
                  <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-2xl mb-6">
                    <Smartphone className="h-8 w-8 text-emerald-500" />
                  </div>
                  
                  <h2 className="text-3xl font-light tracking-tight text-foreground mb-4">
                    Conectar WhatsApp
                  </h2>
                  <p className="text-muted-foreground font-light leading-relaxed mb-8">
                    Vincule o número oficial da sua clínica para automatizar o envio de mensagens para os pacientes. O processo é exatamente o mesmo do WhatsApp Web.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Segurança de Ponta a Ponta</h4>
                        <p className="text-sm text-muted-foreground font-light">Suas mensagens são processadas via Evolution API em ambiente isolado.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-foreground">Disparos Automáticos</h4>
                        <p className="text-sm text-muted-foreground font-light">Seu celular não precisa estar com a tela ligada na hora do envio.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[360px] bg-foreground/5 border border-border rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[380px]">
                  
                  {connectionState === "disconnected" && (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-foreground/5 rounded-full flex items-center justify-center mb-6">
                        <QrCode className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Pronto para conectar</h3>
                      <p className="text-sm text-muted-foreground font-light mb-8">
                        Clique abaixo para gerar seu código de acesso exclusivo.
                      </p>
                      {error && (
                        <p className="text-xs text-red-500 mb-4" role="alert">
                          {error}
                        </p>
                      )}
                      <Button onClick={handleConnect} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        Gerar novo QR Code
                      </Button>
                    </div>
                  )}

                  {connectionState === "generating" && (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-6" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Criando Instância Segura</h3>
                      <p className="text-sm text-muted-foreground font-light">
                        Comunicando com a Evolution API...
                      </p>
                    </div>
                  )}

                  {connectionState === "qrcode" && (
                    <div className="flex flex-col items-center">
                      {qrCode ? (
                        <div className="p-4 bg-white rounded-2xl mb-6 shadow-xl border border-border/50">
                          <img src={qrCode} alt="QR Code para WhatsApp" width={192} height={192} className="w-48 h-48" />
                        </div>
                      ) : (
                        <div className="p-4 bg-white rounded-2xl mb-6 shadow-xl border border-border/50">
                          {/* QR Code simulado */}
                          <div className="w-48 h-48 grid grid-cols-6 grid-rows-6 gap-1 p-2">
                            {Array.from({ length: 36 }).map((_, i) => (
                              <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'} ${i === 0 || i === 5 || i === 30 ? 'bg-emerald-600 rounded-md scale-125' : ''}`} />
                            ))}
                          </div>
                        </div>
                      )}
                      <h3 className="text-lg font-medium text-foreground mb-2">Leia o QR Code</h3>
                      <p className="text-sm text-muted-foreground font-light mb-4">
                        Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera.
                      </p>
                      <Button onClick={handleRefresh} variant="outline" className="w-full h-10 rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                        Atualizar QR Code
                      </Button>
                    </div>
                  )}

                  {connectionState === "connected" && (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                      </div>
                      <h3 className="text-xl font-medium text-foreground mb-2">Conectado!</h3>
                      <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 font-medium mb-1">
                        {phone || "Número conectado"}
                      </p>
                      <p className="text-xs text-muted-foreground font-light mb-8">
                        Minha Clínica
                      </p>
                      <div className="w-full space-y-3">
                        <Button onClick={handleSwitchWhatsApp} className="w-full h-11 rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                          <RefreshCw className="h-4 w-4" />
                          Trocar WhatsApp
                        </Button>
                        <Button onClick={handleDisconnect} variant="outline" className="w-full h-10 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600">
                          Desconectar e remover instância
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </MotionDiv>
          </StaggerDiv>
        </main>
      </div>
    </div>
  );
}
