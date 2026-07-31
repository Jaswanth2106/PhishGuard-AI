"use client";

import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  Lightbulb, 
  Paperclip, 
  QrCode, 
  Code, 
  Link2, 
  UserX, 
  ShieldCheck, 
  FileText, 
  MessageSquareWarning 
} from "lucide-react";

const features = [
  { icon: BrainCircuit, title: "AI Threat Detection", desc: "Military-grade ML models to spot zero-day attacks." },
  { icon: Lightbulb, title: "Explainable AI", desc: "Understand exactly why an email was flagged." },
  { icon: Paperclip, title: "Attachment Scanner", desc: "Deep malware inspection inside PDFs, ZIPs, and Office docs." },
  { icon: QrCode, title: "QR Scanner", desc: "Detect malicious Quishing (QR Phishing) payloads." },
  { icon: Code, title: "Header Analysis", desc: "Examine SPF, DKIM, DMARC and routing anomalies." },
  { icon: Link2, title: "URL Inspection", desc: "Real-time sandbox rendering for embedded links." },
  { icon: UserX, title: "Brand Impersonation Detection", desc: "Stop lookalike domains and spoofed sender profiles." },
  { icon: ShieldCheck, title: "Privacy Mode", desc: "Anonymizes PII before scanning contents." },
  { icon: FileText, title: "PDF Reports", desc: "Generate compliance-ready threat intelligence reports." },
  { icon: MessageSquareWarning, title: "AI Security Chat", desc: "Interact with our SOC AI to investigate threats." },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80 } }
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Enterprise Security Suite</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything your SOC needs to intercept and analyze email threats automatically.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feat, i) => (
            <motion.div 
              key={i} 
              variants={item}
              className="glass-card p-6 flex flex-col group hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.3)] hover:border-primary/50"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feat.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
