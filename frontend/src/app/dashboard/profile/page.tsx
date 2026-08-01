/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { FormEvent, useEffect, useState } from "react"
import { Loader2, User, Mail, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase-client"

export default function ProfilePage() {
  const { user, displayName, email: currentEmail } = useAuth()
  
  const [fullName, setFullName] = useState(displayName)
  const [email, setEmail] = useState(currentEmail)
  const [password, setPassword] = useState("")
  
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  useEffect(() => {
    // Only update if the form fields are untouched (initial render sync)
    if (user && !fullName && !email) {
      setFullName(displayName)
      setEmail(currentEmail)
    }
  }, [user, displayName, currentEmail, fullName, email])

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ text: "", type: "" })

    try {
      const supabase = getSupabaseClient()
      const updates: { data?: { full_name: string }; email?: string; password?: string } = {}
      
      if (fullName !== displayName) {
        updates.data = { full_name: fullName }
      }
      if (email !== currentEmail && email.trim() !== "") {
        updates.email = email
      }
      if (password.trim() !== "") {
        updates.password = password
      }

      if (Object.keys(updates).length === 0) {
        setMessage({ text: "No changes to save.", type: "info" })
        setIsSaving(false)
        return
      }

      const { error } = await supabase.auth.updateUser(updates)

      if (error) {
        setMessage({ text: error.message, type: "error" })
      } else {
        setMessage({ 
          text: "Profile updated successfully! " + (updates.email ? "Check your new email inbox for a verification link." : ""), 
          type: "success" 
        })
        setPassword("") // Clear password field after successful update
      }
    } catch (err: unknown) {
      const e = err as Error
      setMessage({ text: e.message || "An unexpected error occurred.", type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account details and security preferences.
        </p>
      </div>

      <div className="glass-card p-6 rounded-xl border border-border/50">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none flex items-center gap-2" htmlFor="fullName">
                <User className="w-4 h-4 text-muted-foreground" />
                Display Name
              </label>
              <input 
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none flex items-center gap-2" htmlFor="email">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email Address
              </label>
              <input 
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="m@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none flex items-center gap-2" htmlFor="password">
                <Lock className="w-4 h-4 text-muted-foreground" />
                New Password (Optional)
              </label>
              <input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          {message.text && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'error' ? 'bg-destructive/15 text-destructive' : message.type === 'success' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'}`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
