import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppMessage } from "@/lib/zapi";

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

    const result = await sendWhatsAppMessage(targetPhone, targetMessage);

    if (result.success) {
      // Atualiza status para Enviado se veio de um followup
      if (followup_id) {
        await supabaseAdmin
          .from("followups")
          .update({ status: "Enviado", zapi_response: result })
          .eq("id", followup_id);
      }
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (err: any) {
    console.error("Erro em POST /api/whatsapp/send:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
