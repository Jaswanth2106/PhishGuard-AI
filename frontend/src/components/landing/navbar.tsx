"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Navbar() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 transition-all duration-300 ${
        isScrolled
          ? "h-16 glass mx-4 mt-4 rounded-2xl border border-border/50 shadow-xl"
          : "h-24 bg-transparent mx-0 mt-0 border-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(var(--primary),0.5)]">
          <Shield className="w-6 h-6" />
        </div>

        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          PhishGuard AI
        </span>
      </div>

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

        <Link
          href="/login"
          className="hidden sm:block text-sm font-medium hover:text-primary transition-colors"
        >
          Login
        </Link>

        <Link href="/signup">
          <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-full px-6">
            Get Started
          </Button>
        </Link>
      </div>
    </motion.header>
  );
}