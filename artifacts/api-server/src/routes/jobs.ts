import { Router, type IRouter } from "express";
import { db, jobsTable, quotesTable, reviewsTable, disputesTable, contractorsTable } from "@workspace/db";
import { eq, and, ilike, desc, count, sql } from "drizzle-orm";
import {
  ListJobsQueryParams,
  CreateJobBody,
  GetJobParams,
  UpdateJobParams,
  UpdateJobBody,
  GetJobsSummaryQueryParams,
  ConfirmJobParams,
  ConfirmJobBody,
} from "@workspace/api-zod";
import { notify } from "../lib/notify";

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

// Job matches for a contractor — must come before /jobs/:id
router.get("/jobs/matches", async (req, res): Promise<void> => {
  const contractorId = parseInt(req.query.contractorId as string, 10);
  const limit = parseInt(req.query.limit as string, 10) || 10;

  if (isNaN(contractorId)) {
    res.status(400).json({ error: "contractorId is required" });
    return;
  }

  const [contractor] = await db.select().from(contractorsTable).where(eq(contractorsTable.id, contractorId));
  if (!contractor) {
    res.status(404).json({ error: "Contractor not found" });
    return;
  }

  const conditions = [eq(jobsTable.status, "open")];
  if (contractor.trade) conditions.push(ilike(jobsTable.trade, `%${contractor.trade}%`));

  const jobs = await db.select().from(jobsTable)
    .where(and(...conditions))
    .orderBy(desc(jobsTable.createdAt))
    .limit(limit);

  res.json(jobs);
});

router.get("/jobs", async (req, res): Promise<void> => {
  const parsed = ListJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { trade, location, status, homeownerId, limit, offset } = parsed.data;

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

router.post("/jobs/:id/confirm", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ConfirmJobParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ConfirmJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [current] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!current) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  const update: Record<string, boolean | string> = {};
  if (parsed.data.role === "homeowner") {
    update.homeownerConfirmed = true;
  } else {
    update.contractorConfirmed = true;
  }

  const bothConfirmed =
    (parsed.data.role === "homeowner" ? true : current.homeownerConfirmed) &&
    (parsed.data.role === "contractor" ? true : current.contractorConfirmed);

  if (bothConfirmed) {
    update.status = "completed";
  }

  const [job] = await db.update(jobsTable)
    .set(update)
    .where(eq(jobsTable.id, params.data.id))
    .returning();

  // Notify the other party that this party confirmed
  if (parsed.data.role === "homeowner") {
    // Find the accepted contractor to notify
    const [acceptedQuote] = await db.select().from(quotesTable)
      .where(and(eq(quotesTable.jobId, job.id), eq(quotesTable.status, "accepted")));
    if (acceptedQuote) {
      await notify({
        userId: acceptedQuote.contractorId,
        userRole: "contractor",
        type: "homeowner_confirmed",
        title: "Homeowner confirmed completion",
        message: `The homeowner confirmed "${job.title}" is complete. Confirm from your side to finalise.`,
        jobId: job.id,
      });
    }
  } else {
    await notify({
      userId: job.homeownerId,
      userRole: "homeowner",
      type: "contractor_confirmed",
      title: "Contractor confirmed completion",
      message: `The contractor confirmed "${job.title}" is complete. Confirm from your side to finalise.`,
      jobId: job.id,
    });
  }

  // If both confirmed, notify both to leave/expect a review
  if (bothConfirmed) {
    await notify({
      userId: job.homeownerId,
      userRole: "homeowner",
      type: "job_completed",
      title: "Job completed — share your experience",
      message: `"${job.title}" is now marked complete. Leave a review to help others find great pros.`,
      jobId: job.id,
    });

    const [acceptedQuote] = await db.select().from(quotesTable)
      .where(and(eq(quotesTable.jobId, job.id), eq(quotesTable.status, "accepted")));
    if (acceptedQuote) {
      await notify({
        userId: acceptedQuote.contractorId,
        userRole: "contractor",
        type: "job_completed",
        title: "Job completed!",
        message: `"${job.title}" has been marked complete by both parties. A review may be posted by the homeowner.`,
        jobId: job.id,
      });
    }
  }

  res.json(job);
});

export default router;
