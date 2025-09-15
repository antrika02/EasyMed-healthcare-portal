import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { SmartBookingPage } from "@/components/smart-booking-page"

export default async function SmartBooking() {
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

  if (!userProfile || userProfile.role !== "patient") {
    redirect("/auth/login?error=Access denied")
  }

  // Get patient record
  const { data: patient } = await supabase.from("patients").select("*").eq("user_id", user.id).single()

  if (!patient) {
    redirect("/complete-profile")
  }

  return (
    <AuthGuard requiredRole="patient">
      <SmartBookingPage user={user} profile={userProfile} patient={patient} />
    </AuthGuard>
  )
}
