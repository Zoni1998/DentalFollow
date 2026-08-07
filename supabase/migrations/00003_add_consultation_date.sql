-- Registra a data em que o paciente foi atendido.
ALTER TABLE public.followups
ADD COLUMN IF NOT EXISTS consultation_date DATE;

-- Mantém os registros antigos utilizáveis, tomando a criação como referência.
UPDATE public.followups
SET consultation_date = (COALESCE(created_at, NOW()) AT TIME ZONE 'America/Sao_Paulo')::date
WHERE consultation_date IS NULL;

ALTER TABLE public.followups
ALTER COLUMN consultation_date SET DEFAULT CURRENT_DATE,
ALTER COLUMN consultation_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_followups_consultation_date
ON public.followups(consultation_date);
