-- ============================================================
-- Migration 00004: cadastro completo e data real de envio
-- ============================================================

ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS cpf TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE public.followups
    ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients(cpf);


