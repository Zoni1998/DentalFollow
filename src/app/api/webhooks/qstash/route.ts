import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppMessage } from "@/lib/zapi";
import crypto from "crypto";

/**
 * Valida a assinatura do QStash para garantir que a requisição
 * é legítima e não um atacante externo.
 *
 * QStash envia dois headers:
 *   - "Upstash-Signature: <v=1,t=TIMESTAMP,s=HMAC>"
 *   Pode estar no header "Authorization" ou "Upstash-Signature".
 *
 * O HMAC é SHA-256 do body assinado com a signing key.
 */
function verifyQStashSignature(
  body: string,
  signature: string | null,
  signingKey: string
): boolean {
  if (!signature || !signingKey) return false;

  try {
    // QStash envia assinaturas no formato: "{v=1,t=...,s=...}"
    // Mas o padrão mais novo envia formato JWT ou string simples.
    // Vamos suportar o formato "Upstash-Signature" tradicional.
    const parts = signature.split(",");
    let t = "";
    let s = "";

    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key.trim() === "t") t = value.trim();
      if (key.trim() === "s") s = value.trim();
    }

    if (!t || !s) return false;

    // Recria a assinatura: HMAC-SHA256 de "{t}.{body}"
    const message = `${t}.${body}`;
    const expectedSig = crypto
      .createHmac("sha256", signingKey)
      .update(message)
      .digest("hex");

    // Compara em tempo constante para evitar timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(s, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    return false;
  }
}

// Endpoint chamado pelo Upstash QStash periodicamente (ex: a cada minuto)
export async function POST(req: Request) {
  try {
    const bodyText = await req.text();

    // 1. Validar assinatura do QStash
    const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY || "";
    const signature =
      req.headers.get("Upstash-Signature") ||
      req.headers.get("Authorization");

    if (signingKey) {
      const isValid = verifyQStashSignature(bodyText, signature, signingKey);
      if (!isValid) {
        console.error("QStash signature verification failed");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    // Se signingKey não configurado, loga warning mas continua (modo dev)
    if (!signingKey) {
      console.warn("QSTASH_CURRENT_SIGNING_KEY not set — skipping signature verification (dev mode)");
    }

    // 2. Busca followups agendados que estejam prontos para envio
    // status = 'Pendente' e scheduled_at <= NOW()
    const { data: followups, error: fetchError } = await supabaseAdmin
      .from("followups")
      .select(`
        id,
        message,
        patient_id,
        patients (
          id,
          phone
        )
      `)
      .eq("status", "Pendente")
      .lte("scheduled_at", new Date().toISOString());

    if (fetchError) {
      console.error("Erro ao buscar followups do Supabase:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!followups || followups.length === 0) {
      return NextResponse.json({ message: "No pending messages." });
    }

    const results = [];

    // 3. Envia as mensagens via Z-API
    for (const fup of followups) {
      // Supabase Client v2 tipa join como array — acessamos manualmente
      const patients = fup.patients as unknown as { id: string; phone: string } | null;
      const patientPhone = patients?.phone;

      if (!patientPhone) {
        await supabaseAdmin
          .from("followups")
          .update({ status: "Perdido", lost_reason: "Sem telefone configurado", zapi_response: { error: "Sem telefone" } })
          .eq("id", fup.id);
        continue;
      }

      // Chama a Z-API
      const sendResult = await sendWhatsAppMessage(patientPhone, fup.message);

      if (sendResult.success) {
        // 4. Atualiza o banco como Enviado
        await supabaseAdmin
          .from("followups")
          .update({ status: "Enviado", zapi_response: sendResult })
          .eq("id", fup.id);

        results.push({ id: fup.id, status: "Enviado" });
      } else {
        // Salva erro mas mantém como Pendente para retry
        await supabaseAdmin
          .from("followups")
          .update({ zapi_response: sendResult })
          .eq("id", fup.id);

        results.push({ id: fup.id, status: "Erro", error: sendResult.error });
      }
    }

    return NextResponse.json({
      processed: followups.length,
      results
    });

  } catch (err: any) {
    console.error("Internal Error na Rota de QStash:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
