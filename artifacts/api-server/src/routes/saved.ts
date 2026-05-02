import { Router, type IRouter } from "express";
import { db, savedContractorsTable, contractorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetSavedContractorsQueryParams,
  SaveContractorBody,
  UnsaveContractorParams,
  UnsaveContractorQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/saved-contractors", async (req, res): Promise<void> => {
  const parsed = GetSavedContractorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const saved = await db.select().from(savedContractorsTable).where(eq(savedContractorsTable.homeownerId, parsed.data.homeownerId));
  const contractorIds = saved.map(s => s.contractorId);

  if (contractorIds.length === 0) {
    res.json([]);
    return;
  }

  const contractors = await Promise.all(
    contractorIds.map(id => db.select().from(contractorsTable).where(eq(contractorsTable.id, id)).then(rows => rows[0]))
  );

  res.json(contractors.filter(Boolean));
});

router.post("/saved-contractors", async (req, res): Promise<void> => {
  const parsed = SaveContractorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [saved] = await db.insert(savedContractorsTable).values(parsed.data).onConflictDoNothing().returning();

  res.status(201).json(saved ?? { ...parsed.data, id: 0, createdAt: new Date() });
});

router.delete("/saved-contractors/:contractorId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.contractorId) ? req.params.contractorId[0] : req.params.contractorId;
  const params = UnsaveContractorParams.safeParse({ contractorId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const queryParsed = UnsaveContractorQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  await db.delete(savedContractorsTable).where(
    and(
      eq(savedContractorsTable.contractorId, params.data.contractorId),
      eq(savedContractorsTable.homeownerId, queryParsed.data.homeownerId)
    )
  );

  res.sendStatus(204);
});

export default router;
