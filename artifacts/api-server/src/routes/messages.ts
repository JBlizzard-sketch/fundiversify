import { Router, type IRouter } from "express";
import { db, messagesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { GetJobMessagesParams, SendJobMessageBody, SendJobMessageParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/jobs/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetJobMessagesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.jobId, params.data.id))
    .orderBy(asc(messagesTable.createdAt));

  res.json(messages);
});

router.post("/jobs/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SendJobMessageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SendJobMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({ jobId: params.data.id, ...parsed.data })
    .returning();

  res.status(201).json(message);
});

export default router;
