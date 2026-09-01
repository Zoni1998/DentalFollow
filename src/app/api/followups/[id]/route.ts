import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/followups/[id]
 * Retorna a ficha completa de um followup (com dados do paciente).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("followups")
      .select(`
        id,
        patient_id,
        consultation_date,
        treatment,
        amount,
        message,
        scheduled_at,
        status,
        lost_reason,
        sent_at,
        created_at,
        updated_at,
        patients (
          id,
          name,
          phone,
          cpf,
          address
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Followup nÃ£o encontrado" }, { status: 404 });
    }

    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("followups")
      .select("id, message, scheduled_at, sent_at, status, updated_at")
      .eq("patient_id", data.patient_id)
      .neq("message", "")
      .order("scheduled_at", { ascending: false });

    if (messagesError) {
      console.error("Erro ao buscar histÃ³rico de mensagens:", messagesError);
    }

    return NextResponse.json({
      followup: data,
      messages: messages || [],
    });
  } catch (err: unknown) {
    console.error("Erro em GET /api/followups/[id]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/followups/[id]
 * Remove um followup e o paciente associado se desejar.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Primeiro busca o patient_id para deletar o paciente tambÃ©m
    const { data: fup } = await supabaseAdmin
      .from("followups")
      .select("patient_id")
      .eq("id", id)
      .single();

    // Deleta o followup
    const { error: fupError } = await supabaseAdmin
      .from("followups")
      .delete()
      .eq("id", id);
      
    if (fupError) {
      return NextResponse.json({ error: fupError.message }, { status: 500 });
    }

    // Opcionalmente deleta o paciente para nÃ£o deixar sujeira
    if (fup?.patient_id) {
      await supabaseAdmin
        .from("patients")
        .delete()
        .eq("id", fup.patient_id);
    }
    
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Erro em DELETE /api/followups/[id]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

