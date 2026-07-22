import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/followups?status=Pendente&search=joao
 * Lista todos os followups com join de paciente.
 * Filtros opcionais: status, search (nome ou tratamento)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // Pendente/Enviado/Fechado/Perdido ou null (todos)
    const search = searchParams.get("search");

    let query = supabaseAdmin
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
      .order("scheduled_at", { ascending: false });

    if (status && status !== "todos") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`treatment.ilike.%${search}%,patients.name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar followups:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ followups: data || [] });
  } catch (err: any) {
    console.error("Erro em GET /api/followups:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
