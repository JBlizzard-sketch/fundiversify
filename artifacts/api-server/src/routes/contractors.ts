import { Router, type IRouter } from "express";
import { db, contractorsTable, reviewsTable } from "@workspace/db";
import { eq, like, ilike, and, gte, desc, count, sql } from "drizzle-orm";
import {
  ListContractorsQueryParams,
  CreateContractorBody,
  GetContractorParams,
  UpdateContractorParams,
  UpdateContractorBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/contractors", async (req, res): Promise<void> => {
  const parsed = ListContractorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { trade, location, tier, minRating, verified, search, limit, offset } = parsed.data;

  const conditions = [];
  if (trade) conditions.push(ilike(contractorsTable.trade, `%${trade}%`));
  if (location) conditions.push(ilike(contractorsTable.location, `%${location}%`));
  if (tier) conditions.push(eq(contractorsTable.subscriptionTier, tier));
  if (minRating != null) conditions.push(gte(contractorsTable.rating, minRating));
  if (verified != null) {
    conditions.push(eq(contractorsTable.verificationStatus, verified ? "verified" : "pending"));
  }
  if (search) {
    conditions.push(
      sql`(${contractorsTable.name} ILIKE ${"%" + search + "%"} OR ${contractorsTable.bio} ILIKE ${"%" + search + "%"} OR ${contractorsTable.trade} ILIKE ${"%" + search + "%"})`
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [contractors, [{ total }]] = await Promise.all([
    db.select().from(contractorsTable).where(where).orderBy(
      desc(contractorsTable.subscriptionTier),
      desc(contractorsTable.rating)
    ).limit(limit).offset(offset),
    db.select({ total: count() }).from(contractorsTable).where(where),
  ]);

  res.json({ contractors, total });
});

router.post("/contractors", async (req, res): Promise<void> => {
  const parsed = CreateContractorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contractor] = await db.insert(contractorsTable).values({
    ...parsed.data,
    verificationStatus: "pending",
    subscriptionTier: "free",
    rating: 0,
    reviewCount: 0,
    jobsCompleted: 0,
  }).returning();

  res.status(201).json(contractor);
});

router.get("/contractors/stats", async (_req, res): Promise<void> => {
  const [allContractors, topRated] = await Promise.all([
    db.select().from(contractorsTable),
    db.select().from(contractorsTable)
      .where(eq(contractorsTable.verificationStatus, "verified"))
      .orderBy(desc(contractorsTable.rating))
      .limit(5),
  ]);

  const totalVerified = allContractors.filter(c => c.verificationStatus === "verified").length;
  const totalPro = allContractors.filter(c => c.subscriptionTier === "pro").length;

  const tradeMap = new Map<string, number>();
  for (const c of allContractors) {
    tradeMap.set(c.trade, (tradeMap.get(c.trade) ?? 0) + 1);
  }
  const byTrade = Array.from(tradeMap.entries()).map(([trade, count]) => ({ trade, count }));

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = allContractors.filter(c => new Date(c.createdAt) >= startOfMonth).length;

  res.json({ totalVerified, totalPro, byTrade, topRated, newThisMonth });
});

router.get("/contractors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetContractorParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [contractor] = await db.select().from(contractorsTable).where(eq(contractorsTable.id, params.data.id));
  if (!contractor) {
    res.status(404).json({ error: "Contractor not found" });
    return;
  }

  const reviews = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.contractorId, params.data.id), eq(reviewsTable.status, "approved")))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(10);

  await db.update(contractorsTable)
    .set({ profileViews: contractor.profileViews + 1 })
    .where(eq(contractorsTable.id, contractor.id));

  res.json({ ...contractor, reviews, isSaved: false });
});

router.patch("/contractors/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateContractorParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateContractorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contractor] = await db.update(contractorsTable)
    .set(parsed.data)
    .where(eq(contractorsTable.id, params.data.id))
    .returning();

  if (!contractor) {
    res.status(404).json({ error: "Contractor not found" });
    return;
  }

  res.json(contractor);
});

export default router;
