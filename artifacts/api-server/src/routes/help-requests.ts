import { Router } from "express";
import { db } from "@workspace/db";
import {
  helpRequestsTable,
  helpRequestJoinsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

async function buildHelpRequest(req: typeof helpRequestsTable.$inferSelect) {
  const requester = await db.select().from(usersTable).where(eq(usersTable.id, req.requesterId)).limit(1);
  const joins = await db.select().from(helpRequestJoinsTable).where(eq(helpRequestJoinsTable.helpRequestId, req.id));
  const u = requester[0];

  return {
    id: req.id,
    title: req.title,
    description: req.description,
    category: req.category,
    urgency: req.urgency,
    location: req.location,
    requesterId: req.requesterId,
    requester: u ? {
      id: u.id, name: u.name, avatar: u.avatar, location: u.location,
      rank: u.rank, totalHelped: u.totalHelped, followersCount: u.followersCount, postsCount: u.postsCount,
    } : null,
    peopleNeeded: req.peopleNeeded,
    helpersJoined: joins.map(j => j.userId),
    status: req.status,
    deadline: req.deadline ?? null,
    contactInfo: req.contactInfo ?? null,
    createdAt: req.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

// GET /api/help-requests
router.get("/help-requests", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const rows = await db.select().from(helpRequestsTable)
      .orderBy(desc(helpRequestsTable.createdAt))
      .limit(limit);
    const result = await Promise.all(rows.map(buildHelpRequest));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/help-requests
router.post("/help-requests", async (req, res) => {
  try {
    const [helpReq] = await db.insert(helpRequestsTable).values(req.body).returning();
    const result = await buildHelpRequest(helpReq);
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/help-requests/:id/join
router.post("/help-requests/:id/join", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.body.userId);
    if (!userId) { res.status(400).json({ error: "userId required" }); return; }

    const existing = await db.select().from(helpRequestJoinsTable)
      .where(sql`${helpRequestJoinsTable.helpRequestId} = ${id} AND ${helpRequestJoinsTable.userId} = ${userId}`)
      .limit(1);

    let joined: boolean;
    if (existing.length > 0) {
      await db.delete(helpRequestJoinsTable)
        .where(sql`${helpRequestJoinsTable.helpRequestId} = ${id} AND ${helpRequestJoinsTable.userId} = ${userId}`);
      joined = false;
    } else {
      await db.insert(helpRequestJoinsTable).values({ helpRequestId: id, userId }).onConflictDoNothing();
      joined = true;
    }

    const allJoins = await db.select().from(helpRequestJoinsTable).where(eq(helpRequestJoinsTable.helpRequestId, id));
    res.json({ joined, helpersJoined: allJoins.map(j => j.userId) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
