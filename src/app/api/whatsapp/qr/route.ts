import { NextResponse } from "next/server";

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

    // 1. Tenta conectar na instância e pegar o QR Code
    let connectUrl = `${baseUrl}/instance/connect/${instanceName}`;
    let response = await fetch(connectUrl, {
      method: "GET",
      headers: { "apikey": apiKey }
    });

    let data = await response.json();

    // 2. Se a instância não existir (404), criamos ela
    if (response.status === 404 || (data.message && data.message.includes("not found"))) {
      const createUrl = `${baseUrl}/instance/create`;
      response = await fetch(createUrl, {
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
      data = await response.json();
    } else if (response.status === 401 || response.status === 403) {
      return NextResponse.json({
        connected: false,
        error: "Credenciais da Evolution API recusadas. Verifique a API Key.",
      }, { status: 401 });
    }

    // 3. Processa a resposta
    if (data.base64 || (data.qrcode && data.qrcode.base64)) {
      const qrCode = data.base64 || data.qrcode.base64;
      return NextResponse.json({
        connected: false,
        qrcode: qrCode,
      });
    } else if (data.instance?.status === "open" || data.instance?.state === "open") {
      return NextResponse.json({
        connected: true,
        phone: data.instance?.owner || null,
      });
    }

    return NextResponse.json({
      connected: false,
      error: "Status desconhecido da Evolution API.",
    }, { status: 500 });
    
  } catch (err: any) {
    console.error("Erro em GET /api/whatsapp/qr:", err);
    return NextResponse.json({
      connected: false,
      error: err.message,
    }, { status: 500 });
  }
}
