"use client"

import { useEffect, useState } from "react"
import { Loader2, Search, Trash2, ShieldAlert, CheckCircle2, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase-client"

type Scan = {
  id: string
  subject: string
  body_snippet: string
  prediction: string
  confidence_score: number
  created_at: string
}

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchScans() {
      setLoading(true)
      try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("scans")
          .select("*")
          .order("created_at", { ascending: false })
        
        if (!error && data) {
          setScans(data)
        }
      } catch (err) {
        console.error("Error fetching scans:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchScans()
  }, [])

  async function deleteScan(id: string) {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("scans").delete().eq("id", id)
      if (!error) {
        setScans((prev) => prev.filter((scan) => scan.id !== id))
      }
    } catch (err) {
      console.error("Error deleting scan:", err)
    }
  }

  const filteredScans = scans.filter((scan) => 
    scan.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    scan.prediction.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Scan History</h2>
          <p className="text-muted-foreground">View and manage your previous email analysis results.</p>
        </div>
      </div>

      <div className="glass-card rounded-xl border border-border/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by subject or result..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">No scans found</p>
            <p className="text-sm">You haven&apos;t scanned any emails yet, or no results match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Result</th>
                  <th className="px-6 py-4 font-medium">Confidence</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredScans.map((scan) => {
                  const isPhishing = scan.prediction === "phishing_or_spam"
                  
                  return (
                    <tr key={scan.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground max-w-[300px] truncate" title={scan.subject}>
                        {scan.subject || "No Subject"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isPhishing ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                          {isPhishing ? <ShieldAlert className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {isPhishing ? "Phishing/Spam" : "Legitimate"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={scan.confidence_score >= 0.8 && isPhishing ? 'text-destructive font-semibold' : ''}>
                            {(scan.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(scan.created_at))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => deleteScan(scan.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}