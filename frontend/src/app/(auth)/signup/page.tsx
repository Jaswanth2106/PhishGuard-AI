"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type SignupErrors = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function friendlySignupError(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("user already")) {
    return "An account with this email already exists. Try signing in instead."
  }
  if (lower.includes("weak") || lower.includes("password")) {
    return "Password is too weak. Use at least 8 characters with a mix of letters and numbers."
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network failure. Check your connection and try again."
  }
  return message || "Unable to create your account right now. Please try again."
}

export default function SignupPage() {
  const router = useRouter()
  const { status } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<SignupErrors>({})
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard/overview")
    }
  }, [router, status])

  function validate() {
    const nextErrors: SignupErrors = {}
    if (!name.trim()) {
      nextErrors.name = "Enter your full name."
    }

    if (!email.trim()) {
      nextErrors.email = "Enter your email address."
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }

    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters."
    }

    if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match."
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
      const emailRedirectTo = `${window.location.origin}/login`
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: name.trim(),
          },
        },
      })

      if (error) {
        setMessage(friendlySignupError(error.message))
        return
      }

      setMessage("Account created. Check your email to verify your account before signing in.")
    } catch (error) {
      setMessage(error instanceof Error ? friendlySignupError(error.message) : "Network failure. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to create your account
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="name">
            Full Name
          </label>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
            id="name" 
            placeholder="John Doe" 
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name ? <p id="name-error" className="text-sm text-destructive" role="alert">{errors.name}</p> : null}
        </div>
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
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
          />
          {errors.email ? <p id="signup-email-error" className="text-sm text-destructive" role="alert">{errors.email}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="password">
            Password
          </label>
          <input 
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
            id="password" 
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signup-password-error" : undefined}
          />
          {errors.password ? <p id="signup-password-error" className="text-sm text-destructive" role="alert">{errors.password}</p> : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="confirm-password">
            Confirm Password
          </label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
          />
          {errors.confirmPassword ? <p id="confirm-password-error" className="text-sm text-destructive" role="alert">{errors.confirmPassword}</p> : null}
        </div>
        {message ? <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground" role="status">{message}</p> : null}
        <Button className="w-full bg-primary hover:bg-primary/90" disabled={isLoading} type="submit">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Sign Up
        </Button>
      </div>
      
      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  )
}
