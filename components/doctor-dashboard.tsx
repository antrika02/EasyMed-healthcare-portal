"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, Calendar, UserIcon, Clock, LogOut, Bell, Users, CheckCircle, Edit } from "lucide-react"
import Link from "next/link"
import { format, parseISO, isToday, isTomorrow, isAfter } from "date-fns"

interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
}

interface Doctor {
  id: string
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
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  reason_for_visit: string
  notes: string | null
  patient: {
    id: string
    date_of_birth: string | null
    gender: string | null
    medical_history: string | null
    allergies: string | null
    current_medications: string | null
    profiles: {
      full_name: string
      email: string
      phone: string | null
    }
  }
}

interface DoctorDashboardProps {
  user: any
  profile: Profile
  doctor: Doctor
}

export function DoctorDashboard({ user, profile, doctor }: DoctorDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedDoctor, setEditedDoctor] = useState(doctor)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients!inner(
            id,
            date_of_birth,
            gender,
            medical_history,
            allergies,
            current_medications,
            profiles!inner(
              full_name,
              email,
              phone
            )
          )
        `)
        .eq("doctor_id", doctor.id)
        .order("appointment_date", { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      console.error("Error fetching appointments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string, notes?: string) => {
    try {
      const updateData: any = { status: newStatus }
      if (notes !== undefined) {
        updateData.notes = notes
      }

      const { error } = await supabase.from("appointments").update(updateData).eq("id", appointmentId)

      if (error) throw error

      // Refresh appointments
      fetchAppointments()
    } catch (error: any) {
      console.error("Error updating appointment:", error)
    }
  }

  const updateDoctorProfile = async () => {
    try {
      const { error } = await supabase
        .from("doctors")
        .update({
          specialization: editedDoctor.specialization,
          years_of_experience: editedDoctor.years_of_experience,
          education: editedDoctor.education,
          certifications: editedDoctor.certifications,
          consultation_fee: editedDoctor.consultation_fee,
          available_days: editedDoctor.available_days,
          available_hours_start: editedDoctor.available_hours_start,
          available_hours_end: editedDoctor.available_hours_end,
          bio: editedDoctor.bio,
        })
        .eq("id", doctor.id)

      if (error) throw error

      setIsEditingProfile(false)
      // Update local state
      Object.assign(doctor, editedDoctor)
    } catch (error: any) {
      console.error("Error updating profile:", error)
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
      case "no_show":
        return "bg-orange-100 text-orange-800"
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

  const todayAppointments = appointments.filter((apt) => {
    const aptDate = parseISO(apt.appointment_date)
    return isToday(aptDate) && apt.status !== "cancelled"
  })

  const upcomingAppointments = appointments
    .filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      return isAfter(aptDate, new Date()) && apt.status !== "cancelled"
    })
    .slice(0, 5)

  const pendingAppointments = appointments.filter((apt) => apt.status === "scheduled")

  const stats = {
    totalAppointments: appointments.length,
    todayAppointments: todayAppointments.length,
    pendingAppointments: pendingAppointments.length,
    completedAppointments: appointments.filter((apt) => apt.status === "completed").length,
  }

  const DAYS_OF_WEEK = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ]

  const SPECIALIZATIONS = [
    "General Practice",
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Neurology",
    "Oncology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Surgery",
  ]

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
              <span className="text-sm font-medium">Dr. {profile.full_name}</span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, Dr. {profile.full_name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-2">Manage your appointments and patient care from your dashboard.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                <p className="text-sm text-muted-foreground">Today's Appointments</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingAppointments}</p>
                <p className="text-sm text-muted-foreground">Pending Confirmations</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedAppointments}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="profile">Profile & Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Today's Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Today's Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {todayAppointments.map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(appointment.patient.profiles.full_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{appointment.patient.profiles.full_name}</p>
                                <p className="text-sm text-muted-foreground">{appointment.appointment_time}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          </div>

                          <p className="text-sm mb-3">{appointment.reason_for_visit}</p>

                          <div className="flex gap-2">
                            {appointment.status === "scheduled" && (
                              <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}>
                                Confirm
                              </Button>
                            )}
                            {appointment.status === "confirmed" && (
                              <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, "completed")}>
                                Complete
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No appointments today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Upcoming Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment) => (
                        <div key={appointment.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(appointment.patient.profiles.full_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{appointment.patient.profiles.full_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getAppointmentLabel(appointment.appointment_date)} at {appointment.appointment_time}
                                </p>
                                <p className="text-sm text-muted-foreground">{appointment.reason_for_visit}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming appointments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Recent Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointments
                    .filter((apt) => apt.status === "completed")
                    .slice(0, 10)
                    .map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{getInitials(appointment.patient.profiles.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{appointment.patient.profiles.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                Last visit: {format(parseISO(appointment.appointment_date), "MMM d, yyyy")}
                              </p>
                              {appointment.patient.allergies && (
                                <p className="text-sm text-destructive">Allergies: {appointment.patient.allergies}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {appointment.patient.profiles.phone && <p>{appointment.patient.profiles.phone}</p>}
                            <p>{appointment.patient.profiles.email}</p>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="mt-3 p-2 bg-muted rounded">
                            <p className="text-sm">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  Doctor Profile
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(!isEditingProfile)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingProfile ? "Cancel" : "Edit"}
                </Button>
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <Select
                          value={editedDoctor.specialization}
                          onValueChange={(value) => setEditedDoctor({ ...editedDoctor, specialization: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SPECIALIZATIONS.map((spec) => (
                              <SelectItem key={spec} value={spec}>
                                {spec}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          type="number"
                          value={editedDoctor.years_of_experience}
                          onChange={(e) =>
                            setEditedDoctor({ ...editedDoctor, years_of_experience: Number.parseInt(e.target.value) })
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="fee">Consultation Fee ($)</Label>
                        <Input
                          id="fee"
                          type="number"
                          value={editedDoctor.consultation_fee}
                          onChange={(e) =>
                            setEditedDoctor({ ...editedDoctor, consultation_fee: Number.parseInt(e.target.value) })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="education">Education</Label>
                      <Textarea
                        id="education"
                        value={editedDoctor.education}
                        onChange={(e) => setEditedDoctor({ ...editedDoctor, education: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="certifications">Certifications</Label>
                      <Textarea
                        id="certifications"
                        value={editedDoctor.certifications || ""}
                        onChange={(e) => setEditedDoctor({ ...editedDoctor, certifications: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editedDoctor.bio || ""}
                        onChange={(e) => setEditedDoctor({ ...editedDoctor, bio: e.target.value })}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Available Days</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={day.value}
                              checked={editedDoctor.available_days.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setEditedDoctor({
                                    ...editedDoctor,
                                    available_days: [...editedDoctor.available_days, day.value],
                                  })
                                } else {
                                  setEditedDoctor({
                                    ...editedDoctor,
                                    available_days: editedDoctor.available_days.filter((d) => d !== day.value),
                                  })
                                }
                              }}
                            />
                            <Label htmlFor={day.value}>{day.label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="start-time">Available Hours Start</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={editedDoctor.available_hours_start || ""}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, available_hours_start: e.target.value })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="end-time">Available Hours End</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={editedDoctor.available_hours_end || ""}
                          onChange={(e) => setEditedDoctor({ ...editedDoctor, available_hours_end: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={updateDoctorProfile}>Save Changes</Button>
                      <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Specialization</p>
                        <p className="text-muted-foreground">{doctor.specialization}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Experience</p>
                        <p className="text-muted-foreground">{doctor.years_of_experience} years</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">License Number</p>
                        <p className="text-muted-foreground">{doctor.license_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Consultation Fee</p>
                        <p className="text-muted-foreground">${doctor.consultation_fee}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Education</p>
                      <p className="text-muted-foreground">{doctor.education}</p>
                    </div>

                    {doctor.certifications && (
                      <div>
                        <p className="text-sm font-medium">Certifications</p>
                        <p className="text-muted-foreground">{doctor.certifications}</p>
                      </div>
                    )}

                    {doctor.bio && (
                      <div>
                        <p className="text-sm font-medium">Bio</p>
                        <p className="text-muted-foreground">{doctor.bio}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium">Available Days</p>
                      <p className="text-muted-foreground">
                        {doctor.available_days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")}
                      </p>
                    </div>

                    {doctor.available_hours_start && doctor.available_hours_end && (
                      <div>
                        <p className="text-sm font-medium">Available Hours</p>
                        <p className="text-muted-foreground">
                          {doctor.available_hours_start} - {doctor.available_hours_end}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
