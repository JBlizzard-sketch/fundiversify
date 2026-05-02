import { db, notificationsTable } from "@workspace/db";

export async function notify(params: {
  userId: number;
  userRole: string;
  type: string;
  title: string;
  message: string;
  jobId?: number;
}) {
  try {
    await db.insert(notificationsTable).values(params);
  } catch {
    // Non-critical — never fail the parent request due to notification errors
  }
}
