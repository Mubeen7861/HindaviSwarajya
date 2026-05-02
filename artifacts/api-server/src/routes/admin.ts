import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  postsTable,
  eventsTable,
  helpRequestsTable,
  postTagsTable,
  postLikesTable,
  commentsTable,
  eventTagsTable,
  eventRegistrationsTable,
  helpRequestJoinsTable,
  followsTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

// GET /api/admin/overview
router.get("/admin/overview", async (req, res) => {
  try {
    const [users, posts, events, helpReqs, helpedAgg] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(postsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(eventsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(helpRequestsTable),
      db.select({ total: sql<number>`coalesce(sum(total_helped), 0)::int` }).from(usersTable),
    ]);

    const [recentUsers, recentPosts] = await Promise.all([
      db.select().from(usersTable).orderBy(desc(usersTable.joinedAt)).limit(5),
      db.select().from(postsTable).orderBy(desc(postsTable.timestamp)).limit(5),
    ]);

    res.json({
      counts: {
        users: users[0]?.count ?? 0,
        posts: posts[0]?.count ?? 0,
        events: events[0]?.count ?? 0,
        helpRequests: helpReqs[0]?.count ?? 0,
        totalHelped: helpedAgg[0]?.total ?? 0,
      },
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        rank: u.rank,
        location: u.location,
        joinedAt: u.joinedAt?.toISOString() ?? null,
      })),
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        content: p.content.slice(0, 120),
        category: p.category,
        userId: p.userId,
        helpedPeople: p.helpedPeople,
        timestamp: p.timestamp?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── USERS ─────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get("/admin/users", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const rows = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.joinedAt))
      .limit(limit)
      .offset(offset);
    res.json(
      rows.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        location: u.location,
        rank: u.rank,
        totalHelped: u.totalHelped,
        followersCount: u.followersCount,
        postsCount: u.postsCount,
        bio: u.bio ?? null,
        joinedAt: u.joinedAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id
router.patch("/admin/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rank, name, location, bio } = req.body as {
      rank?: string;
      name?: string;
      location?: string;
      bio?: string;
    };
    const update: Record<string, unknown> = {};
    if (rank !== undefined) update.rank = rank;
    if (name !== undefined) update.name = name;
    if (location !== undefined) update.location = location;
    if (bio !== undefined) update.bio = bio;
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }
    const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: user.id, name: user.name, rank: user.rank, location: user.location, bio: user.bio });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/admin/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(postLikesTable).where(eq(postLikesTable.userId, id));
    await db.delete(commentsTable).where(eq(commentsTable.userId, id));
    await db.delete(postTagsTable).where(
      sql`${postTagsTable.postId} IN (SELECT id FROM posts WHERE user_id = ${id})`
    );
    await db.delete(postLikesTable).where(
      sql`${postLikesTable.postId} IN (SELECT id FROM posts WHERE user_id = ${id})`
    );
    await db.delete(commentsTable).where(
      sql`${commentsTable.postId} IN (SELECT id FROM posts WHERE user_id = ${id})`
    );
    await db.delete(postsTable).where(eq(postsTable.userId, id));
    await db.delete(eventRegistrationsTable).where(eq(eventRegistrationsTable.userId, id));
    await db.delete(helpRequestJoinsTable).where(eq(helpRequestJoinsTable.userId, id));
    await db.delete(followsTable).where(eq(followsTable.followerId, id));
    await db.delete(followsTable).where(eq(followsTable.followedId, id));
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POSTS ─────────────────────────────────────────────────────────────────────

// GET /api/admin/posts
router.get("/admin/posts", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const rows = await db
      .select({
        post: postsTable,
        userName: usersTable.name,
        userAvatar: usersTable.avatar,
      })
      .from(postsTable)
      .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
      .orderBy(desc(postsTable.timestamp))
      .limit(limit)
      .offset(offset);

    res.json(
      rows.map(({ post, userName, userAvatar }) => ({
        id: post.id,
        userId: post.userId,
        userName: userName ?? "Unknown",
        userAvatar: userAvatar ?? "",
        content: post.content,
        category: post.category,
        helpedPeople: post.helpedPeople,
        likes: post.likes,
        location: post.location ?? null,
        timestamp: post.timestamp?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/posts/:id
router.delete("/admin/posts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (!post) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(postTagsTable).where(eq(postTagsTable.postId, id));
    await db.delete(postLikesTable).where(eq(postLikesTable.postId, id));
    await db.delete(commentsTable).where(eq(commentsTable.postId, id));
    await db.delete(postsTable).where(eq(postsTable.id, id));
    await db
      .update(usersTable)
      .set({ postsCount: sql`GREATEST(${usersTable.postsCount} - 1, 0)` })
      .where(eq(usersTable.id, post.userId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── EVENTS ────────────────────────────────────────────────────────────────────

// GET /api/admin/events
router.get("/admin/events", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const rows = await db
      .select({
        event: eventsTable,
        organizerName: usersTable.name,
      })
      .from(eventsTable)
      .leftJoin(usersTable, eq(eventsTable.organizerId, usersTable.id))
      .orderBy(desc(eventsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(
      rows.map(({ event, organizerName }) => ({
        id: event.id,
        title: event.title,
        category: event.category,
        date: event.date,
        location: event.location,
        status: event.status,
        organizerId: event.organizerId,
        organizerName: organizerName ?? "Unknown",
        volunteersNeeded: event.volunteersNeeded,
        createdAt: event.createdAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/events/:id
router.patch("/admin/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status?: string };
    if (!status) { res.status(400).json({ error: "status required" }); return; }
    const [event] = await db
      .update(eventsTable)
      .set({ status })
      .where(eq(eventsTable.id, id))
      .returning();
    if (!event) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: event.id, status: event.status });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/events/:id
router.delete("/admin/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(eventTagsTable).where(eq(eventTagsTable.eventId, id));
    await db.delete(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, id));
    await db.delete(eventsTable).where(eq(eventsTable.id, id));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── HELP REQUESTS ─────────────────────────────────────────────────────────────

// GET /api/admin/help-requests
router.get("/admin/help-requests", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const rows = await db
      .select({
        hr: helpRequestsTable,
        requesterName: usersTable.name,
      })
      .from(helpRequestsTable)
      .leftJoin(usersTable, eq(helpRequestsTable.requesterId, usersTable.id))
      .orderBy(desc(helpRequestsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(
      rows.map(({ hr, requesterName }) => ({
        id: hr.id,
        title: hr.title,
        category: hr.category,
        urgency: hr.urgency,
        location: hr.location,
        status: hr.status,
        requesterId: hr.requesterId,
        requesterName: requesterName ?? "Unknown",
        peopleNeeded: hr.peopleNeeded,
        deadline: hr.deadline ?? null,
        createdAt: hr.createdAt?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/help-requests/:id
router.patch("/admin/help-requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status?: string };
    if (!status) { res.status(400).json({ error: "status required" }); return; }
    const [hr] = await db
      .update(helpRequestsTable)
      .set({ status })
      .where(eq(helpRequestsTable.id, id))
      .returning();
    if (!hr) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: hr.id, status: hr.status });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/help-requests/:id
router.delete("/admin/help-requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(helpRequestJoinsTable).where(eq(helpRequestJoinsTable.helpRequestId, id));
    await db.delete(helpRequestsTable).where(eq(helpRequestsTable.id, id));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
