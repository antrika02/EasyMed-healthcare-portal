"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, User, FileText } from "lucide-react"

interface ProfileData {
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  emergencyContactName: string
  emergencyContactPhone: string
  medicalHistory: string
  allergies: string
  currentMedications: string
  insuranceProvider: string
  insurancePolicyNumber: string
}

export default function CompleteProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>("")
  const [profileData, setProfileData] = useState<ProfileData>({
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    console.log("[v0] Checking user authentication...")
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log("[v0] No user found, redirecting to login")
      router.push("/auth/login")
      return
    }

    console.log("[v0] User found:", user.id)
    setUser(user)

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    console.log("[v0] User profile:", profile)

    if (profile) {
      setUserRole(profile.role)
      setProfileData((prev) => ({
        ...prev,
        phone: profile.phone || "",
      }))

      if (profile.role === "patient") {
        const { data: existingPatient } = await supabase.from("patients").select("*").eq("user_id", user.id).single()

        if (existingPatient) {
          console.log("[v0] Patient record already exists, redirecting to dashboard")
          router.push("/dashboard/patient")
          return
        }
      }
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !userRole) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Starting profile completion for user:", user.id, "role:", userRole)

      // Update profile with phone
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ phone: profileData.phone })
        .eq("id", user.id)

      if (profileError) {
        console.log("[v0] Profile update error:", profileError)
        throw profileError
      }

      console.log("[v0] Profile updated successfully")

      if (userRole === "patient") {
        const { data: existingPatient } = await supabase.from("patients").select("id").eq("user_id", user.id).single()

        if (!existingPatient) {
          // Create patient record
          const patientData = {
            user_id: user.id,
            date_of_birth: profileData.dateOfBirth || null,
            gender: profileData.gender || null,
            address: profileData.address || null,
            emergency_contact_name: profileData.emergencyContactName || null,
            emergency_contact_phone: profileData.emergencyContactPhone || null,
            medical_history: profileData.medicalHistory || null,
            allergies: profileData.allergies || null,
            current_medications: profileData.currentMedications || null,
            insurance_provider: profileData.insuranceProvider || null,
            insurance_policy_number: profileData.insurancePolicyNumber || null,
          }

          console.log("[v0] Creating patient record:", patientData)

          const { error: patientError } = await supabase.from("patients").insert(patientData)

          if (patientError) {
            console.log("[v0] Patient creation error:", patientError)
            throw patientError
          }

          console.log("[v0] Patient record created successfully")
        } else {
          console.log("[v0] Patient record already exists, skipping creation")
        }
      }

      const targetUrl = redirectTo || `/dashboard/${userRole}`
      console.log("[v0] Redirecting to:", targetUrl)

      await new Promise((resolve) => setTimeout(resolve, 500))

      router.push(targetUrl)
    } catch (error: any) {
      console.log("[v0] Error completing profile:", error)
      setError(error.message || "Failed to complete profile")
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">EasyMed</CardTitle>
            </div>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Please provide additional information to complete your {userRole} profile</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Patient-specific fields */}
              {userRole === "patient" && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Personal Details</h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={profileData.dateOfBirth}
                          onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={profileData.gender}
                          onValueChange={(value) => handleInputChange("gender", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        placeholder="Enter your address"
                        value={profileData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Emergency Contact</h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                        <Input
                          id="emergencyContactName"
                          type="text"
                          placeholder="Contact name"
                          value={profileData.emergencyContactName}
                          onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                        <Input
                          id="emergencyContactPhone"
                          type="tel"
                          placeholder="Contact phone"
                          value={profileData.emergencyContactPhone}
                          onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Medical Information (Optional)</h3>

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="medicalHistory">Medical History</Label>
                        <Textarea
                          id="medicalHistory"
                          placeholder="Any relevant medical history"
                          value={profileData.medicalHistory}
                          onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="allergies">Allergies</Label>
                        <Textarea
                          id="allergies"
                          placeholder="Any known allergies"
                          value={profileData.allergies}
                          onChange={(e) => handleInputChange("allergies", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="currentMedications">Current Medications</Label>
                        <Textarea
                          id="currentMedications"
                          placeholder="Current medications"
                          value={profileData.currentMedications}
                          onChange={(e) => handleInputChange("currentMedications", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Insurance Information (Optional)</h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                        <Input
                          id="insuranceProvider"
                          type="text"
                          placeholder="Insurance company"
                          value={profileData.insuranceProvider}
                          onChange={(e) => handleInputChange("insuranceProvider", e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                        <Input
                          id="insurancePolicyNumber"
                          type="text"
                          placeholder="Policy number"
                          value={profileData.insurancePolicyNumber}
                          onChange={(e) => handleInputChange("insurancePolicyNumber", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <Alert>
                  <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Completing Profile..." : "Complete Profile"}
                </Button>

                {userRole === "doctor" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/${userRole}`)}
                    className="flex-1"
                  >
                    Skip for Now
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
