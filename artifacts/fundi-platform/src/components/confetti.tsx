import { useEffect, useRef } from "react";

const COLORS = [
  "#4CAF50", "#FFD700", "#FF6B35", "#2196F3", "#E91E63",
  "#9C27B0", "#00BCD4", "#FF9800", "#8BC34A", "#F44336",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "square" | "circle" | "strip";
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = Array.from({ length: 140 }, () => ({
      x: rand(0, canvas.width),
      y: rand(-120, -10),
      vx: rand(-3, 3),
      vy: rand(3, 8),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: rand(6, 14),
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-0.15, 0.15),
      opacity: 1,
      shape: (["square", "circle", "strip"] as const)[Math.floor(Math.random() * 3)],
    }));

    let startTime = performance.now();
    const DURATION = 4000;

    function draw(now: number) {
      if (!canvas || !ctx) return;
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.995;
        p.rotation += p.rotationSpeed;
        if (elapsed > DURATION * 0.6) {
          p.opacity = Math.max(0, p.opacity - 0.012);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.shape === "square") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 4, -p.size, p.size / 2, p.size * 2);
        }
        ctx.restore();
      });

      particlesRef.current = particlesRef.current.filter(
        (p) => p.y < canvas.height + 50 && p.opacity > 0
      );

      if (elapsed < DURATION + 1000 && particlesRef.current.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    animRef.current = requestAnimationFrame(draw);

    const resize = () => {
      if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    };
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[200] pointer-events-none"
      aria-hidden="true"
    />
  );
}
