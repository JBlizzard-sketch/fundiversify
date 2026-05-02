import { Router, type IRouter } from "express";
import { GetJobEstimateQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const ESTIMATES: Record<string, { minKes: number; maxKes: number; typicalDays: number; note: string; factors: string[] }> = {
  plumbing: {
    minKes: 2000, maxKes: 25000, typicalDays: 1,
    note: "Price varies significantly with pipe type, accessibility, and whether parts are needed.",
    factors: ["Pipe material (PVC vs copper)", "Water pressure issues", "Number of fixtures", "Emergency vs scheduled"],
  },
  electrical: {
    minKes: 3000, maxKes: 60000, typicalDays: 2,
    note: "Electrical work requires a licensed electrician. Panel upgrades and rewiring cost more.",
    factors: ["Number of sockets/switches", "Panel upgrade needed", "Outdoor vs indoor wiring", "Safety certification"],
  },
  painting: {
    minKes: 8000, maxKes: 80000, typicalDays: 3,
    note: "Calculated per square metre. Surface preparation and number of coats affect price.",
    factors: ["Square metres", "Wall condition (prep needed)", "Number of coats", "Paint quality specified"],
  },
  tiling: {
    minKes: 10000, maxKes: 90000, typicalDays: 3,
    note: "Price includes labour only. Tiles and adhesive are additional unless specified.",
    factors: ["Area in sqm", "Tile size and pattern complexity", "Surface levelling needed", "Grouting type"],
  },
  roofing: {
    minKes: 30000, maxKes: 500000, typicalDays: 5,
    note: "Roofing prices vary enormously based on material, roof area, and roof pitch.",
    factors: ["Roof area", "Material (iron sheets vs tiles)", "Replacement vs repair", "Roof pitch and accessibility"],
  },
  carpentry: {
    minKes: 5000, maxKes: 120000, typicalDays: 3,
    note: "Custom furniture and built-ins take longer and cost more than repairs.",
    factors: ["Custom vs standard", "Wood type", "Finishing required", "Number of pieces"],
  },
  masonry: {
    minKes: 15000, maxKes: 200000, typicalDays: 7,
    note: "Foundation work, walling, and plastering prices differ significantly.",
    factors: ["Area/linear metres", "Block type", "Foundation depth", "Plastering included"],
  },
  fundi: {
    minKes: 1500, maxKes: 15000, typicalDays: 1,
    note: "General handyman tasks. Rates are daily (Ksh 1,500–3,000/day) plus materials.",
    factors: ["Number of tasks", "Tools required", "Materials cost", "Half day vs full day"],
  },
  hvac: {
    minKes: 8000, maxKes: 40000, typicalDays: 1,
    note: "Aircon installation, servicing, and gas recharge prices vary by unit size.",
    factors: ["Unit capacity (BTU)", "Installation vs service", "Number of units", "Gas recharge needed"],
  },
  welding: {
    minKes: 5000, maxKes: 60000, typicalDays: 2,
    note: "Gates, grilles, and structural welding. Price includes labour, materials extra.",
    factors: ["Size and complexity", "Material thickness", "Gate vs window grilles", "Powder coating"],
  },
};

router.get("/estimate", async (req, res): Promise<void> => {
  const parsed = GetJobEstimateQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { trade, size, location } = parsed.data;
  const tradeKey = trade.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "");
  
  const base = ESTIMATES[tradeKey] ?? ESTIMATES["fundi"];

  let minKes = base.minKes;
  let maxKes = base.maxKes;

  if (size) {
    const sqm = parseFloat(size);
    if (!isNaN(sqm) && sqm > 0) {
      const perSqm = { painting: 400, tiling: 500, masonry: 800 };
      const rate = perSqm[tradeKey as keyof typeof perSqm];
      if (rate) {
        minKes = Math.max(base.minKes, sqm * rate * 0.8);
        maxKes = Math.max(base.maxKes, sqm * rate * 1.3);
      }
    }
  }

  if (location) {
    const premiumAreas = ["karen", "runda", "muthaiga", "lavington", "westlands", "kilimani"];
    const isPremium = premiumAreas.some(a => location.toLowerCase().includes(a));
    if (isPremium) {
      minKes = minKes * 1.15;
      maxKes = maxKes * 1.25;
    }
  }

  res.json({
    trade,
    minKes: Math.round(minKes),
    maxKes: Math.round(maxKes),
    typicalDays: base.typicalDays,
    note: base.note,
    factors: base.factors,
  });
});

export default router;
