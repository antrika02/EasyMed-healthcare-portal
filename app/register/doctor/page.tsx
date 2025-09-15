"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, User, GraduationCap, Clock } from "lucide-react"
import Link from "next/link"

interface DoctorFormData {
  // Auth data
  email: string
  password: string
  confirmPassword: string
  fullName: string
  phone: string

  // Doctor specific data
  licenseNumber: string
  specialization: string
  yearsOfExperience: string
  education: string
  certifications: string
  consultationFee: string
  availableDays: string[]
  availableHoursStart: string
  availableHoursEnd: string
  bio: string
}

const DAYS_OF_WEEK = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
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
  "Other",
]

export default function DoctorRegistrationPage() {
  const [formData, setFormData] = useState<DoctorFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    licenseNumber: "",
    specialization: "",
    yearsOfExperience: "",
    education: "",
    certifications: "",
    consultationFee: "",
    availableDays: [],
    availableHoursStart: "",
    availableHoursEnd: "",
    bio: "",
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (field: keyof DoctorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDayToggle = (day: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      availableDays: checked ? [...prev.availableDays, day] : prev.availableDays.filter((d) => d !== day),
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.fullName &&
          formData.phone
        )
      case 2:
        return !!(formData.licenseNumber && formData.specialization && formData.yearsOfExperience)
      case 3:
        return !!(formData.education && formData.consultationFee)
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (validateStep(currentStep)) {
      setError(null)
      setCurrentStep((prev) => prev + 1)
    } else {
      setError("Please fill in all required fields")
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Sign up the user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard/doctor`,
          data: {
            full_name: formData.fullName,
            role: "doctor",
          },
        },
      })

      if (authError) throw authError

      // The profile will be created automatically by the trigger
      // We need to wait for email confirmation before creating doctor record

      router.push("/auth/sign-up-success")
    } catch (error: any) {
      setError(error.message || "An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Account Information</h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. John Smith"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Professional Information</h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="licenseNumber">Medical License Number *</Label>
                <Input
                  id="licenseNumber"
                  type="text"
                  placeholder="Enter your license number"
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="specialization">Specialization *</Label>
                <Select
                  value={formData.specialization}
                  onValueChange={(value) => handleInputChange("specialization", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your specialization" />
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
                <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  placeholder="Enter years of experience"
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleInputChange("yearsOfExperience", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Education & Fees</h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="education">Education *</Label>
                <Textarea
                  id="education"
                  placeholder="Enter your educational background"
                  value={formData.education}
                  onChange={(e) => handleInputChange("education", e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="certifications">Certifications</Label>
                <Textarea
                  id="certifications"
                  placeholder="Enter any additional certifications"
                  value={formData.certifications}
                  onChange={(e) => handleInputChange("certifications", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="consultationFee">Consultation Fee (USD) *</Label>
                <Input
                  id="consultationFee"
                  type="number"
                  placeholder="Enter consultation fee"
                  value={formData.consultationFee}
                  onChange={(e) => handleInputChange("consultationFee", e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Availability & Bio</h3>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Available Days</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.id}
                        checked={formData.availableDays.includes(day.id)}
                        onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)}
                      />
                      <Label htmlFor={day.id} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="availableHoursStart">Start Time</Label>
                  <Input
                    id="availableHoursStart"
                    type="time"
                    value={formData.availableHoursStart}
                    onChange={(e) => handleInputChange("availableHoursStart", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="availableHoursEnd">End Time</Label>
                  <Input
                    id="availableHoursEnd"
                    type="time"
                    value={formData.availableHoursEnd}
                    onChange={(e) => handleInputChange("availableHoursEnd", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Professional Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell patients about yourself and your approach to healthcare"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">EasyMed</CardTitle>
            </div>
            <CardDescription>Doctor Registration - Step {currentStep} of 4</CardDescription>

            {/* Progress indicator */}
            <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${step <= currentStep ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {renderStep()}

            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Complete Registration"}
                </Button>
              )}
            </div>

            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
