import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppointmentsList } from "@/components/appointments-list"
import { Heart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AppointmentsPage() {
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
  const { data: userProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!userProfile) {
    redirect("/auth/login")
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
            <Link href={`/dashboard/${userProfile.role}`}>
              <Button variant="ghost">Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Appointments</h1>
          <p className="text-muted-foreground mt-2">View and manage your appointments</p>
        </div>

        <AppointmentsList userRole={userProfile.role} userId={user.id} />
      </div>
    </div>
  )
}
