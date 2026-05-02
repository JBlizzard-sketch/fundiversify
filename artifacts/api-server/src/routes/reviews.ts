import { Router, type IRouter } from "express";
import { db, reviewsTable, contractorsTable } from "@workspace/db";
import { eq, and, avg, count, desc } from "drizzle-orm";
import {
  CreateReviewBody,
  GetContractorReviewsParams,
  GetContractorReviewsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    ...parsed.data,
    status: "approved",
  }).returning();

  const [stats] = await db
    .select({ avgRating: avg(reviewsTable.rating), reviewCount: count() })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.contractorId, parsed.data.contractorId), eq(reviewsTable.status, "approved")));

  await db.update(contractorsTable).set({
    rating: parseFloat(stats.avgRating ?? "0"),
    reviewCount: stats.reviewCount,
    jobsCompleted: stats.reviewCount,
  }).where(eq(contractorsTable.id, parsed.data.contractorId));

  res.status(201).json(review);
});

router.get("/reviews/job/:jobId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const jobId = parseInt(raw, 10);
  if (isNaN(jobId)) { res.status(400).json({ error: "Invalid jobId" }); return; }

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.jobId, jobId));
  if (!review) { res.status(404).json({ error: "No review for this job" }); return; }
  res.json(review);
});

router.get("/reviews/contractor/:contractorId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.contractorId) ? req.params.contractorId[0] : req.params.contractorId;
  const params = GetContractorReviewsParams.safeParse({ contractorId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const queryParams = GetContractorReviewsQueryParams.safeParse(req.query);
  const limit = queryParams.success ? queryParams.data.limit : 10;

  const reviews = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.contractorId, params.data.contractorId), eq(reviewsTable.status, "approved")))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(limit);

  res.json(reviews);
});

export default router;
