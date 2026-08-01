"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client"

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "configuration_error"

type AuthContextValue = {
  status: AuthStatus
  session: Session | null
  user: User | null
  displayName: string
  email: string
  initials: string
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function displayNameFor(user: User | null) {
  const metadataName = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""
  return metadataName.trim() || user?.email?.split("@")[0] || "User"
}

function initialsFor(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length > 0) {
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase()
  }
  return email.slice(0, 2).toUpperCase() || "US"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => isSupabaseConfigured() ? "loading" : "configuration_error")
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return
    }

    const supabase = getSupabaseClient()
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }
      setSession(data.session)
      setStatus(data.session ? "authenticated" : "unauthenticated")
    }).catch(() => {
      if (!isMounted) {
        return
      }
      setSession(null)
      setStatus("unauthenticated")
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setStatus(nextSession ? "authenticated" : "unauthenticated")
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const user = session?.user ?? null
  const displayName = displayNameFor(user)
  const email = user?.email ?? ""
  const initials = initialsFor(displayName, email)

  const value = useMemo<AuthContextValue>(() => ({
    status,
    session,
    user,
    displayName,
    email,
    initials,
    async signOut() {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      setSession(null)
      setStatus("unauthenticated")
    },
  }), [displayName, email, initials, session, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.")
  }
  return context
}

