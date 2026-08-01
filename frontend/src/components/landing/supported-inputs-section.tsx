"use client";

import { motion } from "framer-motion";
import { 
  FileCode, 
  Image, 
 
  FileText, 
  FileSpreadsheet, 
  Archive, 
  Link, 
  QrCode, 
  Braces, 
  FilePlus2
} from "lucide-react";

const inputs = [
  { icon: FilePlus2, label: "Paste Email" },
  { icon: Image, label: "Upload Screenshot" },
  { icon: FileCode, label: "Upload EML" },
  { icon: FileText, label: "Upload PDF" },
  { icon: FileText, label: "Upload Word" },
  { icon: FileSpreadsheet, label: "Upload Excel" },
  { icon: Archive, label: "Upload ZIP" },
  { icon: Link, label: "Paste URL" },
  { icon: QrCode, label: "QR Code" },
  { icon: Braces, label: "Raw Headers" },
];

export function SupportedInputsSection() {
  return (
    <section className="py-24 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Any Format. Any Payload.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our engine ingests and unpacks all common attack vectors seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {inputs.map((input, i) => (
            <motion.div 
              key={i} 
              className="glass-card flex flex-col items-center justify-center p-6 text-center group cursor-pointer hover:bg-primary/5 transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <input.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-sm">{input.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


