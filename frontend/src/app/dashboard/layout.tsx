"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  ShieldAlert, 
  History, 
  FileText, 
  Settings, 
  MessageSquare,
  Menu,
  X,
  LogOut
} from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { name: 'Analyse', href: '/dashboard/analyse', icon: ShieldAlert },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col glass border-r border-border/50 shadow-2xl lg:shadow-none bg-card/80">
          <div className="h-20 flex items-center px-6 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-bold text-white shadow-lg mr-3">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">PhishGuard AI</span>
          </div>
          
          <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'}
                  `}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-foreground' : 'text-primary/70'}`} />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="p-4 border-t border-border/50">
            <Link href="/login">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -z-10" />
        
        {/* Top Navbar */}
        <header className="h-20 glass-card mx-4 mt-4 mb-2 flex items-center justify-between px-6 z-10 border-border/30">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-3 mr-2 text-muted-foreground hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold capitalize hidden sm:block">
              {pathname.split('/').pop() || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/80 to-blue-500/80 border-2 border-background shadow-sm overflow-hidden flex items-center justify-center font-bold text-white text-sm">
              US
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 z-10">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
