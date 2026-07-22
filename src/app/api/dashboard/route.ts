import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/dashboard
 * Retorna dados agregados para o dashboard:
 * - Total em orçamentos abertos (Pendente/Enviado)
 * - Follow-ups agendados para hoje
 * - Taxa de conversão do mês
 * - Próximos contatos
 */
export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    // 1. Orçamentos em aberto (Pendente + Enviado) — valor total
    const { data: openBudgets } = await supabaseAdmin
      .from("followups")
      .select("amount")
      .in("status", ["Pendente", "Enviado"]);

    const totalOpen = (openBudgets || []).reduce((sum, f) => sum + Number(f.amount || 0), 0);

    // 2. Follow-ups de hoje (agendados para hoje, status Pendente)
    const { data: todayFups } = await supabaseAdmin
      .from("followups")
      .select(`
        id,
        scheduled_at,
        status,
        treatment,
        amount,
        patients (id, name, phone)
      `)
      .eq("status", "Pendente")
      .gte("scheduled_at", startOfToday)
      .lt("scheduled_at", endOfToday)
      .order("scheduled_at", { ascending: true });

    // 3. Conversão do mês: Fechados / Total (Fechado + Perdido) do mês
    const { data: monthFups } = await supabaseAdmin
      .from("followups")
      .select("status, created_at")
      .gte("created_at", startOfMonth);

    const monthClosed = (monthFups || []).filter(f => f.status === "Fechado").length;
    const monthLost = (monthFups || []).filter(f => f.status === "Perdido").length;
    const monthTotal = monthClosed + monthLost;
    const conversionRate = monthTotal > 0 ? Math.round((monthClosed / monthTotal) * 100) : 0;

    // 4. Conversão do mês anterior (para comparativo)
    const { data: lastMonthFups } = await supabaseAdmin
      .from("followups")
      .select("status, created_at")
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfMonth);

    const lastMonthClosed = (lastMonthFups || []).filter(f => f.status === "Fechado").length;
    const lastMonthLost = (lastMonthFups || []).filter(f => f.status === "Perdido").length;
    const lastMonthTotal = lastMonthClosed + lastMonthLost;
    const lastConversionRate = lastMonthTotal > 0 ? Math.round((lastMonthClosed / lastMonthTotal) * 100) : 0;
    const conversionDiff = conversionRate - lastConversionRate;

    // 5. Próximos contatos (próximos 5 followups pendentes, ordenados por data)
    const { data: upcoming } = await supabaseAdmin
      .from("followups")
      .select(`
        id,
        scheduled_at,
        status,
        treatment,
        amount,
        created_at,
        patients (id, name, phone)
      `)
      .eq("status", "Pendente")
      .order("scheduled_at", { ascending: true })
      .limit(5);

    return NextResponse.json({
      totalOpen,
      todayCount: (todayFups || []).length,
      conversionRate,
      conversionDiff,
      upcoming: upcoming || [],
      todayFollowups: todayFups || [],
    });
  } catch (err: any) {
    console.error("Erro em GET /api/dashboard:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
