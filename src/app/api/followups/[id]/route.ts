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
        treatment,
        amount,
        message,
        scheduled_at,
        status,
        lost_reason,
        created_at,
        updated_at,
        patients (
          id,
          name,
          phone
        )
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Followup não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ followup: data });
  } catch (err: any) {
    console.error("Erro em GET /api/followups/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
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

    // Primeiro busca o patient_id para deletar o paciente também
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

    // Opcionalmente deleta o paciente para não deixar sujeira
    if (fup?.patient_id) {
      await supabaseAdmin
        .from("patients")
        .delete()
        .eq("id", fup.patient_id);
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em DELETE /api/followups/[id]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
