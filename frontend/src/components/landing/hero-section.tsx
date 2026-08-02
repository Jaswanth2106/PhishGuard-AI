"use client";

import { motion } from "framer-motion";
import { Play, ShieldAlert, AlertTriangle, LinkIcon, FileBadge, CheckCircle, Fingerprint } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const panelVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.3 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 z-10">
      
      {/* Left Content */}
      <motion.div 
        className="flex-1 text-center lg:text-left space-y-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium shadow-[0_0_15px_rgba(var(--primary),0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Next-Gen AI Threat Intelligence
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
          Understand Every Email <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Before You Trust It.
          </span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
          PhishGuard AI analyzes emails, URLs, headers, QR codes and attachments using explainable AI. Protect your SOC with military-grade precision.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
          <Button 
            size="lg" 
            className="h-14 px-8 text-base bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 rounded-full w-full sm:w-auto"
            onClick={() => router.push('/signup')}
          >
            Start Free Analysis
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-14 px-8 text-base glass hover:bg-white/5 rounded-full w-full sm:w-auto border-border/50 group"
            onClick={() => {
              const el = document.getElementById('how-it-works');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Play className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
            How It Works
          </Button>
        </div>
      </motion.div>

      {/* Right Content - Live Threat Panel */}
      <motion.div 
        className="flex-1 w-full max-w-lg"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="glass-card p-6 border-primary/20 shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-orange-500 to-green-500" />
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Live Threat Analysis
            </h3>
            <span className="animate-pulse text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded">SCANNING</span>
          </div>

          <div className="space-y-4">
            {/* Risk Score */}
            <motion.div variants={itemVariants} className="bg-background/50 rounded-xl p-4 border border-border/50">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-muted-foreground font-medium">Threat Score</span>
                <span className="text-3xl font-bold text-destructive">87<span className="text-base text-muted-foreground">/100</span></span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-500 to-destructive"
                  initial={{ width: 0 }}
                  animate={{ width: "87%" }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div variants={itemVariants} className="bg-background/50 rounded-xl p-3 border border-border/50 flex flex-col gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Risk Level</span>
                <span className="font-semibold text-orange-500">Critical</span>
              </motion.div>
              
              <motion.div variants={itemVariants} className="bg-background/50 rounded-xl p-3 border border-border/50 flex flex-col gap-1">
                <Fingerprint className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Confidence</span>
                <span className="font-semibold text-blue-400">99.2%</span>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LinkIcon className="w-4 h-4" /> Suspicious Links
                </div>
                <span className="font-semibold text-destructive">2 Detected</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileBadge className="w-4 h-4" /> Attachment Status
                </div>
                <span className="font-semibold text-orange-500">Malware Payload</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4" /> Sender Reputation
                </div>
                <span className="font-semibold text-green-500">Spoofed Domain</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

    </section>
  );
}
