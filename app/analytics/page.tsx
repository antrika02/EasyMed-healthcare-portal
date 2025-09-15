import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default async function AnalyticsPage() {
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

  return (
    <AuthGuard requiredRole="doctor">
      <AnalyticsDashboard user={user} profile={userProfile} />
    </AuthGuard>
  )
}
