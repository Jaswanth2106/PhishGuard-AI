"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase-client"

type ResetErrors = {
  password?: string
  confirmPassword?: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<ResetErrors>({})
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function validate() {
    const nextErrors: ResetErrors = {}
    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters."
    }
    if (password !== confirmPassword) {
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
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setMessage(error.message)
        return
      }

      setMessage("Password updated successfully. Redirecting to login...")
      await supabase.auth.signOut()
      router.replace("/login")
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Network failure. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter a new password for your account
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none" htmlFor="password">
            New Password
          </label>
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password ? <p id="password-error" className="text-sm text-destructive" role="alert">{errors.password}</p> : null}
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
          Update Password
        </Button>
      </div>

      <div className="text-center text-sm">
        <Link href="/login" className="text-primary font-medium hover:underline">
          Back to login
        </Link>
      </div>
    </form>
  )
}
