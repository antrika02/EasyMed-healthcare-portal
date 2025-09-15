import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">EasyMed</CardTitle>
            </div>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription>We've sent you a confirmation link to complete your registration</CardDescription>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-5 w-5" />
              <span>Confirmation email sent</span>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Please check your email and click the confirmation link to activate your account.</p>
              <p>Once confirmed, you can sign in and complete your profile.</p>
            </div>

            <div className="pt-4">
              <Link href="/auth/login">
                <Button className="w-full">Back to Sign In</Button>
              </Link>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Didn't receive the email? Check your spam folder or contact support.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
