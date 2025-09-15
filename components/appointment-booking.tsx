"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Clock, DollarSign, User } from "lucide-react"
import { format, isSameDay, isAfter } from "date-fns"

interface Doctor {
  id: string
  specialization: string
  consultation_fee: number
  available_days: string[]
  available_hours_start: string | null
  available_hours_end: string | null
  profiles: {
    full_name: string
  }
}

interface AppointmentBookingProps {
  doctor: Doctor
  patientId: string
}

interface TimeSlot {
  time: string
  available: boolean
}

export function AppointmentBooking({ doctor, patientId }: AppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [reasonForVisit, setReasonForVisit] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [bookedSlots, setBookedSlots] = useState<string[]>([])

  const router = useRouter()
  const supabase = createClient()

  // Generate available time slots based on doctor's schedule
  const generateTimeSlots = () => {
    if (!doctor.available_hours_start || !doctor.available_hours_end) {
      return []
    }

    const slots: TimeSlot[] = []
    const startHour = Number.parseInt(doctor.available_hours_start.split(":")[0])
    const endHour = Number.parseInt(doctor.available_hours_end.split(":")[0])

    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00`
      slots.push({
        time,
        available: true,
      })
    }

    return slots
  }

  // Check if a date is available based on doctor's schedule
  const isDateAvailable = (date: Date) => {
    const dayName = format(date, "EEEE").toLowerCase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return doctor.available_days.includes(dayName) && (isAfter(date, today) || isSameDay(date, today))
  }

  // Fetch booked appointments for selected date
  useEffect(() => {
    if (selectedDate) {
      fetchBookedSlots()
    }
  }, [selectedDate])

  const fetchBookedSlots = async () => {
    if (!selectedDate) return

    const { data: appointments } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_id", doctor.id)
      .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
      .in("status", ["scheduled", "confirmed"])

    if (appointments) {
      setBookedSlots(appointments.map((apt) => apt.appointment_time))
    }
  }

  // Update time slots when booked slots change
  useEffect(() => {
    const slots = generateTimeSlots()
    const updatedSlots = slots.map((slot) => ({
      ...slot,
      available: !bookedSlots.includes(slot.time),
    }))
    setTimeSlots(updatedSlots)
  }, [bookedSlots, doctor])

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !reasonForVisit.trim()) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: bookingError } = await supabase.from("appointments").insert({
        patient_id: patientId,
        doctor_id: doctor.id,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        appointment_time: selectedTime,
        reason_for_visit: reasonForVisit,
        status: "scheduled",
      })

      if (bookingError) throw bookingError

      router.push("/dashboard/patient?success=appointment-booked")
    } catch (error: any) {
      setError(error.message || "Failed to book appointment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Booking Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => !isDateAvailable(date)}
              className="rounded-md border"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Available days:{" "}
              {doctor.available_days.map((day) => day.charAt(0).toUpperCase() + day.slice(1)).join(", ")}
            </p>
          </CardContent>
        </Card>

        {/* Time Selection */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Select Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className="justify-center"
                  >
                    {slot.time}
                  </Button>
                ))}
              </div>
              {timeSlots.length === 0 && (
                <p className="text-sm text-muted-foreground">No time slots available for this date</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Appointment Details */}
        {selectedDate && selectedTime && (
          <Card>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason for Visit *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please describe the reason for your visit"
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button onClick={handleBookAppointment} disabled={isLoading} className="w-full">
                {isLoading ? "Booking..." : "Book Appointment"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Appointment Summary */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Doctor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">Dr. {doctor.profiles.full_name}</p>
              <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-medium">${doctor.consultation_fee}</span>
              <span className="text-sm text-muted-foreground">consultation fee</span>
            </div>
          </CardContent>
        </Card>

        {selectedDate && selectedTime && (
          <Card>
            <CardHeader>
              <CardTitle>Appointment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">{selectedTime}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">30 minutes</p>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Fee:</span>
                  <span className="text-lg font-bold text-primary">${doctor.consultation_fee}</span>
                </div>
              </div>

              <Badge variant="secondary" className="w-full justify-center">
                Payment due at appointment
              </Badge>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
