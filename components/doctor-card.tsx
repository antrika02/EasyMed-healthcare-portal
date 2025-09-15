import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, DollarSign, Star, Calendar } from "lucide-react"
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

interface DoctorCardProps {
  doctor: Doctor
}

export function DoctorCard({ doctor }: DoctorCardProps) {
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

    const days = doctor.available_days.map((day) => day.charAt(0).toUpperCase() + day.slice(1, 3)).join(", ")

    const timeRange =
      doctor.available_hours_start && doctor.available_hours_end
        ? `${doctor.available_hours_start} - ${doctor.available_hours_end}`
        : ""

    return `${days}${timeRange ? ` • ${timeRange}` : ""}`
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {getInitials(doctor.profiles.full_name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">Dr. {doctor.profiles.full_name}</h3>
            <p className="text-muted-foreground text-sm">{doctor.specialization}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-muted-foreground">{doctor.years_of_experience} years experience</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio */}
        {doctor.bio && <p className="text-sm text-muted-foreground line-clamp-2">{doctor.bio}</p>}

        {/* Education */}
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Education:</span> {doctor.education}
          </p>

          {doctor.certifications && (
            <p className="text-sm">
              <span className="font-medium">Certifications:</span> {doctor.certifications}
            </p>
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatAvailability()}</span>
        </div>

        {/* Consultation Fee */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="font-medium">${doctor.consultation_fee} per consultation</span>
        </div>

        {/* Specialization Badge */}
        <div>
          <Badge variant="secondary">{doctor.specialization}</Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Link href={`/doctors/${doctor.id}`} className="flex-1">
            <Button variant="outline" className="w-full bg-transparent">
              View Profile
            </Button>
          </Link>
          <Link href={`/book-appointment/${doctor.id}`} className="flex-1">
            <Button className="w-full gap-2">
              <Calendar className="h-4 w-4" />
              Book
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
