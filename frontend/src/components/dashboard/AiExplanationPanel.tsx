import { BrainCircuit, AlertTriangle, Link2, ShieldCheck, Zap } from "lucide-react"

export type AiExplanation = {
  riskLevel: "Low" | "Medium" | "High" | "Critical"
  reasons: string[]
  suspiciousLinks: string[]
  socialEngineering: string[]
  recommendedAction: string
}

export function AiExplanationPanel({ explanation }: { explanation: AiExplanation | null }) {
  if (!explanation) return null

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical": return "bg-red-500 text-white"
      case "High": return "bg-orange-500 text-white"
      case "Medium": return "bg-yellow-500 text-yellow-950"
      case "Low": return "bg-emerald-500 text-white"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BrainCircuit className="w-24 h-24" />
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <BrainCircuit className="w-5 h-5" />
          <h3>Gemini AI Explanation</h3>
        </div>
        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getRiskColor(explanation.riskLevel)}`}>
          {explanation.riskLevel} Risk
        </span>
      </div>

      <div className="relative z-10 grid gap-4 sm:grid-cols-2 text-sm mt-4">
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 font-medium text-muted-foreground uppercase text-xs">
            <AlertTriangle className="w-4 h-4" /> Reasons
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {explanation.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>
        
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 font-medium text-muted-foreground uppercase text-xs">
            <ShieldCheck className="w-4 h-4" /> Social Engineering
          </h4>
          <ul className="list-disc pl-5 space-y-1">
            {explanation.socialEngineering.length > 0 ? explanation.socialEngineering.map((tactic, i) => (
              <li key={i}>{tactic}</li>
            )) : <li>None detected</li>}
          </ul>
        </div>
      </div>

      {explanation.suspiciousLinks.length > 0 && (
        <div className="relative z-10 space-y-2 mt-4 pt-4 border-t border-primary/10 text-sm">
          <h4 className="flex items-center gap-2 font-medium text-muted-foreground uppercase text-xs">
            <Link2 className="w-4 h-4" /> Suspicious Links Detected
          </h4>
          <ul className="space-y-1">
            {explanation.suspiciousLinks.map((link, i) => (
              <li key={i} className="text-destructive break-all bg-destructive/10 px-2 py-1 rounded">
                {link}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="relative z-10 space-y-2 mt-4 pt-4 border-t border-primary/10 text-sm">
        <h4 className="flex items-center gap-2 font-medium text-emerald-500 uppercase text-xs">
          <Zap className="w-4 h-4" /> Recommended Action
        </h4>
        <p className="bg-background/50 p-3 rounded-lg border border-border">
          {explanation.recommendedAction}
        </p>
      </div>
    </div>
  )
}
