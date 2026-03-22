import { Router, type IRouter } from "express";
import { db, analysesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/analyses", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(analysesTable)
      .where(eq(analysesTable.userId, req.user.id))
      .orderBy(desc(analysesTable.createdAt))
      .limit(50);

    const analyses = rows.map((row) => ({
      id: row.id,
      inputMode: row.inputMode,
      createdAt: row.createdAt.toISOString(),
      result: row.result,
    }));

    res.json({ analyses });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch analysis history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
