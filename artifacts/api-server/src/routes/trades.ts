import { Router, type IRouter } from "express";

const router: IRouter = Router();

const TRADES = [
  { id: 1, name: "Plumbing", slug: "plumbing", icon: "droplets", contractorCount: 0 },
  { id: 2, name: "Electrical", slug: "electrical", icon: "zap", contractorCount: 0 },
  { id: 3, name: "Painting", slug: "painting", icon: "paintbrush", contractorCount: 0 },
  { id: 4, name: "Tiling", slug: "tiling", icon: "grid3x3", contractorCount: 0 },
  { id: 5, name: "Roofing", slug: "roofing", icon: "home", contractorCount: 0 },
  { id: 6, name: "Carpentry", slug: "carpentry", icon: "hammer", contractorCount: 0 },
  { id: 7, name: "Masonry", slug: "masonry", icon: "brick-wall", contractorCount: 0 },
  { id: 8, name: "Fundi (General)", slug: "fundi", icon: "wrench", contractorCount: 0 },
  { id: 9, name: "HVAC / Aircon", slug: "hvac", icon: "wind", contractorCount: 0 },
  { id: 10, name: "Welding", slug: "welding", icon: "flame", contractorCount: 0 },
];

router.get("/trades", async (req, res): Promise<void> => {
  const { db, contractorsTable } = await import("@workspace/db");
  const { sql, count } = await import("drizzle-orm");
  
  const contractorCounts = await db
    .select({ trade: contractorsTable.trade, count: count() })
    .from(contractorsTable)
    .groupBy(contractorsTable.trade);

  const countMap = new Map(contractorCounts.map((r) => [r.trade.toLowerCase(), r.count]));

  const trades = TRADES.map((t) => ({
    ...t,
    contractorCount: countMap.get(t.slug) ?? countMap.get(t.name.toLowerCase()) ?? 0,
  }));

  res.json(trades);
});

export default router;
