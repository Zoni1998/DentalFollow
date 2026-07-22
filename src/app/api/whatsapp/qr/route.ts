import { NextResponse } from "next/server";

/**
 * GET /api/whatsapp/qr
 * Busca o QR code da instância Z-API para conexão do WhatsApp.
 * Endpoint Z-API: GET /instances/{INSTANCE}/token/{TOKEN}/qr-code
 * Retorna { qrcode: base64_image, status: "connected" | "disconnected" }
 */
export async function GET() {
  const instanceId = process.env.ZAPI_INSTANCE_ID;
  const token = process.env.ZAPI_TOKEN;

  if (!instanceId || !token) {
    return NextResponse.json({
      connected: false,
      error: "Z-API não configurada. Configure ZAPI_INSTANCE_ID e ZAPI_TOKEN no .env",
      mock: true,
    });
  }

  try {
    // Tenta buscar o status da instância primeiro
    const statusUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/connection-status`;
    const statusRes = await fetch(statusUrl);

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      console.error("Z-API status error:", errText);
      return NextResponse.json({
        connected: false,
        error: "Erro ao verificar status da instância Z-API",
      }, { status: 500 });
    }

    const statusData = await statusRes.json();

    // Se já conectado, retorna
    if (statusData.connected) {
      return NextResponse.json({
        connected: true,
        phone: statusData.phone || null,
      });
    }

    // Busca QR Code
    const qrUrl = `https://api.z-api.io/instances/${instanceId}/token/${token}/qr-code`;
    const qrRes = await fetch(qrUrl);

    if (!qrRes.ok) {
      const errText = await qrRes.text();
      console.error("Z-API QR error:", errText);
      return NextResponse.json({
        connected: false,
        error: "Erro ao gerar QR Code. Tente novamente.",
      }, { status: 500 });
    }

    const qrData = await qrRes.json();

    return NextResponse.json({
      connected: false,
      qrcode: qrData.qrcode || qrData.qrCode || null,
    });
  } catch (err: any) {
    console.error("Erro em GET /api/whatsapp/qr:", err);
    return NextResponse.json({
      connected: false,
      error: err.message,
    }, { status: 500 });
  }
}
