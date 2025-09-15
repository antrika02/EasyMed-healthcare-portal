"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, Clock } from "lucide-react"
import { format, parseISO, isAfter, isBefore, isToday } from "date-fns"

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  reason_for_visit: string
  notes: string | null
  doctor?: {
    id: string
    specialization: string
    consultation_fee: number
    profiles: {
      full_name: string
      email: string
      phone: string | null
    }
  }
  patient?: {
    id: string
    profiles: {
      full_name: string
      email: string
      phone: string | null
    }
  }
}

interface AppointmentsListProps {
  userRole: string
  userId: string
}

export function AppointmentsList({ userRole, userId }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchAppointments()
  }, [userRole, userId])

  const fetchAppointments = async () => {
    try {
      let query = supabase.from("appointments").select(`
        *,
        doctor:doctors!inner(
          id,
          specialization,
          consultation_fee,
          profiles!inner(
            full_name,
            email,
            phone
          )
        ),
        patient:patients!inner(
          id,
          profiles!inner(
            full_name,
            email,
            phone
          )
        )
      `)

      if (userRole === "patient") {
        // Get patient's appointments
        const { data: patient } = await supabase.from("patients").select("id").eq("user_id", userId).single()

        if (patient) {
          query = query.eq("patient_id", patient.id)
        }
      } else if (userRole === "doctor") {
        // Get doctor's appointments
        const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", userId).single()

        if (doctor) {
          query = query.eq("doctor_id", doctor.id)
        }
      }

      const { data, error } = await query.order("appointment_date", { ascending: true })

      if (error) throw error
      setAppointments(data || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", appointmentId)

      if (error) throw error

      // Refresh appointments
      fetchAppointments()
    } catch (error: any) {
      setError(error.message)
    }
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const categorizeAppointments = () => {
    const today = new Date()
    const upcoming = appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      return (isAfter(aptDate, today) || isToday(aptDate)) && apt.status !== "cancelled"
    })

    const past = appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      return isBefore(aptDate, today) || apt.status === "completed"
    })

    return { upcoming, past }
  }

  const { upcoming, past } = categorizeAppointments()

  if (isLoading) {
    return <div>Loading appointments...</div>
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>
  }

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const otherParty = userRole === "patient" ? appointment.doctor : appointment.patient
    const otherPartyName =
      userRole === "patient" ? `Dr. ${appointment.doctor?.profiles.full_name}` : appointment.patient?.profiles.full_name

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(otherPartyName || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{otherPartyName}</CardTitle>
                {userRole === "patient" && appointment.doctor && (
                  <p className="text-sm text-muted-foreground">{appointment.doctor.specialization}</p>
                )}
              </div>
            </div>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(appointment.appointment_date), "EEEE, MMMM d, yyyy")}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.appointment_time}</span>
            </div>

            {appointment.reason_for_visit && (
              <div className="text-sm">
                <span className="font-medium">Reason: </span>
                {appointment.reason_for_visit}
              </div>
            )}

            {appointment.notes && (
              <div className="text-sm">
                <span className="font-medium">Notes: </span>
                {appointment.notes}
              </div>
            )}

            {userRole === "patient" && appointment.doctor && (
              <div className="text-sm">
                <span className="font-medium">Fee: </span>${appointment.doctor.consultation_fee}
              </div>
            )}
          </div>

          {/* Action buttons based on status and role */}
          <div className="flex gap-2 pt-2">
            {appointment.status === "scheduled" && userRole === "doctor" && (
              <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, "confirmed")}>
                Confirm
              </Button>
            )}

            {(appointment.status === "scheduled" || appointment.status === "confirmed") && (
              <Button variant="outline" size="sm" onClick={() => updateAppointmentStatus(appointment.id, "cancelled")}>
                Cancel
              </Button>
            )}

            {appointment.status === "confirmed" && userRole === "doctor" && (
              <Button size="sm" onClick={() => updateAppointmentStatus(appointment.id, "completed")}>
                Mark Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue="upcoming" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
        <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="upcoming" className="space-y-4">
        {upcoming.length > 0 ? (
          upcoming.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No upcoming appointments</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="past" className="space-y-4">
        {past.length > 0 ? (
          past.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No past appointments</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}
