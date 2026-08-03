"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Particle = {
  x: number;
  y: number;
  opacity: number;
  travelY: number;
  duration: number;
};

function seededValue(index: number, salt: number) {
  const value = Math.sin(index * 91.7 + salt * 37.1) * 10000;
  return value - Math.floor(value);
}

const particles: Particle[] = Array.from({ length: 40 }, (_, index) => ({
  x: seededValue(index + 1, 1) * 1000,
  y: seededValue(index + 1, 2) * 800,
  opacity: seededValue(index + 1, 3) * 0.25 + 0.1,
  travelY: seededValue(index + 1, 4) * -500,
  duration: seededValue(index + 1, 5) * 10 + 10,
}));

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none bg-background">
      {/* Soft Blur Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full mix-blend-screen opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen opacity-40" />
      
      {/* Glowing Grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      {/* Moving Particles */}
      {mounted && particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_2px_rgba(var(--primary),0.3)]"
          initial={{
            x: particle.x,
            y: particle.y,
            opacity: particle.opacity * 0.5,
          }}
          animate={{
            y: [null, particle.travelY],
            opacity: [null, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
