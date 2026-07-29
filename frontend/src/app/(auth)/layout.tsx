export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background gradients */}
      <div className="absolute top-1/4 -left-1/4 w-[150%] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[100%] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md p-6 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-bold text-white shadow-lg text-2xl mb-4">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PhishGuard AI</h1>
          <p className="text-muted-foreground text-sm mt-1">Understand Every Email Before You Trust It.</p>
        </div>
        
        <div className="glass-card p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
