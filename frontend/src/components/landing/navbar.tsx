"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 flex flex-col justify-center px-6 transition-all duration-300 ${
        isScrolled
          ? "glass mx-4 mt-4 rounded-2xl border border-border/50 shadow-xl"
          : "bg-transparent mx-0 mt-0 border-transparent"
      } ${isMobileMenuOpen ? "py-4" : "h-24 sm:h-24 h-16 sm:h-16"} ${isScrolled && !isMobileMenuOpen ? "h-16" : ""}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="flex items-center justify-between w-full h-16">
        <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <Shield className="w-6 h-6" />
          </div>

          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            PhishGuard AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {["Features", "About", "Contact"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-muted-foreground hover:text-primary hover:glow transition-all"
            >
              {item}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />

          <Button 
            variant="ghost" 
            className="hidden sm:inline-flex" 
            onClick={() => window.location.href = '/login'}
          >
            Login
          </Button>

          <Button 
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-full px-6 hidden sm:inline-flex"
            onClick={() => window.location.href = '/signup'}
          >
            Get Started
          </Button>
          
          <button 
            className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-accent text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden flex flex-col gap-4 pt-4 pb-2 w-full"
        >
          <nav className="flex flex-col gap-4 text-sm font-medium">
            {["Features", "About", "Contact"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-muted-foreground hover:text-primary transition-all px-2 py-1"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              <Button 
                variant="outline" 
                className="w-full justify-center" 
                onClick={() => window.location.href = '/login'}
              >
                Login
              </Button>
              <Button 
                className="w-full justify-center bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = '/signup'}
              >
                Get Started
              </Button>
            </div>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
}