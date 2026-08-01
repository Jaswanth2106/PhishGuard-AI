"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LoginErrors = {
  email?: string
  password?: string
}

function friendlyAuthError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Invalid email or password. Check your credentials and try again."
  }
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return "Email not verified. Check your inbox and confirm your account before signing in."
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network failure. Check your connection and try again."
  }
  return message || "Unable to sign in right now. Please try again."
}

export default function LoginPage() {
  const router = useRouter()
  const { status } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<LoginErrors>({})
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard/overview")
    }
  }, [router, status])

  function validate() {
    const nextErrors: LoginErrors = {}
    if (!email.trim()) {
      nextErrors.email = "Enter your email address."
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }

    if (!password) {
      nextErrors.password = "Enter your password."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")

    if (!validate()) {
      return
    }

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(friendlyAuthError(error.message))
        return
      }

      if (!data.user?.email_confirmed_at) {
        await supabase.auth.signOut()
        setMessage("Email not verified. Check your inbox and confirm your account before signing in.")
        return
      }

      setMessage("Signed in successfully. Redirecting...")
      router.replace("/dashboard/overview")
    } catch (error) {
      setMessage(error instanceof Error ? friendlyAuthError(error.message) : "Network failure. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to sign in to your account
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
            Email
          </label>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
            id="email" 
            placeholder="m@example.com" 
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email ? <p id="email-error" className="text-sm text-destructive" role="alert">{errors.email}</p> : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium leading-none" htmlFor="password">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
            id="password" 
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password ? <p id="password-error" className="text-sm text-destructive" role="alert">{errors.password}</p> : null}
        </div>
        {message ? <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{message}</p> : null}
        <Button className="w-full bg-primary hover:bg-primary/90" disabled={isLoading} type="submit">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Sign In
        </Button>
      </div>
      
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  )
}
