import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sanitizePhone } from "@/lib/format";
import { isValidDateOnly } from "@/lib/budget";

/**
 * POST /api/patients
 * Cria um paciente + follow-up agendado.
 * Substitui a escrita direta do browser (usava anon key).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      phone: rawPhone,
      treatment,
      amount,
      message,
      scheduled_at,
      consultation_date,
      status,
    } = body;
    const phone = sanitizePhone(rawPhone);

    // Validação de entrada
    if (!name || !phone || !treatment || !consultation_date) {
      return NextResponse.json(
        { error: "Nome, telefone, tratamento e data do atendimento são obrigatórios" },
        { status: 400 }
      );
    }

    if (!isValidDateOnly(consultation_date)) {
      return NextResponse.json(
        { error: "Data do atendimento inválida" },
        { status: 400 }
      );
    }

    // 1. Insert patient
    const { data: patientData, error: patientError } = await supabaseAdmin
      .from("patients")
      .insert([{ name, phone, treatment }])
      .select()
      .single();

    if (patientError) {
      console.error("Erro ao criar paciente:", patientError);
      return NextResponse.json({ error: patientError.message }, { status: 500 });
    }

    // 2. Insert followup se houver mensagem e data
    if (message && scheduled_at && patientData) {
      const { error: fupError } = await supabaseAdmin
        .from("followups")
        .insert([{
          patient_id: patientData.id,
          consultation_date,
          treatment,
          amount: parseFloat(amount) || 0,
          message,
          scheduled_at,
          status: status || "Pendente",
        }]);

      if (fupError) {
        console.error("Erro ao criar followup:", fupError);
        // Paciente foi criado, mas followup falhou — retorna sucesso parcial
        return NextResponse.json({
          success: true,
          patient: patientData,
          warning: "Paciente criado, mas houve erro no agendamento: " + fupError.message,
        });
      }
    } else if (patientData) {
      // Sem agendamento — cria followup sem mensagem agendada (status Fechado ou Pendente sem data)
      const { error: fupError } = await supabaseAdmin
        .from("followups")
        .insert([{
          patient_id: patientData.id,
          consultation_date,
          treatment,
          amount: parseFloat(amount) || 0,
          message: message || "",
          scheduled_at: scheduled_at || new Date().toISOString(),
          status: status || "Pendente",
        }]);

      if (fupError) {
        return NextResponse.json({
          success: true,
          patient: patientData,
          warning: "Paciente criado, mas houve erro no followup: " + fupError.message,
        });
      }
    }

    return NextResponse.json({ success: true, patient: patientData });
  } catch (err: any) {
    console.error("Erro em POST /api/patients:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PUT /api/patients
 * Atualiza dados de um paciente + followup.
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      followup_id,
      patient_name,
      patient_phone: rawPatientPhone,
      treatment,
      amount,
      message,
      scheduled_at,
      consultation_date,
      status,
      lost_reason,
    } = body;
    const patient_phone = rawPatientPhone
      ? sanitizePhone(rawPatientPhone)
      : rawPatientPhone;

    if (!followup_id) {
      return NextResponse.json({ error: "followup_id é obrigatório" }, { status: 400 });
    }

    // Buscar o followup para obter o patient_id
    const { data: fup, error: fupError } = await supabaseAdmin
      .from("followups")
      .select("id, patient_id")
      .eq("id", followup_id)
      .single();

    if (fupError || !fup) {
      return NextResponse.json({ error: "Followup não encontrado" }, { status: 404 });
    }

    // Atualizar paciente
    const patientUpdate: Record<string, any> = {};
    if (patient_name !== undefined) patientUpdate.name = patient_name;
    if (patient_phone !== undefined) patientUpdate.phone = patient_phone;\n    if (treatment !== undefined) patientUpdate.treatment = treatment;

    if (Object.keys(patientUpdate).length > 0) {
      const { error: pErr } = await supabaseAdmin
        .from("patients")
        .update(patientUpdate)
        .eq("id", fup.patient_id);
      if (pErr) console.error("Erro ao atualizar paciente:", pErr);
    }

    // Atualizar followup
    const fupUpdate: Record<string, any> = {};
    if (treatment !== undefined) fupUpdate.treatment = treatment;
    if (amount !== undefined) fupUpdate.amount = parseFloat(amount) || 0;
    if (message !== undefined) fupUpdate.message = message;
    if (scheduled_at !== undefined) fupUpdate.scheduled_at = scheduled_at;
    if (consultation_date !== undefined) {
      if (!isValidDateOnly(consultation_date)) {
        return NextResponse.json({ error: "Data do atendimento inválida" }, { status: 400 });
      }
      fupUpdate.consultation_date = consultation_date;
    }
    if (status !== undefined) fupUpdate.status = status;
    if (lost_reason !== undefined) fupUpdate.lost_reason = lost_reason;

    if (Object.keys(fupUpdate).length > 0) {
      const { error: fErr } = await supabaseAdmin
        .from("followups")
        .update(fupUpdate)
        .eq("id", followup_id);
      if (fErr) {
        return NextResponse.json({ error: fErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Erro em PUT /api/patients:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
