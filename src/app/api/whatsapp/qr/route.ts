import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/qr
 * Busca o QR code da instância Evolution API para conexão do WhatsApp.
 * Cria a instância automaticamente caso não exista.
 */
export async function GET() {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "Padrao";

  if (!apiUrl || !apiKey) {
    return NextResponse.json({
      connected: false,
      error: "Evolution API não configurada. Configure EVOLUTION_API_URL e EVOLUTION_API_KEY no .env",
      mock: true,
    });
  }

  try {
    const baseUrl = apiUrl.replace(/\/$/, "");

    // 1. Tenta verificar o estado atual
    let stateRes = await fetch(`${baseUrl}/instance/connectionState/${instanceName}`, {
      headers: { "apikey": apiKey }
    });
    
    // Se a instância não existir (404), criamos ela
    if (stateRes.status === 404 || stateRes.status === 400) {
      const createUrl = `${baseUrl}/instance/create`;
      await fetch(createUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey
        },
        body: JSON.stringify({
          instanceName: instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      // Aguarda um pouco para a instância inicializar
      await new Promise(r => setTimeout(r, 1000));
    } else {
      let stateData = await stateRes.json();
      if (stateData?.instance?.state === "open") {
        // Já está conectado, busca o número
        const instRes = await fetch(`${baseUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
          headers: { "apikey": apiKey }
        });
        const instData = await instRes.json();
        const ownerJid = instData?.[0]?.ownerJid || "";
        const phone = ownerJid.split("@")[0];
        
        return NextResponse.json({
          connected: true,
          phone: phone || "Conectado",
        });
      } else if (stateData?.instance?.state === "connecting") {
         return NextResponse.json({
          connected: false,
          error: "Conectando ao WhatsApp... Aguarde.",
        });
      }
    }

    // 2. Se não estiver open, pegamos o QR Code
    let connectUrl = `${baseUrl}/instance/connect/${instanceName}`;
    let response = await fetch(connectUrl, {
      method: "GET",
      headers: { "apikey": apiKey }
    });
    
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({
        connected: false,
        error: "Credenciais da Evolution API recusadas. Verifique a API Key.",
      }, { status: 401 });
    }

    let data = await response.json();

    // 3. Processa a resposta do QR Code
    if (data.base64 || (data.qrcode && data.qrcode.base64)) {
      const qrCode = data.base64 || data.qrcode.base64;
      return NextResponse.json({
        connected: false,
        qrcode: qrCode,
      });
    }

    return NextResponse.json({
      connected: false,
      error: "Aguardando geração do QR Code. Tente novamente em alguns segundos.",
    });
        
    } catch (err: any) {
    console.error("Erro em GET /api/whatsapp/qr:", err);
    return NextResponse.json({
      connected: false,
      error: err.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/whatsapp/qr
 * Desconecta a instância do WhatsApp (Logout).
 */
export async function DELETE() {
  const apiUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "Padrao";

  if (!apiUrl || !apiKey) {
    return NextResponse.json({ success: true, mock: true });
  }

  try {
    const baseUrl = apiUrl.replace(/\/$/, "");
    const logoutUrl = `${baseUrl}/instance/logout/${instanceName}`;
    
    await fetch(logoutUrl, {
      method: "DELETE",
      headers: { "apikey": apiKey }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao desconectar WhatsApp:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
