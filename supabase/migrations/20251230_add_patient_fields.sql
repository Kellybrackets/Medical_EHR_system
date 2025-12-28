-- Add scheme_code to insurance_details
ALTER TABLE public.insurance_details 
ADD COLUMN IF NOT EXISTS scheme_code TEXT;

-- Add parent linking to patients
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.patients(id),
ADD COLUMN IF NOT EXISTS is_dependent BOOLEAN DEFAULT false;

-- Add index for parent_id for performance
CREATE INDEX IF NOT EXISTS idx_patients_parent_id ON public.patients(parent_id);
