import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
