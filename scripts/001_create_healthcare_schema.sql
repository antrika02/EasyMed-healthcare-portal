-- Create user profiles table that references auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patients table with medical information
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create doctors table with professional information
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number TEXT NOT NULL UNIQUE,
  specialization TEXT NOT NULL,
  years_of_experience INTEGER,
  education TEXT,
  certifications TEXT,
  consultation_fee DECIMAL(10,2),
  available_days TEXT[], -- Array of days like ['monday', 'tuesday']
  available_hours_start TIME,
  available_hours_end TIME,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  reason_for_visit TEXT,
  notes TEXT,
  prescription TEXT,
  diagnosis TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for patients table
CREATE POLICY "Patients can view their own data" ON public.patients
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id AND role = 'patient')
  );

CREATE POLICY "Doctors can view their patients data" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.doctors d ON a.doctor_id = d.id
      JOIN public.profiles p ON d.user_id = p.id
      WHERE a.patient_id = patients.id AND p.id = auth.uid()
    )
  );

CREATE POLICY "Patients can update their own data" ON public.patients
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id AND role = 'patient')
  );

CREATE POLICY "Patients can insert their own data" ON public.patients
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id AND role = 'patient')
  );

-- RLS Policies for doctors table
CREATE POLICY "Anyone can view doctor profiles" ON public.doctors
  FOR SELECT TO authenticated;

CREATE POLICY "Doctors can update their own profile" ON public.doctors
  FOR UPDATE USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id AND role = 'doctor')
  );

CREATE POLICY "Doctors can insert their own profile" ON public.doctors
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE auth.uid() = id AND role = 'doctor')
  );

-- RLS Policies for appointments table
CREATE POLICY "Patients can view their own appointments" ON public.appointments
  FOR SELECT USING (
    patient_id IN (
      SELECT p.id FROM public.patients p
      JOIN public.profiles pr ON p.user_id = pr.id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view their appointments" ON public.appointments
  FOR SELECT USING (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      JOIN public.profiles pr ON d.user_id = pr.id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Patients can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT p.id FROM public.patients p
      JOIN public.profiles pr ON p.user_id = pr.id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Patients can update their appointments" ON public.appointments
  FOR UPDATE USING (
    patient_id IN (
      SELECT p.id FROM public.patients p
      JOIN public.profiles pr ON p.user_id = pr.id
      WHERE pr.id = auth.uid()
    )
  );

CREATE POLICY "Doctors can update appointments" ON public.appointments
  FOR UPDATE USING (
    doctor_id IN (
      SELECT d.id FROM public.doctors d
      JOIN public.profiles pr ON d.user_id = pr.id
      WHERE pr.id = auth.uid()
    )
  );

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'patient')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
