import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Heart, ArrowLeft, Calendar, Clock, DollarSign, GraduationCap, Award, Phone, Mail, Star } from "lucide-react"
import Link from "next/link"

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

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doctor, error } = await supabase
    .from("doctors")
    .select(`
      *,
      profiles!inner(
        full_name,
        email,
        phone
      )
    `)
    .eq("id", id)
    .single()

  if (error || !doctor) {
    notFound()
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const formatAvailability = () => {
    if (!doctor.available_days || doctor.available_days.length === 0) {
      return "Availability not set"
    }

    const dayNames: { [key: string]: string } = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    }

    const days = doctor.available_days.map((day) => dayNames[day] || day)

    return days
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
        {/* Back Button */}
        <Link
          href="/doctors"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctors
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(doctor.profiles.full_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-3xl font-bold">Dr. {doctor.profiles.full_name}</h1>
                        <p className="text-xl text-muted-foreground mt-1">{doctor.specialization}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="text-muted-foreground">
                            {doctor.years_of_experience} years of experience
                          </span>
                        </div>
                      </div>

                      <Badge variant="secondary" className="text-sm">
                        {doctor.specialization}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {doctor.profiles.email}
                      </div>
                      {doctor.profiles.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {doctor.profiles.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Bio */}
                {doctor.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground leading-relaxed">{doctor.bio}</p>
                  </div>
                )}

                <Separator />

                {/* Education */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Education</h3>
                  </div>
                  <p className="text-muted-foreground">{doctor.education}</p>
                </div>

                {/* Certifications */}
                {doctor.certifications && (
                  <>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">Certifications</h3>
                      </div>
                      <p className="text-muted-foreground">{doctor.certifications}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* License */}
                <div>
                  <h3 className="font-semibold mb-2">Medical License</h3>
                  <p className="text-muted-foreground">License #: {doctor.license_number}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Book Appointment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="h-5 w-5 text-primary" />${doctor.consultation_fee}
                  <span className="text-sm font-normal text-muted-foreground">per consultation</span>
                </div>

                <Link href={`/book-appointment/${doctor.id}`}>
                  <Button className="w-full gap-2">
                    <Calendar className="h-4 w-4" />
                    Book Appointment
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Availability Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">Available Days:</p>
                  <div className="space-y-1">
                    {formatAvailability().map((day) => (
                      <div key={day} className="text-sm text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>

                  {doctor.available_hours_start && doctor.available_hours_end && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="font-medium">Hours:</p>
                      <p className="text-sm text-muted-foreground">
                        {doctor.available_hours_start} - {doctor.available_hours_end}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{doctor.profiles.email}</span>
                </div>

                {doctor.profiles.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{doctor.profiles.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
