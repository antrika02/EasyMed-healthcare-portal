import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { DoctorDashboard } from "@/components/doctor-dashboard"

export default async function DoctorDashboardPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Get user's profile
  const { data: userProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!userProfile || userProfile.role !== "doctor") {
    redirect("/auth/login?error=Access denied")
  }

  // Get doctor record
  const { data: doctor } = await supabase.from("doctors").select("*").eq("user_id", user.id).single()

  if (!doctor) {
    redirect("/register/doctor")
  }

  return (
    <AuthGuard requiredRole="doctor">
      <DoctorDashboard user={user} profile={userProfile} doctor={doctor} />
    </AuthGuard>
  )
}
