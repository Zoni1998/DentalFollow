-- Create the patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the followups table
CREATE TABLE IF NOT EXISTS public.followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    treatment TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    message TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'CLOSED', 'LOST')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_followups_patient_id ON public.followups(patient_id);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_at ON public.followups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_followups_status ON public.followups(status);

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for followups
CREATE TRIGGER update_followups_modtime
BEFORE UPDATE ON public.followups
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
