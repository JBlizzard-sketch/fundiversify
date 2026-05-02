import { Router, type IRouter } from "express";
import { db, contractorsTable, jobsTable, reviewsTable, disputesTable, quotesTable } from "@workspace/db";
import { eq, desc, count, sum, and } from "drizzle-orm";
import { GetContractorDashboardParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [contractors, jobs, reviews, disputes] = await Promise.all([
    db.select().from(contractorsTable),
    db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt)).limit(50),
    db.select({ total: count() }).from(reviewsTable),
    db.select({ total: count() }).from(disputesTable).where(eq(disputesTable.status, "open")),
  ]);

  const totalContractors = contractors.length;
  const verifiedContractors = contractors.filter(c => c.verificationStatus === "verified").length;
  const totalJobs = jobs.length;
  const completedJobs = jobs.filter(j => j.status === "completed").length;

  const tradeMap = new Map<string, number>();
  for (const j of jobs) tradeMap.set(j.trade, (tradeMap.get(j.trade) ?? 0) + 1);
  const jobsByTrade = Array.from(tradeMap.entries()).map(([trade, count]) => ({ trade, count }));

  const recentActivity = jobs.slice(0, 10).map(j => ({
    type: j.status === "completed" ? "job_completed" : "job_posted",
    message: `${j.status === "completed" ? "Job completed" : "New job posted"}: ${j.title} in ${j.location}`,
    timestamp: j.createdAt,
  }));

  res.json({
    totalContractors,
    verifiedContractors,
    totalJobs,
    completedJobs,
    totalReviews: reviews[0]?.total ?? 0,
    openDisputes: disputes[0]?.total ?? 0,
    jobsByTrade,
    recentActivity,
  });
});

router.get("/dashboard/contractor/:contractorId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.contractorId) ? req.params.contractorId[0] : req.params.contractorId;
  const params = GetContractorDashboardParams.safeParse({ contractorId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { contractorId } = params.data;

  const [contractor] = await db.select().from(contractorsTable).where(eq(contractorsTable.id, contractorId));
  if (!contractor) {
    res.status(404).json({ error: "Contractor not found" });
    return;
  }

  const allJobs = await db.select().from(jobsTable);
  const acceptedQuotes = await db.select().from(quotesTable)
    .where(and(eq(quotesTable.contractorId, contractorId), eq(quotesTable.status, "accepted")));

  const totalEarnings = acceptedQuotes.reduce((sum, q) => sum + q.amount, 0);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEarnings = acceptedQuotes
    .filter(q => new Date(q.createdAt) >= startOfMonth)
    .reduce((s, q) => s + q.amount, 0);

  const pendingQuotes = await db.select({ cnt: count() }).from(quotesTable)
    .where(and(eq(quotesTable.contractorId, contractorId), eq(quotesTable.status, "pending")));

  const months: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleString("default", { month: "short", year: "2-digit" });
    const earned = acceptedQuotes
      .filter(q => {
        const qDate = new Date(q.createdAt);
        return qDate.getFullYear() === d.getFullYear() && qDate.getMonth() === d.getMonth();
      })
      .reduce((s, q) => s + q.amount, 0);
    months.push({ month: monthLabel, amount: earned });
  }

  const recentJobs = allJobs.slice(0, 5);

  res.json({
    contractorId,
    totalEarnings,
    thisMonthEarnings,
    jobsCompleted: contractor.jobsCompleted,
    activeJobs: acceptedQuotes.filter(q => {
      const matchingJob = allJobs.find(j => j.id === q.jobId);
      return matchingJob?.status === "in_progress";
    }).length,
    pendingQuotes: pendingQuotes[0]?.cnt ?? 0,
    averageRating: contractor.rating,
    profileViews: contractor.profileViews,
    leadsReceived: await db.select({ cnt: count() }).from(quotesTable).where(eq(quotesTable.contractorId, contractorId)).then(r => r[0]?.cnt ?? 0),
    earningsByMonth: months,
    recentJobs,
  });
});

export default router;
