"use client"

import { useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"
import { ShieldAlert, Mail, Link as LinkIcon, FileBadge, Loader2 } from "lucide-react"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
}

type Scan = {
  id: string
  subject: string
  prediction: string
  created_at: string
}

export default function OverviewPage() {
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScans() {
      try {
        const res = await fetch("/api/history")
        if (res.ok) {
          const data = await res.json()
          setScans(data)
        }
      } catch (err) {
        console.error("Overview fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchScans()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const totalScans = scans.length
  const phishingScans = scans.filter(s => s.prediction === "phishing_or_spam").length
  
  return (
    <div className="space-y-6">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {/* Metric Cards */}
        {[
          { title: "Total Emails Scanned", value: totalScans, icon: Mail, color: "text-blue-500" },
          { title: "Threats Detected", value: phishingScans, icon: ShieldAlert, color: "text-destructive" },
          { title: "Malicious URLs", value: "0", icon: LinkIcon, color: "text-orange-500" },
          { title: "Dangerous Attachments", value: "0", icon: FileBadge, color: "text-purple-500" }
        ].map((metric, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants}
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="glass-card p-6 flex flex-col justify-center cursor-default shadow-lg hover:shadow-primary/20 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">{metric.title}</h3>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Live database metrics
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-7"
      >
        <motion.div variants={itemVariants} className="glass-card col-span-4 p-6 shadow-xl">
          <div className="flex flex-col space-y-1.5 mb-4">
            <h3 className="font-semibold leading-none tracking-tight">Threat Analysis Overview</h3>
            <p className="text-sm text-muted-foreground">Scanned threat history for the last 30 days.</p>
          </div>
          <div className="h-[300px] w-full bg-background/50 rounded-lg flex items-center justify-center border border-border/50 border-dashed">
            <span className="text-muted-foreground text-sm">See Reports Dashboard for interactive charts</span>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-card col-span-3 p-6 shadow-xl">
          <div className="flex flex-col space-y-1.5 mb-4">
            <h3 className="font-semibold leading-none tracking-tight">Recent Scans</h3>
            <p className="text-sm text-muted-foreground">Latest email analyses performed by the engine.</p>
          </div>
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="space-y-4"
          >
            {scans.slice(0, 4).map((item) => {
              const isPhishing = item.prediction === "phishing_or_spam"
              return (
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ x: 5, backgroundColor: "var(--color-muted)" }}
                  key={item.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_8px] ${isPhishing ? 'bg-destructive shadow-destructive' : 'bg-emerald-500 shadow-emerald-500'}`} />
                    <div className="truncate">
                      <p className="text-sm font-medium truncate" title={item.subject}>{item.subject || "No Subject"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`flex-shrink-0 ml-2 text-xs font-medium px-2 py-1 rounded-full ${isPhishing ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                    {isPhishing ? 'High Risk' : 'Safe'}
                  </div>
                </motion.div>
              )
            })}
            {scans.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No recent scans.</p>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}