import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "fv_job_alerts";

interface Alert {
  id: string;
  trade: string;
  location: string;
  createdAt: string;
}

function getAlerts(): Alert[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}
function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

const TRADES = ["Plumbing", "Electrical", "Painting", "Tiling", "Roofing", "Carpentry", "Masonry", "Fundi", "HVAC", "Welding"];
const LOCATIONS = ["Westlands", "Kilimani", "Karen", "Kasarani", "Parklands", "Lavington", "Eastleigh", "South B", "Langata", "Ruaka"];

interface JobAlertWidgetProps {
  defaultTrade?: string;
  defaultLocation?: string;
}

export function JobAlertWidget({ defaultTrade = "", defaultLocation = "" }: JobAlertWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [trade, setTrade] = useState(defaultTrade || TRADES[0]);
  const [location, setLocation] = useState(defaultLocation || LOCATIONS[0]);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setAlerts(getAlerts());
  }, []);

  function addAlert() {
    const id = `${trade}-${location}-${Date.now()}`;
    const exists = alerts.some((a) => a.trade === trade && a.location === location);
    if (exists) { setSaved(true); setTimeout(() => setSaved(false), 2000); return; }
    const newAlert: Alert = { id, trade, location, createdAt: new Date().toISOString() };
    const updated = [...alerts, newAlert];
    saveAlerts(updated);
    setAlerts(updated);
    setSaved(true);
    setExpanded(false);
    setTimeout(() => setSaved(false), 3000);
  }

  function removeAlert(id: string) {
    const updated = alerts.filter((a) => a.id !== id);
    saveAlerts(updated);
    setAlerts(updated);
  }

  return (
    <Card className="border-dashed border-2 border-amber-300/60 bg-amber-50/30">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Bell className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm flex items-center gap-2">
              Job Alerts
              {alerts.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">
                  {alerts.length} active
                </Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Get notified when new jobs match your trade and area</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            {expanded ? <X className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          </button>
        </div>

        {/* Active alerts */}
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-1.5 text-xs bg-background border rounded-full px-2.5 py-1 font-medium"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                {a.trade} · {a.location}
                <button
                  onClick={() => removeAlert(a.id)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Expanded form */}
        {expanded && (
          <div className="space-y-3 pt-2 border-t mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Trade</label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {TRADES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block font-medium">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-xs border rounded-lg px-2.5 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <Button size="sm" className="w-full gap-1.5" onClick={addAlert}>
              {saved ? <><CheckCircle className="h-3.5 w-3.5" />Alert saved!</> : <><Bell className="h-3.5 w-3.5" />Create Alert</>}
            </Button>
          </div>
        )}

        {/* Empty state prompt */}
        {!expanded && alerts.length === 0 && (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => setExpanded(true)}
          >
            <Bell className="h-3.5 w-3.5" />
            Set up a job alert
          </Button>
        )}

        {/* Saved success */}
        {saved && !expanded && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-2">
            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
            Alert active — you'll be notified of new {trade} jobs in {location}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
