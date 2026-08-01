"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "PhishGuard AI caught a zero-day spoofing attack that bypassed our primary secure email gateway. It's now a core part of our SOC.",
    author: "Sarah Jenkins",
    role: "CISO at TechFlow",
    initials: "SJ",
    color: "bg-blue-500"
  },
  {
    quote: "The explainable AI breakdown makes it incredibly easy for our junior analysts to understand the anatomy of complex quishing attacks.",
    author: "David Chen",
    role: "Head of Security Operations",
    initials: "DC",
    color: "bg-purple-500"
  },
  {
    quote: "Sub-second analysis on malicious PDFs and Excel macros. We've automated 90% of our user-reported phishing queue.",
    author: "Elena Rodriguez",
    role: "SecOps Lead",
    initials: "ER",
    color: "bg-orange-500"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-24 relative z-10 bg-background/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Trusted by Security Teams</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            See how modern SOCs are leveraging PhishGuard AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i} 
              className="glass-card p-8 flex flex-col justify-between"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
            >
              <p className="text-muted-foreground leading-relaxed italic mb-8">
                &quot;{t.quote}&quot;
              </p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {t.initials}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{t.author}</h4>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

