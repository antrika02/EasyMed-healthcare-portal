import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { AppointmentBooking } from "@/components/appointment-booking"
import { Heart, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Doctor {
  id: string
  user_id: string
  specialization: string
  consultation_fee: number
  available_days: string[]
  available_hours_start: string | null
  available_hours_end: string | null
  profiles: {
    full_name: string
  }
}

export default async function BookAppointmentPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const { doctorId } = await params
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login?redirect=/book-appointment/" + doctorId)
  }

  // Get doctor information
  const { data: doctor, error } = await supabase
    .from("doctors")
    .select(`
      *,
      profiles!inner(
        full_name
      )
    `)
    .eq("id", doctorId)
    .single()

  if (error || !doctor) {
    notFound()
  }

  // Get user's profile to check if they're a patient
  const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "patient") {
    redirect("/auth/login?error=Only patients can book appointments")
  }

  // Get patient record
  const { data: patient } = await supabase.from("patients").select("id").eq("user_id", user.id).single()

  if (!patient) {
    redirect("/complete-profile?redirect=/book-appointment/" + doctorId)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">EasyMed</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/dashboard/patient">
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Back Button */}
        <Link
          href={`/doctors/${doctorId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctor Profile
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Book Appointment</h1>
            <p className="text-muted-foreground mt-2">Schedule your appointment with Dr. {doctor.profiles.full_name}</p>
          </div>

          <AppointmentBooking doctor={doctor} patientId={patient.id} />
        </div>
      </div>
    </div>
  )
}
