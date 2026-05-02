import { Router, type IRouter } from "express";
import { db, quotesTable, jobsTable, contractorsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateQuoteBody,
  GetJobQuotesParams,
  UpdateQuoteParams,
  UpdateQuoteBody,
} from "@workspace/api-zod";
import { notify } from "../lib/notify";

const router: IRouter = Router();

router.post("/quotes", async (req, res): Promise<void> => {
  const parsed = CreateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contractor] = await db.select().from(contractorsTable).where(eq(contractorsTable.id, parsed.data.contractorId));
  
  const [quote] = await db.insert(quotesTable).values({
    ...parsed.data,
    contractorName: contractor?.name ?? "Unknown",
    contractorRating: contractor?.rating ?? 0,
    contractorAvatarUrl: contractor?.avatarUrl ?? null,
    contractorTier: contractor?.subscriptionTier ?? "free",
    status: "pending",
  }).returning();

  const [{ quoteCount }] = await db.select({ quoteCount: count() }).from(quotesTable).where(eq(quotesTable.jobId, parsed.data.jobId));
  const [job] = await db.update(jobsTable).set({ quoteCount, status: "quoted" }).where(eq(jobsTable.id, parsed.data.jobId)).returning();

  // Notify homeowner about new quote
  if (job) {
    await notify({
      userId: job.homeownerId,
      userRole: "homeowner",
      type: "new_quote",
      title: "New quote received",
      message: `${contractor?.name ?? "A contractor"} submitted a quote of KES ${parsed.data.amount.toLocaleString()} for "${job.title}"`,
      jobId: job.id,
    });
  }

  res.status(201).json(quote);
});

router.get("/quotes/job/:jobId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;
  const params = GetJobQuotesParams.safeParse({ jobId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const quotes = await db.select().from(quotesTable).where(eq(quotesTable.jobId, params.data.jobId));
  res.json(quotes);
});

router.patch("/quotes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateQuoteParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateQuoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [quote] = await db.update(quotesTable)
    .set(parsed.data)
    .where(eq(quotesTable.id, params.data.id))
    .returning();

  if (!quote) {
    res.status(404).json({ error: "Quote not found" });
    return;
  }

  if (parsed.data.status === "accepted") {
    const [job] = await db.update(jobsTable).set({ status: "in_progress" }).where(eq(jobsTable.id, quote.jobId)).returning();

    // Notify contractor their quote was accepted
    await notify({
      userId: quote.contractorId,
      userRole: "contractor",
      type: "quote_accepted",
      title: "Quote accepted!",
      message: `Your quote of KES ${quote.amount.toLocaleString()} for "${job?.title ?? `Job #${quote.jobId}`}" was accepted. The job is now in progress.`,
      jobId: quote.jobId,
    });

    // Notify homeowner job is starting
    if (job) {
      await notify({
        userId: job.homeownerId,
        userRole: "homeowner",
        type: "job_started",
        title: "Job started",
        message: `${quote.contractorName} has been hired for "${job.title}". Job is now in progress.`,
        jobId: job.id,
      });
    }
  }

  res.json(quote);
});

export default router;
