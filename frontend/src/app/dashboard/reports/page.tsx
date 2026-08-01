"use client"

import { useEffect, useState } from "react"
import { ShieldAlert, ShieldCheck, Mail, AlertTriangle, TrendingUp, Activity, Loader2 } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase-client"

type Scan = {
  id: string
  prediction: string
  confidence_score: number
  created_at: string
}

export default function ReportsPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScans() {
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("scans")
          .select("id, prediction, confidence_score, created_at")
          .order("created_at", { ascending: true })

        if (!error && data) {
          setScans(data)
        }
      } catch (err) {
        console.error("Error fetching for reports:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchScans()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalScans = scans.length
  const phishingScans = scans.filter(s => s.prediction === "phishing_or_spam").length
  const safeScans = totalScans - phishingScans
  const avgConfidence = totalScans > 0 
    ? scans.reduce((acc, s) => acc + s.confidence_score, 0) / totalScans 
    : 0

  const phishingRate = totalScans > 0 ? (phishingScans / totalScans) * 100 : 0

  // Group by day for simple trend
  const trendData: Record<string, { date: string; safe: number; phishing: number }> = {}
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    trendData[key] = { date: d.toLocaleDateString(undefined, { weekday: 'short' }), safe: 0, phishing: 0 }
  }

  scans.forEach(scan => {
    const key = scan.created_at.split('T')[0]
    if (trendData[key]) {
      if (scan.prediction === "phishing_or_spam") {
        trendData[key].phishing++
      } else {
        trendData[key].safe++
      }
    }
  })

  const trendArray = Object.values(trendData)
  const maxMailsInDay = Math.max(...trendArray.map(t => t.safe + t.phishing), 1) // prevent div by zero

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Analytics & Reports</h2>
        <p className="text-muted-foreground mt-2">Insights and trends from your email analysis history.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI Cards */}
        <div className="glass-card rounded-xl p-6 border border-border/50 relative overflow-hidden group hover:border-primary/50 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all" />
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Emails Analyzed</h3>
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-bold mt-2">{totalScans}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Lifetime scans
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-border/50 relative overflow-hidden group hover:border-destructive/50 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-destructive/10 rounded-full blur-xl group-hover:bg-destructive/20 transition-all" />
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Threats Detected</h3>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-3xl font-bold mt-2">{phishingScans}</div>
          <p className="text-xs text-destructive mt-1">
            {phishingRate.toFixed(1)}% of total scans
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-border/50 relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Safe Emails</h3>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold mt-2">{safeScans}</div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
            Verified legitimate
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-border/50 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all" />
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Average Confidence</h3>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold mt-2">{(avgConfidence * 100).toFixed(1)}%</div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Model certainty
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4 glass-card rounded-xl border border-border/50 p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">7-Day Threat Trend</h3>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 flex items-end gap-2 h-64 mt-auto">
            {trendArray.map((day, idx) => {
              const total = day.safe + day.phishing
              const hSafe = total === 0 ? 0 : (day.safe / maxMailsInDay) * 100
              const hPhishing = total === 0 ? 0 : (day.phishing / maxMailsInDay) * 100
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full relative h-full flex flex-col justify-end gap-[1px]">
                    {hPhishing > 0 && (
                      <div 
                        className="w-full bg-gradient-to-t from-destructive/80 to-destructive rounded-t-sm transition-all duration-500 group-hover:brightness-110" 
                        style={{ height: `${hPhishing}%` }}
                        title={`${day.phishing} Threats`}
                      />
                    )}
                    {hSafe > 0 && (
                      <div 
                        className="w-full bg-gradient-to-t from-emerald-500/80 to-emerald-400 rounded-sm transition-all duration-500 group-hover:brightness-110" 
                        style={{ height: `${hSafe}%`, borderTopLeftRadius: hPhishing === 0 ? '0.125rem' : '0', borderTopRightRadius: hPhishing === 0 ? '0.125rem' : '0' }}
                        title={`${day.safe} Safe`}
                      />
                    )}
                    {total === 0 && (
                      <div className="w-full h-[2px] bg-muted/50 rounded-full" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{day.date}</span>
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Safe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Phishing/Spam</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 glass-card rounded-xl border border-border/50 p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">Risk Assessment</h3>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" className="stroke-muted/30 stroke-[8] fill-none" />
                {totalScans > 0 && (
                  <>
                    {/* Safe Segment */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      className="stroke-emerald-500 stroke-[8] fill-none transition-all duration-1000 ease-out" 
                      strokeDasharray={`${(safeScans / totalScans) * 251.2} 251.2`} 
                    />
                    {/* Phishing Segment */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      className="stroke-destructive stroke-[8] fill-none transition-all duration-1000 ease-out delay-500" 
                      strokeDasharray={`${(phishingScans / totalScans) * 251.2} 251.2`}
                      strokeDashoffset={-(safeScans / totalScans) * 251.2}
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold">{totalScans > 0 ? (phishingScans / totalScans * 100).toFixed(0) : 0}%</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Risk Ratio</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              {totalScans === 0 ? "Analyze emails to generate risk insights." : 
               phishingRate > 50 ? "Your inbox is highly exposed to threats." : 
               "Your environment maintains a standard security profile."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}