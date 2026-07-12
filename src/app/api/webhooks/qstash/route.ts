import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/zapi";

// Endpoint chamado pelo Upstash QStash periodicamente (ex: a cada minuto)
export async function POST(req: Request) {
  try {
    // Validação de segurança do QStash pode ser adicionada aqui
    // const authHeader = req.headers.get("Authorization");

    // 1. Busca mensagens agendadas que estejam prontas para envio
    // status = 'Agendado' e scheduled_for <= NOW()
    const { data: messages, error: fetchError } = await supabase
      .from("scheduled_messages")
      .select(`
        id,
        message_text,
        patient_id,
        patients (
          id,
          phone
        )
      `)
      .eq("status", "Agendado")
      .lte("scheduled_for", new Date().toISOString());

    if (fetchError) {
      console.error("Erro ao buscar mensagens do Supabase:", fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: "No pending messages." });
    }

    const results = [];

    // 2. Envia as mensagens
    for (const msg of messages) {
      const patientPhone = msg.patients?.phone;
      
      if (!patientPhone) {
        await supabase
          .from("scheduled_messages")
          .update({ status: "Erro", zapi_response: { error: "Sem telefone configurado" } })
          .eq("id", msg.id);
        continue;
      }

      // Chama a Z-API
      const sendResult = await sendWhatsAppMessage(patientPhone, msg.message_text);

      if (sendResult.success) {
        // 3. Atualiza o banco como Enviado
        await supabase
          .from("scheduled_messages")
          .update({ status: "Enviado", zapi_response: sendResult })
          .eq("id", msg.id);
          
        results.push({ id: msg.id, status: "Enviado" });
      } else {
        // Salva erro
        await supabase
          .from("scheduled_messages")
          .update({ status: "Erro", zapi_response: sendResult })
          .eq("id", msg.id);
          
        results.push({ id: msg.id, status: "Erro" });
      }
    }

    return NextResponse.json({ 
      processed: messages.length, 
      results 
    });

  } catch (err: any) {
    console.error("Internal Error na Rota de QStash:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
