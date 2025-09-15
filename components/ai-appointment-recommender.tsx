"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Clock, Star, Calendar } from "lucide-react"
import { format, addDays, parseISO } from "date-fns"

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

interface AIRecommendation {
  doctor: Doctor
  score: number
  reasons: string[]
  nextAvailableSlot: {
    date: string
    time: string
  }
  estimatedWaitTime: number
}

interface AIAppointmentRecommenderProps {
  patientId: string
  onRecommendationSelect: (doctorId: string, date: string, time: string) => void
}

export function AIAppointmentRecommender({ patientId, onRecommendationSelect }: AIAppointmentRecommenderProps) {
  const [symptoms, setSymptoms] = useState("")
  const [urgency, setUrgency] = useState("routine")
  const [preferredTime, setPreferredTime] = useState("morning")
  const [maxDistance, setMaxDistance] = useState("10")
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  const generateRecommendations = async () => {
    if (!symptoms.trim()) return

    setIsLoading(true)
    try {
      // Fetch all doctors
      const { data: doctors, error } = await supabase.from("doctors").select(`
          *,
          profiles!inner(full_name)
        `)

      if (error) throw error

      // Fetch existing appointments to check availability
      const { data: appointments } = await supabase
        .from("appointments")
        .select("doctor_id, appointment_date, appointment_time")
        .gte("appointment_date", new Date().toISOString().split("T")[0])

      // AI-powered recommendation logic
      const scoredDoctors =
        doctors?.map((doctor) => {
          let score = 0
          const reasons: string[] = []

          // Specialization matching based on symptoms
          const symptomKeywords = symptoms.toLowerCase()
          const specializationMatch = getSpecializationMatch(symptomKeywords, doctor.specialization)
          score += specializationMatch.score
          if (specializationMatch.reason) reasons.push(specializationMatch.reason)

          // Availability scoring
          const availabilityScore = calculateAvailabilityScore(doctor, appointments || [])
          score += availabilityScore.score
          if (availabilityScore.reason) reasons.push(availabilityScore.reason)

          // Urgency factor
          if (urgency === "urgent") {
            score += 20
            reasons.push("Prioritized for urgent care")
          }

          // Time preference matching
          const timeScore = getTimePreferenceScore(doctor, preferredTime)
          score += timeScore
          if (timeScore > 0) reasons.push(`Available during preferred ${preferredTime} hours`)

          // Cost consideration (lower cost = higher score for routine visits)
          if (urgency === "routine") {
            const costScore = Math.max(0, 20 - doctor.consultation_fee / 10)
            score += costScore
            if (costScore > 10) reasons.push("Cost-effective option")
          }

          // Find next available slot
          const nextSlot = findNextAvailableSlot(doctor, appointments || [])
          const waitTime = nextSlot ? calculateWaitTime(nextSlot.date) : 999

          return {
            doctor,
            score,
            reasons,
            nextAvailableSlot: nextSlot || { date: "", time: "" },
            estimatedWaitTime: waitTime,
          }
        }) || []

      // Sort by score and take top 5
      const topRecommendations = scoredDoctors.sort((a, b) => b.score - a.score).slice(0, 5)

      setRecommendations(topRecommendations)
    } catch (error) {
      console.error("Error generating recommendations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSpecializationMatch = (symptoms: string, specialization: string) => {
    const matches = [
      { keywords: ["heart", "chest", "cardiac", "blood pressure"], spec: "Cardiology", score: 30 },
      { keywords: ["skin", "rash", "acne", "dermatitis"], spec: "Dermatology", score: 30 },
      { keywords: ["diabetes", "thyroid", "hormone"], spec: "Endocrinology", score: 30 },
      { keywords: ["stomach", "digestive", "nausea", "gastro"], spec: "Gastroenterology", score: 30 },
      { keywords: ["headache", "neurological", "seizure"], spec: "Neurology", score: 30 },
      { keywords: ["bone", "joint", "fracture", "orthopedic"], spec: "Orthopedics", score: 30 },
      { keywords: ["child", "pediatric", "infant"], spec: "Pediatrics", score: 30 },
      { keywords: ["mental", "depression", "anxiety"], spec: "Psychiatry", score: 30 },
    ]

    for (const match of matches) {
      if (match.keywords.some((keyword) => symptoms.includes(keyword)) && specialization.includes(match.spec)) {
        return { score: match.score, reason: `Specialized in ${match.spec} for your symptoms` }
      }
    }

    // General practice gets moderate score for any symptoms
    if (specialization.includes("General")) {
      return { score: 15, reason: "General practitioner suitable for various conditions" }
    }

    return { score: 5, reason: null }
  }

  const calculateAvailabilityScore = (doctor: Doctor, appointments: any[]) => {
    const doctorAppointments = appointments.filter((apt) => apt.doctor_id === doctor.id)
    const availableDays = doctor.available_days.length
    const bookedSlots = doctorAppointments.length

    // More available days = higher score
    let score = availableDays * 3

    // Fewer booked slots = higher score
    score += Math.max(0, 20 - bookedSlots)

    const reason = bookedSlots < 5 ? "Good availability" : null
    return { score, reason }
  }

  const getTimePreferenceScore = (doctor: Doctor, preference: string) => {
    if (!doctor.available_hours_start || !doctor.available_hours_end) return 0

    const startHour = Number.parseInt(doctor.available_hours_start.split(":")[0])
    const endHour = Number.parseInt(doctor.available_hours_end.split(":")[0])

    switch (preference) {
      case "morning":
        return startHour <= 9 ? 10 : 0
      case "afternoon":
        return startHour <= 14 && endHour >= 14 ? 10 : 0
      case "evening":
        return endHour >= 17 ? 10 : 0
      default:
        return 5
    }
  }

  const findNextAvailableSlot = (doctor: Doctor, appointments: any[]) => {
    const doctorAppointments = appointments.filter((apt) => apt.doctor_id === doctor.id)

    // Check next 14 days
    for (let i = 0; i < 14; i++) {
      const checkDate = format(addDays(new Date(), i), "yyyy-MM-dd")
      const dayName = format(addDays(new Date(), i), "EEEE").toLowerCase()

      if (doctor.available_days.includes(dayName)) {
        // Check if this day has available slots
        const dayAppointments = doctorAppointments.filter((apt) => apt.appointment_date === checkDate)

        if (dayAppointments.length < 8) {
          // Assuming max 8 appointments per day
          const availableTime = doctor.available_hours_start || "09:00"
          return { date: checkDate, time: availableTime }
        }
      }
    }

    return null
  }

  const calculateWaitTime = (date: string) => {
    const appointmentDate = parseISO(date)
    const today = new Date()
    const diffTime = appointmentDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          AI Appointment Recommender
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="symptoms">Describe your symptoms or reason for visit</Label>
            <Textarea
              id="symptoms"
              placeholder="e.g., persistent headaches, chest pain, skin rash..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="soon">Within a week</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Preferred Time</Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="any">Any time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="distance">Max Distance (miles)</Label>
              <Input id="distance" type="number" value={maxDistance} onChange={(e) => setMaxDistance(e.target.value)} />
            </div>
          </div>

          <Button onClick={generateRecommendations} disabled={!symptoms.trim() || isLoading} className="w-full">
            {isLoading ? "Analyzing..." : "Get AI Recommendations"}
          </Button>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommended Doctors</h3>
            {recommendations.map((rec, index) => (
              <Card key={rec.doctor.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(rec.doctor.profiles.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Dr. {rec.doctor.profiles.full_name}</p>
                        <p className="text-sm text-muted-foreground">{rec.doctor.specialization}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm">Match Score: {rec.score}%</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">${rec.doctor.consultation_fee}</Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Next available:{" "}
                        {rec.nextAvailableSlot.date
                          ? format(parseISO(rec.nextAvailableSlot.date), "MMM d, yyyy")
                          : "Not available"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Wait time: {rec.estimatedWaitTime} days</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Why this doctor?</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {rec.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {rec.nextAvailableSlot.date && (
                    <Button
                      size="sm"
                      onClick={() =>
                        onRecommendationSelect(rec.doctor.id, rec.nextAvailableSlot.date, rec.nextAvailableSlot.time)
                      }
                    >
                      Book Appointment
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
