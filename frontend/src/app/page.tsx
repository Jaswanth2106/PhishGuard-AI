import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Background gradients */}
      <div className="absolute top-0 -left-1/4 w-[150%] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 -right-1/4 w-[100%] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Navbar */}
      <header className="container mx-auto px-6 py-4 flex items-center justify-between glass mt-4 rounded-2xl z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
            P
          </div>
          <span className="text-xl font-bold tracking-tight">PhishGuard AI</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</Link>
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" className="hidden sm:inline-flex border-primary/50 hover:bg-primary/10">Log In</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 z-10 mt-20 mb-32">
        <div className="glass-card p-2 inline-flex items-center gap-2 rounded-full mb-8 pr-4">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">New</span>
          <span className="text-sm font-medium">AI-Powered Attachment Analysis</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 leading-tight">
          Understand Every Email <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Before You Trust It.</span>
        </h1>
        
        <p className="mt-4 text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Advanced Email Threat Intelligence Platform that analyzes headers, attachments, and URLs in real-time. Protect your organization with military-grade AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link href="/dashboard/overview">
            <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/about">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 glass border-primary/30 hover:bg-primary/10">
              View Architecture
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
