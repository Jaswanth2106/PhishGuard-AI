"use client";

import { motion } from "framer-motion";
import { MailPlus, Brain, ShieldAlert, FileSearch } from "lucide-react";

const steps = [
  { icon: MailPlus, title: "Paste Email", desc: "Upload EML, screenshot, or paste raw headers." },
  { icon: Brain, title: "AI Analysis", desc: "Deep neural networks scan for anomalies." },
  { icon: ShieldAlert, title: "Threat Intelligence", desc: "Real-time lookups against global threat databases." },
  { icon: FileSearch, title: "Security Report", desc: "Detailed explainable breakdown of the risk." }
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative z-10 bg-background/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From upload to intelligence in under 2 seconds.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-border/50 -translate-y-1/2 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
            {steps.map((step, i) => (
              <motion.div 
                key={i} 
                className="flex flex-col items-center text-center group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
              >
                <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.5)]">
                  <step.icon className="w-8 h-8 text-primary" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
