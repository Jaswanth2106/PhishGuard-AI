import { ShieldAlert, Mail, Link as LinkIcon, FileBadge } from "lucide-react"

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        {[
          { title: "Total Emails Scanned", value: "1,248", icon: Mail, color: "text-blue-500" },
          { title: "Threats Detected", value: "24", icon: ShieldAlert, color: "text-destructive" },
          { title: "Malicious URLs", value: "12", icon: LinkIcon, color: "text-orange-500" },
          { title: "Dangerous Attachments", value: "4", icon: FileBadge, color: "text-purple-500" }
        ].map((metric, i) => (
          <div key={i} className="glass-card p-6 flex flex-col justify-center">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">{metric.title}</h3>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +20% from last month
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="glass-card col-span-4 p-6">
          <div className="flex flex-col space-y-1.5 mb-4">
            <h3 className="font-semibold leading-none tracking-tight">Threat Analysis Overview</h3>
            <p className="text-sm text-muted-foreground">Scanned threat history for the last 30 days.</p>
          </div>
          <div className="h-[300px] w-full bg-background/50 rounded-lg flex items-center justify-center border border-border/50 border-dashed">
            <span className="text-muted-foreground text-sm">Chart Placeholder</span>
          </div>
        </div>
        
        <div className="glass-card col-span-3 p-6">
          <div className="flex flex-col space-y-1.5 mb-4">
            <h3 className="font-semibold leading-none tracking-tight">Recent Scans</h3>
            <p className="text-sm text-muted-foreground">Latest email analyses performed by the engine.</p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item === 1 ? 'bg-destructive' : 'bg-green-500'}`} />
                  <div>
                    <p className="text-sm font-medium">Invoice_Update.pdf</p>
                    <p className="text-xs text-muted-foreground">2 mins ago</p>
                  </div>
                </div>
                <div className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {item === 1 ? 'High Risk' : 'Safe'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}