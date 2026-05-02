import { Router } from "express";
import { db } from "@workspace/db";
import {
  eventsTable,
  eventTagsTable,
  eventRegistrationsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function buildEvent(event: typeof eventsTable.$inferSelect) {
  const organizer = await db.select().from(usersTable).where(eq(usersTable.id, event.organizerId)).limit(1);
  const tags = await db.select().from(eventTagsTable).where(eq(eventTagsTable.eventId, event.id));
  const registrations = await db.select().from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, event.id));
  const u = organizer[0];

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    category: event.category,
    date: event.date,
    time: event.time,
    location: event.location,
    address: event.address,
    organizerId: event.organizerId,
    organizer: u ? {
      id: u.id, name: u.name, avatar: u.avatar ?? "", location: u.location ?? "",
      rank: u.rank, totalHelped: u.totalHelped, followersCount: u.followersCount, postsCount: u.postsCount,
    } : null,
    volunteersNeeded: event.volunteersNeeded,
    volunteersRegistered: registrations.map(r => r.userId),
    image: event.image ?? null,
    tags: tags.map(t => t.tag),
    status: event.status,
    duration: event.duration ?? null,
    requirements: event.requirements ?? null,
    createdAt: event.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

// GET /api/events
router.get("/events", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const approvedOnly = eq(eventsTable.approvalStatus, "approved");
    const rows = status
      ? await db.select().from(eventsTable).where(and(eq(eventsTable.status, status), approvedOnly)).orderBy(desc(eventsTable.createdAt)).limit(limit)
      : await db.select().from(eventsTable).where(approvedOnly).orderBy(desc(eventsTable.createdAt)).limit(limit);

    const result = await Promise.all(rows.map(buildEvent));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/events (auth required)
router.post("/events", requireAuth, async (req, res) => {
  try {
    const { tags, ...rest } = req.body ?? {};
    const [event] = await db.insert(eventsTable).values({ ...rest, organizerId: req.dbUser!.id }).returning();

    if (tags && tags.length > 0) {
      await db.insert(eventTagsTable).values(tags.map((tag: string) => ({ eventId: event.id, tag })));
    }

    const result = await buildEvent(event);
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/events/:id
router.get("/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id)).limit(1);
    if (!event) { res.status(404).json({ error: "Not found" }); return; }
    const result = await buildEvent(event);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/events/:id/register (auth required)
router.post("/events/:id/register", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const userId = req.dbUser!.id;

    const existing = await db.select().from(eventRegistrationsTable)
      .where(sql`${eventRegistrationsTable.eventId} = ${id} AND ${eventRegistrationsTable.userId} = ${userId}`)
      .limit(1);

    let registered: boolean;
    if (existing.length > 0) {
      await db.delete(eventRegistrationsTable)
        .where(sql`${eventRegistrationsTable.eventId} = ${id} AND ${eventRegistrationsTable.userId} = ${userId}`);
      registered = false;
    } else {
      await db.insert(eventRegistrationsTable).values({ eventId: id, userId }).onConflictDoNothing();
      registered = true;
    }

    const allRegs = await db.select().from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, id));
    res.json({ registered, volunteersRegistered: allRegs.map(r => r.userId) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
