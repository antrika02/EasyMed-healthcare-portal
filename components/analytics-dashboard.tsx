"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Heart,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  PiIcon as PieIcon,
  LogOut,
  Download,
  Activity,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie, // Import Pie from recharts
} from "recharts"

interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
}

interface AnalyticsData {
  totalPatients: number
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  totalRevenue: number
  averageRating: number
  appointmentsByMonth: Array<{ month: string; appointments: number; revenue: number }>
  appointmentsByStatus: Array<{ status: string; count: number; color: string }>
  appointmentsBySpecialization: Array<{ specialization: string; count: number }>
  busyDays: Array<{ day: string; appointments: number }>
  patientDemographics: Array<{ ageGroup: string; count: number }>
}

interface AnalyticsDashboardProps {
  user: any
  profile: Profile
}

export function AnalyticsDashboard({ user, profile }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("6months")

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)

      // Calculate date range based on selected period
      const now = new Date()
      let startDate: Date

      switch (selectedPeriod) {
        case "1month":
          startDate = startOfMonth(subMonths(now, 1))
          break
        case "3months":
          startDate = startOfMonth(subMonths(now, 3))
          break
        case "6months":
          startDate = startOfMonth(subMonths(now, 6))
          break
        case "1year":
          startDate = startOfMonth(subMonths(now, 12))
          break
        default:
          startDate = startOfMonth(subMonths(now, 6))
      }

      // Fetch all appointments with related data
      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          *,
          doctor:doctors!inner(
            id,
            specialization,
            consultation_fee,
            profiles!inner(full_name)
          ),
          patient:patients!inner(
            id,
            date_of_birth,
            gender,
            profiles!inner(full_name)
          )
        `)
        .gte("appointment_date", startDate.toISOString().split("T")[0])

      if (appointmentsError) throw appointmentsError

      // Fetch unique patients count
      const { data: patients, error: patientsError } = await supabase.from("patients").select("id")

      if (patientsError) throw patientsError

      // Process analytics data
      const totalPatients = patients?.length || 0
      const totalAppointments = appointments?.length || 0
      const completedAppointments = appointments?.filter((apt) => apt.status === "completed").length || 0
      const cancelledAppointments = appointments?.filter((apt) => apt.status === "cancelled").length || 0

      // Calculate revenue from completed appointments
      const totalRevenue =
        appointments
          ?.filter((apt) => apt.status === "completed")
          .reduce((sum, apt) => sum + (apt.doctor?.consultation_fee || 0), 0) || 0

      // Appointments by month
      const appointmentsByMonth = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthEnd = endOfMonth(subMonths(now, i))

        const monthAppointments =
          appointments?.filter((apt) => {
            const aptDate = parseISO(apt.appointment_date)
            return isWithinInterval(aptDate, { start: monthStart, end: monthEnd })
          }) || []

        const monthRevenue = monthAppointments
          .filter((apt) => apt.status === "completed")
          .reduce((sum, apt) => sum + (apt.doctor?.consultation_fee || 0), 0)

        appointmentsByMonth.push({
          month: format(monthStart, "MMM yyyy"),
          appointments: monthAppointments.length,
          revenue: monthRevenue,
        })
      }

      // Appointments by status
      const statusCounts = {
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        no_show: 0,
      }

      appointments?.forEach((apt) => {
        if (statusCounts.hasOwnProperty(apt.status)) {
          statusCounts[apt.status as keyof typeof statusCounts]++
        }
      })

      const appointmentsByStatus = [
        { status: "Completed", count: statusCounts.completed, color: "#10b981" },
        { status: "Confirmed", count: statusCounts.confirmed, color: "#3b82f6" },
        { status: "Scheduled", count: statusCounts.scheduled, color: "#f59e0b" },
        { status: "Cancelled", count: statusCounts.cancelled, color: "#ef4444" },
        { status: "No Show", count: statusCounts.no_show, color: "#6b7280" },
      ]

      // Appointments by specialization
      const specializationCounts: { [key: string]: number } = {}
      appointments?.forEach((apt) => {
        const spec = apt.doctor?.specialization || "Unknown"
        specializationCounts[spec] = (specializationCounts[spec] || 0) + 1
      })

      const appointmentsBySpecialization = Object.entries(specializationCounts).map(([specialization, count]) => ({
        specialization,
        count,
      }))

      // Busy days analysis
      const dayCounts: { [key: string]: number } = {}
      appointments?.forEach((apt) => {
        const dayName = format(parseISO(apt.appointment_date), "EEEE")
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1
      })

      const busyDays = Object.entries(dayCounts)
        .map(([day, appointments]) => ({
          day,
          appointments,
        }))
        .sort((a, b) => b.appointments - a.appointments)

      // Patient demographics (age groups)
      const ageGroups = {
        "0-18": 0,
        "19-30": 0,
        "31-45": 0,
        "46-60": 0,
        "60+": 0,
      }

      appointments?.forEach((apt) => {
        if (apt.patient?.date_of_birth) {
          const age = new Date().getFullYear() - new Date(apt.patient.date_of_birth).getFullYear()
          if (age <= 18) ageGroups["0-18"]++
          else if (age <= 30) ageGroups["19-30"]++
          else if (age <= 45) ageGroups["31-45"]++
          else if (age <= 60) ageGroups["46-60"]++
          else ageGroups["60+"]++
        }
      })

      const patientDemographics = Object.entries(ageGroups).map(([ageGroup, count]) => ({
        ageGroup,
        count,
      }))

      setAnalyticsData({
        totalPatients,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        totalRevenue,
        averageRating: 4.8, // Mock rating for now
        appointmentsByMonth,
        appointmentsByStatus,
        appointmentsBySpecialization,
        busyDays,
        patientDemographics,
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
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

  const exportData = () => {
    if (!analyticsData) return

    const csvData = [
      ["Metric", "Value"],
      ["Total Patients", analyticsData.totalPatients],
      ["Total Appointments", analyticsData.totalAppointments],
      ["Completed Appointments", analyticsData.completedAppointments],
      ["Cancelled Appointments", analyticsData.cancelledAppointments],
      ["Total Revenue", `$${analyticsData.totalRevenue}`],
      ["Average Rating", analyticsData.averageRating],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading || !analyticsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
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
            <Link href="/dashboard/doctor">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>

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
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive insights into your practice performance and patient care.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportData} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analyticsData.totalPatients}</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analyticsData.totalAppointments}</p>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <div className="bg-primary/10 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${analyticsData.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-6">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {((analyticsData.completedAppointments / analyticsData.totalAppointments) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Appointments Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Appointments Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.appointmentsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="appointments" stroke="#059669" fill="#059669" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Appointment Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-primary" />
                    Appointment Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.appointmentsByStatus}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {analyticsData.appointmentsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Busy Days Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Busiest Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.busyDays}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Appointments by Specialization */}
              <Card>
                <CardHeader>
                  <CardTitle>Appointments by Specialization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.appointmentsBySpecialization.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.specialization}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.appointmentsByMonth.slice(-3).map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{month.month}</p>
                          <p className="text-sm text-muted-foreground">{month.appointments} appointments</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${month.revenue}</p>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Patient Demographics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.patientDemographics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="ageGroup" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.appointmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
