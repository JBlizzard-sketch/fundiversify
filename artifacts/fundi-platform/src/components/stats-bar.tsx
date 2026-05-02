import { useEffect, useRef, useState } from "react";
import { Shield, Star, Briefcase, TrendingUp } from "lucide-react";

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
  decimals?: number;
  color: string;
}

function useCountUp(target: number, decimals = 0, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(parseFloat(start.toFixed(decimals)));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, decimals, duration]);
  return active ? count : 0;
}

function StatCard({ icon: Icon, value, suffix, label, prefix = "", decimals = 0, color, active }: StatItem & { active: boolean }) {
  const count = useCountUp(value, decimals, 1600, active);
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-1 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-3xl font-bold tracking-tight tabular-nums">
        {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString()}{suffix}
      </p>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

interface StatsBannerProps {
  totalVerified?: number;
  averageRating?: number;
}

const STATS: Omit<StatItem, "value">[] = [
  { icon: Shield,    suffix: "+",  label: "Verified Pros",       color: "bg-primary/10 text-primary"       },
  { icon: Briefcase, suffix: "+",  label: "Jobs Completed",      color: "bg-violet-100 text-violet-600"    },
  { icon: Star,      suffix: "/5", label: "Average Rating",      prefix: "", decimals: 1, color: "bg-amber-100 text-amber-600" },
  { icon: TrendingUp,suffix: "M+", label: "KES Paid to Fundis",  prefix: "", color: "bg-green-100 text-green-600" },
];

export function StatsBanner({ totalVerified = 8, averageRating = 4.7 }: StatsBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const values = [totalVerified, 2400, averageRating, 12];

  return (
    <div ref={ref} className="w-full bg-gradient-to-r from-primary/5 via-background to-primary/5 border-y">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
          {STATS.map((stat, i) => (
            <StatCard
              key={stat.label}
              {...stat}
              value={values[i]}
              active={active}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
