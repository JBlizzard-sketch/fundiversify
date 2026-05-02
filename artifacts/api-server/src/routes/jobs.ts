import { Router, type IRouter } from "express";
import { db, jobsTable, quotesTable, reviewsTable, disputesTable } from "@workspace/db";
import { eq, and, ilike, desc, count, sql } from "drizzle-orm";
import {
  ListJobsQueryParams,
  CreateJobBody,
  GetJobParams,
  UpdateJobParams,
  UpdateJobBody,
  GetJobsSummaryQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/jobs/summary", async (req, res): Promise<void> => {
  const parsed = GetJobsSummaryQueryParams.safeParse(req.query);

  let allJobs;
  if (parsed.success && parsed.data.homeownerId) {
    allJobs = await db.select().from(jobsTable).where(eq(jobsTable.homeownerId, parsed.data.homeownerId));
  } else {
    allJobs = await db.select().from(jobsTable);
  }

  const summary = {
    open: allJobs.filter(j => j.status === "open").length,
    quoted: allJobs.filter(j => j.status === "quoted").length,
    inProgress: allJobs.filter(j => j.status === "in_progress").length,
    completed: allJobs.filter(j => j.status === "completed").length,
    disputed: allJobs.filter(j => j.status === "disputed").length,
    recentJobs: allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
  };

  res.json(summary);
});

router.get("/jobs", async (req, res): Promise<void> => {
  const parsed = ListJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { trade, location, status, homeownerId, limit, offset } = parsed.data;

  let query = db.select().from(jobsTable);
  const conditions = [];
  if (trade) conditions.push(ilike(jobsTable.trade, `%${trade}%`));
  if (location) conditions.push(ilike(jobsTable.location, `%${location}%`));
  if (status) conditions.push(eq(jobsTable.status, status));
  if (homeownerId) conditions.push(eq(jobsTable.homeownerId, homeownerId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [jobs, [{ total }]] = await Promise.all([
    db.select().from(jobsTable).where(where).orderBy(desc(jobsTable.createdAt)).limit(limit).offset(offset),
    db.select({ total: count() }).from(jobsTable).where(where),
  ]);

  res.json({ jobs, total });
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db.insert(jobsTable).values({
    ...parsed.data,
    status: "open",
    quoteCount: 0,
  }).returning();

  res.status(201).json(job);
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const [quotes, [review], [dispute]] = await Promise.all([
    db.select().from(quotesTable).where(eq(quotesTable.jobId, params.data.id)).orderBy(desc(quotesTable.createdAt)),
    db.select().from(reviewsTable).where(eq(reviewsTable.jobId, params.data.id)),
    db.select().from(disputesTable).where(eq(disputesTable.jobId, params.data.id)),
  ]);

  res.json({ ...job, quotes, review: review ?? null, dispute: dispute ?? null });
});

router.patch("/jobs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db.update(jobsTable)
    .set(parsed.data)
    .where(eq(jobsTable.id, params.data.id))
    .returning();

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(job);
});

export default router;
