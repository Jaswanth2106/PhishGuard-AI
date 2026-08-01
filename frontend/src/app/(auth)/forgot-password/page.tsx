"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase-client"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")

    if (!email.trim()) {
      setError("Enter your email address.")
      return
    }

    if (!emailPattern.test(email.trim())) {
      setError("Enter a valid email address.")
      return
    }

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setMessage(resetError.message)
        return
      }

      setMessage("If an account exists for that email, a password reset link has been sent.")
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Network failure. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "email-error" : undefined}
          />
          {error ? <p id="email-error" className="text-sm text-destructive" role="alert">{error}</p> : null}
        </div>
        {message ? <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{message}</p> : null}
        <Button className="w-full bg-primary hover:bg-primary/90" disabled={isLoading} type="submit">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Send Reset Link
        </Button>
      </div>
      
      <div className="text-center text-sm">
        Remembered your password?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to login
        </Link>
      </div>
    </form>
  )
}
