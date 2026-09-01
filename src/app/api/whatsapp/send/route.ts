import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppMessage } from "@/lib/evolution";

/**
 * POST /api/whatsapp/send
 * Envia uma mensagem de WhatsApp imediata para um paciente.
 * Body: { followup_id: string }
 * Busca a mensagem e o telefone do followup e dispara via Z-API.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { followup_id, phone, message } = body;

    let targetPhone = phone;
    let targetMessage = message;

    // Se temos followup_id, busca do banco
    if (followup_id) {
      const { data: fup, error } = await supabaseAdmin
        .from("followups")
        .select(`
          id,
          message,
          status,
          patients (id, phone)
        `)
        .eq("id", followup_id)
        .single();

      if (error || !fup) {
        return NextResponse.json({ error: "Followup não encontrado" }, { status: 404 });
      }

      const patients = fup.patients as unknown as { id: string; phone: string } | null;
      targetPhone = patients?.phone;
      targetMessage = fup.message;

      if (!targetPhone) {
        return NextResponse.json({ error: "Paciente sem telefone" }, { status: 400 });
      }
    }

    if (!targetPhone || !targetMessage) {
      return NextResponse.json({ error: "Telefone e mensagem são obrigatórios" }, { status: 400 });
    }

    // Para follow-ups, reserva a linha de modo atômico antes do envio.
    // Isso evita duplicatas entre cliques rápidos, chamadas repetidas e o QStash.
    if (followup_id) {
      const { data: claimedFollowup, error: claimError } = await supabaseAdmin
        .from("followups")
        .update({
          status: "Enviado",
          zapi_response: {
            status: "processing",
            claimed_at: new Date().toISOString(),
          },
        })
        .eq("id", followup_id)
        .eq("status", "Pendente")
        .select("id")
        .maybeSingle();

      if (claimError) {
        return NextResponse.json({ error: claimError.message }, { status: 500 });
      }

      if (!claimedFollowup) {
        return NextResponse.json(
          { error: "Mensagem já enviada ou em processamento" },
          { status: 409 }
        );
      }
    }

    const result = await sendWhatsAppMessage(targetPhone, targetMessage);

    if (result.success) {
      // Atualiza status para Enviado se veio de um followup
      if (followup_id) {
        await supabaseAdmin
          .from("followups")
          .update({
            zapi_response: result,
            sent_at: new Date().toISOString(),
          })
          .eq("id", followup_id)
          .eq("status", "Enviado");
      }
      return NextResponse.json({ success: true, result });
    } else {
      // O envio falhou: libera o follow-up para uma nova tentativa.
      if (followup_id) {
        await supabaseAdmin
          .from("followups")
          .update({ status: "Pendente", zapi_response: result, sent_at: null })
          .eq("id", followup_id)
          .eq("status", "Enviado");
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 502 });
    }
  } catch (err: unknown) {
    console.error("Erro em POST /api/whatsapp/send:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}
