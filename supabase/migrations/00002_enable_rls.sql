-- ============================================================
-- Migration 00002: Enable Row Level Security (RLS)
-- ============================================================
-- Como o app é um CRM de uso único (Dr. Pedro), a estratégia é:
-- 1. Habilitar RLS em todas as tabelas
-- 2. Criar políticas que permitem acesso total via service_role
--    (chave secreta usada apenas no servidor / API routes)
-- 3. Negar acesso via anon key diretamente do browser
-- ============================================================

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- Policie patients: apenas service_role pode ler/escrever
CREATE POLICY "Service role full access on patients"
    ON public.patients
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policie followups: apenas service_role pode ler/escrever
CREATE POLICY "Service role full access on followups"
    ON public.followups
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
