import { Router, type IRouter } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const userId = parseInt(req.query.userId as string, 10);
  const userRole = req.query.userRole as string;
  const unreadOnly = req.query.unreadOnly === "true";

  if (isNaN(userId) || !userRole) {
    res.status(400).json({ error: "userId and userRole are required" });
    return;
  }

  const conditions = [
    eq(notificationsTable.userId, userId),
    eq(notificationsTable.userRole, userRole),
  ];
  if (unreadOnly) conditions.push(eq(notificationsTable.read, false));

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(and(...conditions))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(30);

  res.json(notifications);
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [notification] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!notification) { res.status(404).json({ error: "Not found" }); return; }
  res.json(notification);
});

router.post("/notifications/mark-all-read", async (req, res): Promise<void> => {
  const { userId, userRole } = req.body ?? {};
  if (!userId || !userRole) {
    res.status(400).json({ error: "userId and userRole are required" });
    return;
  }

  const updated = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(
      eq(notificationsTable.userId, userId),
      eq(notificationsTable.userRole, userRole),
      eq(notificationsTable.read, false),
    ))
    .returning();

  res.json({ updated: updated.length });
});

export default router;
