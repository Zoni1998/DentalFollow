"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, Smartphone, QrCode, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StaggerDiv, MotionDiv } from "@/components/ui/motion";

export default function Configuracoes() {
  const [connectionState, setConnectionState] = useState<"disconnected" | "generating" | "qrcode" | "connected">("disconnected");

  const handleConnect = () => {
    setConnectionState("generating");
    
    // Simula o tempo que a Evolution API leva para gerar a instância e o QR Code
    setTimeout(() => {
      setConnectionState("qrcode");
    }, 2000);
  };

  const handleSimulateScan = () => {
    // Simula o usuário lendo o QR Code com o celular
    setConnectionState("connected");
  };

  const handleDisconnect = () => {
    setConnectionState("disconnected");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
      <div className="flex flex-col sm:gap-8 sm:py-8 sm:pl-14 max-w-4xl mx-auto w-full">
        
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
                        <p className="text-sm text-muted-foreground font-light">Suas mensagens são processadas em ambiente isolado (Evolution API).</p>
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
                      <Button onClick={handleConnect} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        Gerar QR Code
                      </Button>
                    </div>
                  )}

                  {connectionState === "generating" && (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-6" />
                      <h3 className="text-lg font-medium text-foreground mb-2">Criando Instância Segura</h3>
                      <p className="text-sm text-muted-foreground font-light">
                        Comunicando com a Oracle Cloud...
                      </p>
                    </div>
                  )}

                  {connectionState === "qrcode" && (
                    <div className="flex flex-col items-center">
                      <div className="p-4 bg-white rounded-2xl mb-6 shadow-xl border border-border/50">
                        {/* Fake QR Code Pattern */}
                        <div className="w-48 h-48 grid grid-cols-6 grid-rows-6 gap-1 p-2">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div key={i} className={`rounded-sm ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'} ${i === 0 || i === 5 || i === 30 ? 'bg-emerald-600 rounded-md scale-125' : ''}`} />
                          ))}
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Leia o QR Code</h3>
                      <p className="text-sm text-muted-foreground font-light mb-6">
                        Abra o WhatsApp no seu celular, vá em "Aparelhos Conectados" e aponte a câmera.
                      </p>
                      <Button onClick={handleSimulateScan} variant="outline" className="w-full h-10 rounded-xl border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                        [Simular Leitura]
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
                        +55 (11) 98888-7777
                      </p>
                      <p className="text-xs text-muted-foreground font-light mb-8">
                        Clínica Odontológica Dr. Pedro
                      </p>
                      <Button onClick={handleDisconnect} variant="outline" className="w-full h-10 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600">
                        Desconectar Aparelho
                      </Button>
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
