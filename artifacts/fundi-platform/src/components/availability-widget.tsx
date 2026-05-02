import { useState, useEffect } from "react";
import { Clock, CheckCircle } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type Day = typeof DAYS[number];

const STORAGE_KEY = "fv_availability_v1";

function loadAvailability(): Set<Day> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as Day[]);
  } catch {}
  return new Set(["Mon", "Tue", "Wed", "Thu", "Fri"] as Day[]);
}

function saveAvailability(days: Set<Day>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...days]));
}

interface AvailabilityWidgetProps {
  readOnly?: boolean;
  compact?: boolean;
}

export function AvailabilityWidget({ readOnly = false, compact = false }: AvailabilityWidgetProps) {
  const [available, setAvailable] = useState<Set<Day>>(new Set());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAvailable(loadAvailability());
  }, []);

  function toggle(day: Day) {
    if (readOnly) return;
    setAvailable((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
    setSaved(false);
  }

  function save() {
    saveAvailability(available);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const availableList = DAYS.filter((d) => available.has(d));
  const isAvailableToday = available.has(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        {availableList.length === 0 ? (
          <span className="text-xs text-muted-foreground">Not available this week</span>
        ) : availableList.length === 7 ? (
          <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Available all week</span>
        ) : (
          <div className="flex gap-1 flex-wrap">
            {DAYS.map((d) => (
              <span
                key={d}
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${available.has(d) ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground border border-border opacity-40"}`}
              >
                {d}
              </span>
            ))}
          </div>
        )}
        {isAvailableToday && (
          <span className="text-xs text-green-700 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Available today
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Weekly availability</span>
        {isAvailableToday && (
          <span className="text-xs text-green-700 font-medium flex items-center gap-1 ml-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Available today
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {DAYS.map((day) => {
          const on = available.has(day);
          return (
            <button
              key={day}
              onClick={() => toggle(day)}
              disabled={readOnly}
              className={`h-9 w-12 rounded-lg text-xs font-semibold border transition-all ${on ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background text-muted-foreground border-border hover:border-primary/50"} ${readOnly ? "cursor-default" : "cursor-pointer"}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {!readOnly && (
        <button
          onClick={save}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${saved ? "text-green-700 border-green-300 bg-green-50" : "text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}
        >
          {saved ? <><CheckCircle className="h-3.5 w-3.5" />Saved!</> : "Save availability"}
        </button>
      )}

      {available.size === 0 && (
        <p className="text-xs text-amber-600 mt-2">
          ⚠️ You appear unavailable all week. Homeowners may skip your profile.
        </p>
      )}
    </div>
  );
}
