import { Router } from "express";
import { db, mudraFromHelped } from "@workspace/db";
import {
  helpRequestsTable,
  helpRequestJoinsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { UpdateHelpRequestBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

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
      id: u.id, name: u.name, avatar: u.avatar ?? "", location: u.location ?? "",
      rank: u.rank, totalHelped: u.totalHelped,
      mudra: mudraFromHelped(u.totalHelped), chhava: u.chhava,
      followersCount: u.followersCount, postsCount: u.postsCount,
    } : null,
    peopleNeeded: req.peopleNeeded,
    helpersJoined: joins.map(j => j.userId),
    status: req.status,
    deadline: req.deadline ?? null,
    contactInfo: req.contactInfo ?? null,
    createdAt: req.createdAt?.toISOString() ?? new Date().toISOString(),
    approvalStatus: req.approvalStatus,
  };
}

// GET /api/help-requests
router.get("/help-requests", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const rows = await db.select().from(helpRequestsTable)
      .where(eq(helpRequestsTable.approvalStatus, "approved"))
      .orderBy(desc(helpRequestsTable.createdAt))
      .limit(limit);
    const result = await Promise.all(rows.map(buildHelpRequest));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/help-requests (auth required)
router.post("/help-requests", requireAuth, async (req, res) => {
  try {
    const [helpReq] = await db
      .insert(helpRequestsTable)
      .values({ ...req.body, requesterId: req.dbUser!.id })
      .returning();
    const result = await buildHelpRequest(helpReq);
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/help-requests (auth required) — current user's requests, all statuses
router.get("/me/help-requests", requireAuth, async (req, res) => {
  try {
    const userId = req.dbUser!.id;
    const rows = await db
      .select()
      .from(helpRequestsTable)
      .where(eq(helpRequestsTable.requesterId, userId))
      .orderBy(desc(helpRequestsTable.createdAt));
    const result = await Promise.all(rows.map(buildHelpRequest));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/help-requests/:id (public — only approved are visible)
router.get("/help-requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [hr] = await db.select().from(helpRequestsTable).where(eq(helpRequestsTable.id, id)).limit(1);
    if (!hr || hr.approvalStatus !== "approved") {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(await buildHelpRequest(hr));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/help-requests/:id (auth required, requester-only)
router.patch("/help-requests/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const userId = req.dbUser!.id;

    const [existing] = await db.select().from(helpRequestsTable).where(eq(helpRequestsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.requesterId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    const parsed = UpdateHelpRequestBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) update[k] = v;
    }
    if ("peopleNeeded" in update && (update.peopleNeeded as number) < 1) {
      res.status(400).json({ error: "peopleNeeded must be >= 1" });
      return;
    }
    if (Object.keys(update).length === 0) {
      res.json(await buildHelpRequest(existing));
      return;
    }

    const [row] = await db.update(helpRequestsTable).set(update).where(eq(helpRequestsTable.id, id)).returning();
    res.json(await buildHelpRequest(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/help-requests/:id (auth required, requester-only)
router.delete("/help-requests/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const userId = req.dbUser!.id;

    const result = await db.transaction(async (tx) => {
      const [hr] = await tx.select().from(helpRequestsTable).where(eq(helpRequestsTable.id, id)).limit(1);
      if (!hr) return { notFound: true } as const;
      if (hr.requesterId !== userId) return { forbidden: true } as const;

      await tx.delete(helpRequestJoinsTable).where(eq(helpRequestJoinsTable.helpRequestId, id));
      await tx.delete(helpRequestsTable).where(eq(helpRequestsTable.id, id));
      return { deleted: true } as const;
    });

    if ("notFound" in result) { res.status(404).json({ error: "Not found" }); return; }
    if ("forbidden" in result) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ deleted: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/help-requests/:id/join (auth required)
router.post("/help-requests/:id/join", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const userId = req.dbUser!.id;

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
