import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Users, Calendar, Shield, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">EasyMed</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register/patient">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-balance">
            Your Health, <span className="text-primary">Simplified</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty">
            EasyMed connects patients with healthcare providers through a comprehensive digital platform. Schedule
            appointments, manage medical records, and access quality healthcare with ease.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/register/patient">
              <Button size="lg" className="gap-2">
                Register as Patient <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register/doctor">
              <Button variant="outline" size="lg">
                Join as Doctor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Choose EasyMed?</h2>
          <p className="mt-4 text-lg text-muted-foreground">Comprehensive healthcare management made simple</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Easy Scheduling</CardTitle>
              <CardDescription>Book appointments with your preferred doctors at convenient times</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time availability</li>
                <li>• Instant confirmations</li>
                <li>• Reminder notifications</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Expert Doctors</CardTitle>
              <CardDescription>Connect with qualified healthcare professionals across specializations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Verified credentials</li>
                <li>• Multiple specializations</li>
                <li>• Patient reviews</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Secure Records</CardTitle>
              <CardDescription>Your medical information is protected with enterprise-grade security</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• HIPAA compliant</li>
                <li>• Encrypted data</li>
                <li>• Access controls</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-24">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8 opacity-90">Join thousands of patients and doctors already using EasyMed</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/patient">
                <Button size="lg" variant="secondary">
                  Register as Patient
                </Button>
              </Link>
              <Link href="/register/doctor">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  Join as Doctor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <span className="font-semibold">EasyMed</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 EasyMed. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
