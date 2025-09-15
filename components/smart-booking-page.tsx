"use client"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Heart, LogOut, Bell, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AIAppointmentRecommender } from "@/components/ai-appointment-recommender"

interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
}

interface Patient {
  id: string
  date_of_birth: string | null
  gender: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  medical_history: string | null
  allergies: string | null
  current_medications: string | null
  insurance_provider: string | null
  insurance_policy_number: string | null
}

interface SmartBookingPageProps {
  user: any
  profile: Profile
  patient: Patient
}

export function SmartBookingPage({ user, profile, patient }: SmartBookingPageProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleRecommendationSelect = (doctorId: string, date: string, time: string) => {
    // Redirect to booking page with pre-filled data
    router.push(`/book-appointment/${doctorId}?date=${date}&time=${time}&smart=true`)
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
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>

            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{profile.full_name}</span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Smart Appointment Booking</h1>
          <p className="text-muted-foreground mt-2">
            Get AI-powered doctor recommendations based on your symptoms and preferences.
          </p>
        </div>

        <AIAppointmentRecommender patientId={patient.id} onRecommendationSelect={handleRecommendationSelect} />
      </div>
    </div>
  )
}
