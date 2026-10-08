import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  speed: number;
  drift: number;
}

export const ParticleBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = useMemo<Particle[]>(() => {
    const colors = [
      "rgba(134, 188, 37, OPACITY)",   // Deloitte green
      "rgba(100, 160, 30, OPACITY)",   // dark green
      "rgba(180, 210, 80, OPACITY)",   // light green
    ];
    return Array.from({ length: 80 }, () => {
      const colorBase = colors[Math.floor(Math.random() * colors.length)];
      const opacity = (Math.random() * 0.4 + 0.1).toFixed(2);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 4 + 1,
        opacity: Number(opacity),
        color: colorBase.replace("OPACITY", opacity),
        speed: Math.random() * 1.5 + 0.3,
        drift: (Math.random() - 0.5) * 0.5,
      };
    });
  }, [width, height]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "linear-gradient(135deg, #050a04 0%, #0a1508 40%, #081206 100%)",
      }}
    >
      {/* Radial glow effects */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "10%",
          width: "60%",
          height: "80%",
          background:
            "radial-gradient(ellipse at center, rgba(134,188,37,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "5%",
          width: "50%",
          height: "60%",
          background:
            "radial-gradient(ellipse at center, rgba(100,160,30,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => {
        const yPos = (p.y - frame * p.speed) % height;
        const wrappedY = yPos < -10 ? height + yPos : yPos;
        const xPos = p.x + Math.sin(frame * 0.02 + i) * p.drift;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: xPos,
              top: wrappedY,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        );
      })}
    </div>
  );
};
