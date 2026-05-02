import { Router, type IRouter } from "express";
import { db, disputesTable, jobsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListDisputesQueryParams,
  CreateDisputeBody,
  UpdateDisputeParams,
  UpdateDisputeBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/disputes", async (req, res): Promise<void> => {
  const parsed = ListDisputesQueryParams.safeParse(req.query);
  
  let disputes;
  if (parsed.success && parsed.data.status) {
    disputes = await db.select().from(disputesTable).where(eq(disputesTable.status, parsed.data.status)).orderBy(desc(disputesTable.createdAt));
  } else {
    disputes = await db.select().from(disputesTable).orderBy(desc(disputesTable.createdAt));
  }

  res.json(disputes);
});

router.post("/disputes", async (req, res): Promise<void> => {
  const parsed = CreateDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, parsed.data.jobId));

  const [dispute] = await db.insert(disputesTable).values({
    ...parsed.data,
    jobTitle: job?.title ?? null,
    status: "open",
  }).returning();

  await db.update(jobsTable).set({ status: "disputed" }).where(eq(jobsTable.id, parsed.data.jobId));

  res.status(201).json(dispute);
});

router.patch("/disputes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateDisputeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [dispute] = await db.update(disputesTable)
    .set(parsed.data)
    .where(eq(disputesTable.id, params.data.id))
    .returning();

  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  res.json(dispute);
});

export default router;
