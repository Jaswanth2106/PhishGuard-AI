import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we will send you a reset link
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="email">
            Email
          </label>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
            id="email" 
            placeholder="m@example.com" 
            type="email" 
          />
        </div>
        <Button className="w-full bg-primary hover:bg-primary/90">Send Reset Link</Button>
      </div>
      
      <div className="text-center text-sm">
        Remembered your password?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  )
}