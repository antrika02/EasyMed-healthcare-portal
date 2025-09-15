"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Heart,
  Calendar,
  UserIcon,
  FileText,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  LogOut,
  Settings,
  Bell,
  Activity,
} from "lucide-react"
import Link from "next/link"
import { format, parseISO, isToday, isTomorrow, isAfter } from "date-fns"

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

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  reason_for_visit: string
  notes: string | null
  doctor: {
    id: string
    specialization: string
    consultation_fee: number
    profiles: {
      full_name: string
    }
  }
}

interface PatientDashboardProps {
  user: any
  profile: Profile
  patient: Patient
}

export function PatientDashboard({ user, profile, patient }: PatientDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()

    // Check for success message
    if (searchParams.get("success") === "appointment-booked") {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [])

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          doctor:doctors!inner(
            id,
            specialization,
            consultation_fee,
            profiles!inner(
              full_name
            )
          )
        `)
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAppointmentLabel = (date: string) => {
    const appointmentDate = parseISO(date)
    if (isToday(appointmentDate)) return "Today"
    if (isTomorrow(appointmentDate)) return "Tomorrow"
    return format(appointmentDate, "MMM d")
  }

  const upcomingAppointments = appointments
    .filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      return (isAfter(aptDate, new Date()) || isToday(aptDate)) && apt.status !== "cancelled"
    })
    .slice(0, 3)

  const recentAppointments = appointments
    .filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      return apt.status === "completed"
    })
    .slice(0, 3)

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
        {showSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              Your appointment has been successfully booked!
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile.full_name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-2">
            Here's an overview of your health information and upcoming appointments.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Link href="/doctors">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Find Doctors</p>
                  <p className="text-sm text-muted-foreground">Browse specialists</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/appointments">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">My Appointments</p>
                  <p className="text-sm text-muted-foreground">View all appointments</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Medical Records</p>
                <p className="text-sm text-muted-foreground">View history</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-sm text-muted-foreground">Update profile</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Appointments
                </CardTitle>
                <Link href="/appointments">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(appointment.doctor.profiles.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Dr. {appointment.doctor.profiles.full_name}</p>
                            <p className="text-sm text-muted-foreground">{appointment.doctor.specialization}</p>
                            <p className="text-sm text-muted-foreground">{appointment.reason_for_visit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          <p className="text-sm font-medium mt-1">
                            {getAppointmentLabel(appointment.appointment_date)}
                          </p>
                          <p className="text-sm text-muted-foreground">{appointment.appointment_time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                    <Link href="/doctors">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {recentAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-muted">
                              {getInitials(appointment.doctor.profiles.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Dr. {appointment.doctor.profiles.full_name}</p>
                            <p className="text-sm text-muted-foreground">{appointment.doctor.specialization}</p>
                            {appointment.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{appointment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {format(parseISO(appointment.appointment_date), "MMM d, yyyy")}
                          </p>
                          <Badge variant="secondary">Completed</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">Patient</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>

                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone}</span>
                    </div>
                  )}

                  {patient.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Born {format(parseISO(patient.date_of_birth), "MMM d, yyyy")}</span>
                    </div>
                  )}

                  {patient.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{patient.address}</span>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patient.allergies && (
                  <div>
                    <p className="text-sm font-medium text-destructive">Allergies</p>
                    <p className="text-sm text-muted-foreground">{patient.allergies}</p>
                  </div>
                )}

                {patient.current_medications && (
                  <div>
                    <p className="text-sm font-medium">Current Medications</p>
                    <p className="text-sm text-muted-foreground">{patient.current_medications}</p>
                  </div>
                )}

                {patient.insurance_provider && (
                  <div>
                    <p className="text-sm font-medium">Insurance</p>
                    <p className="text-sm text-muted-foreground">{patient.insurance_provider}</p>
                    {patient.insurance_policy_number && (
                      <p className="text-xs text-muted-foreground">Policy: {patient.insurance_policy_number}</p>
                    )}
                  </div>
                )}

                {patient.emergency_contact_name && (
                  <div>
                    <p className="text-sm font-medium">Emergency Contact</p>
                    <p className="text-sm text-muted-foreground">{patient.emergency_contact_name}</p>
                    {patient.emergency_contact_phone && (
                      <p className="text-xs text-muted-foreground">{patient.emergency_contact_phone}</p>
                    )}
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
