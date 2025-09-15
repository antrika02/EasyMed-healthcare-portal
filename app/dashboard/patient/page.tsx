import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { PatientDashboard } from "@/components/patient-dashboard"

export default async function PatientDashboardPage() {
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
    // Check if this is a redirect from complete-profile to avoid infinite loops
    const isFromCompleteProfile = true // We'll assume this for now

    if (isFromCompleteProfile) {
      // Wait a moment and try again in case of timing issues
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { data: retryPatient } = await supabase.from("patients").select("*").eq("user_id", user.id).single()

      if (!retryPatient) {
        redirect("/complete-profile")
      } else {
        // Use the retry result
        return (
          <AuthGuard requiredRole="patient">
            <PatientDashboard user={user} profile={userProfile} patient={retryPatient} />
          </AuthGuard>
        )
      }
    } else {
      redirect("/complete-profile")
    }
  }

  return (
    <AuthGuard requiredRole="patient">
      <PatientDashboard user={user} profile={userProfile} patient={patient} />
    </AuthGuard>
  )
}
