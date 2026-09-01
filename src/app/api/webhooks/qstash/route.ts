import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppMessage } from "@/lib/evolution";
import crypto from "crypto";

/**
 * Valida a assinatura do QStash para garantir que a requisiÃ§Ã£o
 * Ã© legÃ­tima e nÃ£o um atacante externo.
 *
 * QStash envia dois headers:
 *   - "Upstash-Signature: <v=1,t=TIMESTAMP,s=HMAC>"
 *   Pode estar no header "Authorization" ou "Upstash-Signature".
 *
 * O HMAC Ã© SHA-256 do body assinado com a signing key.
 */
function verifyQStashSignature(
  body: string,
  signature: string | null,
  signingKey: string
): boolean {
  if (!signature || !signingKey) return false;

  try {
    // QStash envia assinaturas no formato: "{v=1,t=...,s=...}"
    // Mas o padrÃ£o mais novo envia formato JWT ou string simples.
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

    // 1. Validar seguranÃ§a (QStash Signature ou CRON_SECRET)
    const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY || "";
    const cronSecret = process.env.CRON_SECRET || "";
    const signature = req.headers.get("Upstash-Signature") || "";
    const authHeader = req.headers.get("Authorization") || "";

    let isAuthorized = false;

    if (signingKey && signature) {
      isAuthorized = verifyQStashSignature(bodyText, signature, signingKey);
    } else if (cronSecret && authHeader.replace("Bearer ", "").trim() === cronSecret) {
      isAuthorized = true;
    } else if (!signingKey && !cronSecret) {
      // Modo Dev (sem chaves)
      console.warn("Nenhuma chave de seguranÃ§a configurada. Executando em modo aberto (Perigoso).");
      isAuthorized = true;
    }

    if (!isAuthorized) {
      console.error("Tentativa nÃ£o autorizada no Webhook");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      // Supabase Client v2 tipa join como array â€” acessamos manualmente
      const patients = fup.patients as unknown as { id: string; phone: string } | null;
      const patientPhone = patients?.phone;

      // Reserva o follow-up antes de chamar a Evolution API. A atualizaÃ§Ã£o
      // condicional funciona como um lock atÃ´mico: se dois webhooks processarem
      // a mesma linha, somente um consegue trocar Pendente por Enviado.
      const { data: claimedFollowup, error: claimError } = await supabaseAdmin
        .from("followups")
        .update({
          status: "Enviado",
          zapi_response: {
            status: "processing",
            claimed_at: new Date().toISOString(),
          },
        })
        .eq("id", fup.id)
        .eq("status", "Pendente")
        .select("id")
        .maybeSingle();

      if (claimError) {
        console.error(`Erro ao reservar follow-up ${fup.id}:`, claimError);
        results.push({ id: fup.id, status: "Erro", error: claimError.message });
        continue;
      }

      if (!claimedFollowup) {
        // Outra execuÃ§Ã£o jÃ¡ reservou ou enviou esta mensagem.
        results.push({ id: fup.id, status: "Ignorado", reason: "JÃ¡ estÃ¡ em processamento" });
        continue;
      }

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
        // 4. MantÃ©m Enviado e grava a resposta final da Evolution API
        await supabaseAdmin
          .from("followups")
          .update({
            zapi_response: sendResult,
            sent_at: new Date().toISOString(),
          })
          .eq("id", fup.id)
          .eq("status", "Enviado");

        results.push({ id: fup.id, status: "Enviado" });
      } else {
        // Libera a reserva para uma tentativa futura em caso de erro.
        await supabaseAdmin
          .from("followups")
          .update({ status: "Pendente", zapi_response: sendResult, sent_at: null })
          .eq("id", fup.id)
          .eq("status", "Enviado");

        results.push({ id: fup.id, status: "Erro", error: sendResult.error });
      }
    }

    return NextResponse.json({
      processed: followups.length,
      results
    });

  } catch (err: unknown) {
    console.error("Internal Error na Rota de QStash:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

