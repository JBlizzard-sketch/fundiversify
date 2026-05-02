import { useState, useEffect } from "react";
import { Clock, CheckCircle, Sun, Sunset, Moon } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = typeof DAYS[number];
type Slot = "morning" | "afternoon" | "evening";

const SLOTS: { key: Slot; label: string; sub: string; icon: React.ElementType }[] = [
  { key: "morning",   label: "Morning",   sub: "6am–12pm",  icon: Sun     },
  { key: "afternoon", label: "Afternoon", sub: "12pm–6pm",  icon: Sunset  },
  { key: "evening",   label: "Evening",   sub: "6pm–10pm",  icon: Moon    },
];

type AvailMap = Record<Day, Set<Slot>>;

const STORAGE_KEY = "fv_availability_v2";

function loadAvailability(): AvailMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      const result: AvailMap = {} as AvailMap;
      DAYS.forEach((d) => { result[d] = new Set((parsed[d] ?? []) as Slot[]); });
      return result;
    }
  } catch {}
  const def: AvailMap = {} as AvailMap;
  DAYS.forEach((d) => {
    def[d] = new Set<Slot>(["Mon","Tue","Wed","Thu","Fri"].includes(d) ? ["morning","afternoon"] : []);
  });
  return def;
}

function saveAvailability(avail: AvailMap) {
  const out: Record<string, string[]> = {};
  DAYS.forEach((d) => { out[d] = [...avail[d]]; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
}

function hasAny(avail: AvailMap, day: Day) { return avail[day].size > 0; }

interface AvailabilityWidgetProps {
  readOnly?: boolean;
  compact?: boolean;
}

export function AvailabilityWidget({ readOnly = false, compact = false }: AvailabilityWidgetProps) {
  const [avail, setAvail] = useState<AvailMap>(() => {
    const def: AvailMap = {} as AvailMap;
    DAYS.forEach((d) => { def[d] = new Set<Slot>(); });
    return def;
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAvail(loadAvailability());
  }, []);

  function toggle(day: Day, slot: Slot) {
    if (readOnly) return;
    setAvail((prev) => {
      const next: AvailMap = {} as AvailMap;
      DAYS.forEach((d) => { next[d] = new Set(prev[d]); });
      if (next[day].has(slot)) next[day].delete(slot);
      else next[day].add(slot);
      return next;
    });
    setSaved(false);
  }

  function setDay(day: Day, on: boolean) {
    if (readOnly) return;
    setAvail((prev) => {
      const next: AvailMap = {} as AvailMap;
      DAYS.forEach((d) => { next[d] = new Set(prev[d]); });
      next[day] = on ? new Set<Slot>(["morning","afternoon"]) : new Set<Slot>();
      return next;
    });
    setSaved(false);
  }

  function save() {
    saveAvailability(avail);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const todayIdx = new Date().getDay();
  const todayDay = DAYS[todayIdx === 0 ? 6 : todayIdx - 1];
  const isAvailableToday = avail[todayDay]?.size > 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex gap-1 flex-wrap">
          {DAYS.map((d) => (
            <span
              key={d}
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${hasAny(avail, d) ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground border border-border opacity-40"}`}
            >
              {d}
            </span>
          ))}
        </div>
        {isAvailableToday && (
          <span className="text-xs text-green-700 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Available today
          </span>
        )}
      </div>
    );
  }

  const totalSlots = DAYS.reduce((s, d) => s + avail[d].size, 0);
  const busyDays = DAYS.filter((d) => !hasAny(avail, d));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Weekly availability</span>
          {isAvailableToday && (
            <span className="text-xs text-green-700 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
              Available today
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{totalSlots} slot{totalSlots !== 1 ? "s" : ""} set</span>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse text-xs min-w-[400px]">
          <thead>
            <tr>
              <th className="w-20 text-left pb-2 pr-2 text-muted-foreground font-medium">Slot</th>
              {DAYS.map((d) => (
                <th key={d} className="pb-2 px-0.5 text-center">
                  <button
                    disabled={readOnly}
                    onClick={() => setDay(d, !hasAny(avail, d))}
                    className={`w-full py-1 rounded-md font-semibold transition-all ${
                      hasAny(avail, d)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-primary/10"
                    } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {d}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map(({ key, label, sub, icon: Icon }) => (
              <tr key={key}>
                <td className="pr-2 py-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground leading-tight">{label}</p>
                      <p className="text-[10px] leading-tight">{sub}</p>
                    </div>
                  </div>
                </td>
                {DAYS.map((d) => {
                  const on = avail[d].has(key);
                  return (
                    <td key={d} className="px-0.5 py-1 text-center">
                      <button
                        disabled={readOnly}
                        onClick={() => toggle(d, key)}
                        className={`w-full h-8 rounded-md border transition-all ${
                          on
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-muted/40 border-border/50 text-muted-foreground/30 hover:border-primary/30 hover:bg-primary/5"
                        } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                        title={on ? `Remove ${label} on ${d}` : `Add ${label} on ${d}`}
                      >
                        {on ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        {busyDays.length > 0 && !readOnly && (
          <p className="text-xs text-amber-600">
            Not available: {busyDays.join(", ")}
          </p>
        )}
        {busyDays.length === 0 && (
          <p className="text-xs text-green-600 font-medium">Available all 7 days</p>
        )}
        {!readOnly && (
          <button
            onClick={save}
            className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ml-auto ${
              saved
                ? "text-green-700 border-green-300 bg-green-50"
                : "text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {saved ? <><CheckCircle className="h-3.5 w-3.5" />Saved!</> : "Save schedule"}
          </button>
        )}
      </div>
    </div>
  );
}
