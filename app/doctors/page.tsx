import { createClient } from "@/lib/supabase/server"
import { DoctorCard } from "@/components/doctor-card"
import { DoctorSearch } from "@/components/doctor-search"
import { Heart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Doctor {
  id: string
  user_id: string
  license_number: string
  specialization: string
  years_of_experience: number
  education: string
  certifications: string | null
  consultation_fee: number
  available_days: string[]
  available_hours_start: string | null
  available_hours_end: string | null
  bio: string | null
  profiles: {
    full_name: string
    email: string
    phone: string | null
  }
}

interface SearchParams {
  specialization?: string
  search?: string
}

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query based on search parameters
  let query = supabase.from("doctors").select(`
      *,
      profiles!inner(
        full_name,
        email,
        phone
      )
    `)

  // Apply filters
  if (params.specialization) {
    query = query.eq("specialization", params.specialization)
  }

  if (params.search) {
    query = query.or(`profiles.full_name.ilike.%${params.search}%,specialization.ilike.%${params.search}%`)
  }

  const { data: doctors, error } = await query.order("profiles(full_name)")

  if (error) {
    console.error("Error fetching doctors:", error)
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
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register/patient">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Find a Doctor</h1>
          <p className="text-muted-foreground mt-2">Browse our network of qualified healthcare professionals</p>
        </div>

        {/* Search and Filter Component */}
        <DoctorSearch />

        {/* Results */}
        <div className="mt-8">
          {doctors && doctors.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  Showing {doctors.length} doctor{doctors.length !== 1 ? "s" : ""}
                  {params.specialization && ` in ${params.specialization}`}
                  {params.search && ` matching "${params.search}"`}
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No doctors found matching your criteria.</p>
              <Link href="/doctors" className="text-primary hover:underline mt-2 inline-block">
                View all doctors
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
