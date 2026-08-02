"use client";

import { motion } from "framer-motion";
import { UploadCloud, BrainCircuit, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

const steps = [
  { 
    icon: UploadCloud, 
    title: "Upload", 
    items: [
      "Paste email body",
      "Upload screenshot",
      "Upload EML (Coming Soon)"
    ]
  },
  { 
    icon: BrainCircuit, 
    title: "AI Analysis", 
    items: [
      "Machine Learning classification",
      "Gemini Vision OCR",
      "Feature extraction"
    ]
  },
  { 
    icon: ShieldCheck, 
    title: "Explain", 
    items: [
      "AI explanation",
      "Risk score",
      "Suspicious links",
      "Social engineering techniques"
    ]
  },
  { 
    icon: FileText, 
    title: "Report", 
    items: [
      "Save to History",
      "Export PDF (Coming Soon)",
      "Dashboard statistics"
    ]
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative z-10 bg-background/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From upload to intelligence in under 2 seconds.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 -translate-y-1/2 hidden md:block rounded-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, i) => (
              <motion.div 
                key={i} 
                className="flex flex-col h-full group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <div className="glass-card rounded-2xl p-6 h-full flex flex-col items-center text-center relative transition-all duration-300 group-hover:-translate-y-2 group-hover:border-primary/40 group-hover:shadow-[0_10px_40px_-10px_rgba(var(--primary),0.3)] bg-background/40 backdrop-blur-md">
                  
                  {/* Step Number Indicator */}
                  <div className="absolute -top-4 bg-background border border-border/50 text-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md z-20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    {i + 1}
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="font-bold text-xl mb-4 tracking-tight">{step.title}</h3>
                  
                  <ul className="text-sm text-muted-foreground w-full space-y-3 mt-auto text-left">
                    {step.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
