import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const error = params.error

  const getErrorMessage = (errorCode?: string) => {
    switch (errorCode) {
      case "access_denied":
        return "Access was denied. Please try again."
      case "server_error":
        return "A server error occurred. Please try again later."
      case "temporarily_unavailable":
        return "The service is temporarily unavailable. Please try again later."
      default:
        return "An authentication error occurred. Please try again."
    }
  }

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
              <AlertCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-xl">Authentication Error</CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{getErrorMessage(error)}</p>

            {error && <div className="text-xs text-muted-foreground bg-muted p-2 rounded">Error code: {error}</div>}

            <div className="space-y-2">
              <Link href="/auth/login">
                <Button className="w-full">Try Again</Button>
              </Link>

              <Link href="/">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
