import { Router } from "express";
import { db, mudraFromHelped, SWARAJYA_RANK_NAMES } from "@workspace/db";
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
import { timingSafeEqual } from "crypto";
import { signAdminToken, requireAdminAuth } from "../middlewares/adminAuth";
import { applyRank } from "../lib/applyRank";

const router = Router();

// ── LOGIN (public) ─────────────────────────────────────────────────────────────

router.post("/admin/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const expectedUser = process.env["ADMIN_USERNAME"] ?? "admin";
  const expectedPass = process.env["ADMIN_PASSWORD"] ?? "changeme";

  const uMatch = timingSafeEqual(
    Buffer.from(username.padEnd(64)),
    Buffer.from(expectedUser.padEnd(64))
  );
  const pMatch = timingSafeEqual(
    Buffer.from(password.padEnd(64)),
    Buffer.from(expectedPass.padEnd(64))
  );

  if (!uMatch || !pMatch) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  res.json({ token: signAdminToken(username) });
});

// ── All routes below this line require admin auth ─────────────────────────────

router.use("/admin", requireAdminAuth);

// GET /api/admin/overview
router.get("/admin/overview", async (req, res) => {
  try {
    const [users, posts, events, helpReqs, helpedAgg, pendingPosts, pendingEvents, pendingHelp] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(postsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(eventsTable),
      db.select({ count: sql<number>`count(*)::int` }).from(helpRequestsTable),
      db.select({ total: sql<number>`coalesce(sum(total_helped), 0)::int` }).from(usersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(postsTable).where(eq(postsTable.approvalStatus, "pending")),
      db.select({ count: sql<number>`count(*)::int` }).from(eventsTable).where(eq(eventsTable.approvalStatus, "pending")),
      db.select({ count: sql<number>`count(*)::int` }).from(helpRequestsTable).where(eq(helpRequestsTable.approvalStatus, "pending")),
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
        pendingPosts: pendingPosts[0]?.count ?? 0,
        pendingEvents: pendingEvents[0]?.count ?? 0,
        pendingHelpRequests: pendingHelp[0]?.count ?? 0,
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
        mudra: mudraFromHelped(u.totalHelped),
        chhava: u.chhava,
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

router.patch("/admin/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rank, name, location, bio, chhava } = req.body as {
      rank?: string; name?: string; location?: string; bio?: string; chhava?: boolean;
    };
    const update: Record<string, unknown> = {};
    if (rank !== undefined) {
      if (typeof rank !== "string" || !SWARAJYA_RANK_NAMES.includes(rank as (typeof SWARAJYA_RANK_NAMES)[number])) {
        res.status(400).json({ error: `Invalid rank. Must be one of: ${SWARAJYA_RANK_NAMES.join(", ")}` });
        return;
      }
      update.rank = rank;
    }
    if (name !== undefined) update.name = name;
    if (location !== undefined) update.location = location;
    if (bio !== undefined) update.bio = bio;
    if (typeof chhava === "boolean") update.chhava = chhava;
    if (Object.keys(update).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }
    const [user] = await db.update(usersTable).set(update).where(eq(usersTable.id, id)).returning();
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      id: user.id, name: user.name, rank: user.rank, location: user.location,
      bio: user.bio, chhava: user.chhava,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

router.get("/admin/posts", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const rows = await db
      .select({ post: postsTable, userName: usersTable.name, userAvatar: usersTable.avatar })
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
        approvalStatus: post.approvalStatus,
        timestamp: post.timestamp?.toISOString() ?? null,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/posts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ok = await db.transaction(async (tx) => {
      const [post] = await tx.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
      if (!post) return false;
      const wasApproved = post.approvalStatus === "approved";
      await tx.delete(postTagsTable).where(eq(postTagsTable.postId, id));
      await tx.delete(postLikesTable).where(eq(postLikesTable.postId, id));
      await tx.delete(commentsTable).where(eq(commentsTable.postId, id));
      await tx.delete(postsTable).where(eq(postsTable.id, id));
      if (wasApproved) {
        await tx
          .update(usersTable)
          .set({
            postsCount: sql`GREATEST(${usersTable.postsCount} - 1, 0)`,
            totalHelped: sql`GREATEST(${usersTable.totalHelped} - ${post.helpedPeople}, 0)`,
          })
          .where(eq(usersTable.id, post.userId));
        await applyRank(tx, post.userId);
      }
      return true;
    });
    if (!ok) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ deleted: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── APPROVAL QUEUE ────────────────────────────────────────────────────────────

router.get("/admin/pending", async (req, res) => {
  try {
    const [posts, events, helpReqs] = await Promise.all([
      db
        .select({ p: postsTable, userName: usersTable.name, userAvatar: usersTable.avatar })
        .from(postsTable)
        .leftJoin(usersTable, eq(postsTable.userId, usersTable.id))
        .where(eq(postsTable.approvalStatus, "pending"))
        .orderBy(desc(postsTable.timestamp)),
      db
        .select({ e: eventsTable, organizerName: usersTable.name, organizerAvatar: usersTable.avatar })
        .from(eventsTable)
        .leftJoin(usersTable, eq(eventsTable.organizerId, usersTable.id))
        .where(eq(eventsTable.approvalStatus, "pending"))
        .orderBy(desc(eventsTable.createdAt)),
      db
        .select({ hr: helpRequestsTable, requesterName: usersTable.name, requesterAvatar: usersTable.avatar })
        .from(helpRequestsTable)
        .leftJoin(usersTable, eq(helpRequestsTable.requesterId, usersTable.id))
        .where(eq(helpRequestsTable.approvalStatus, "pending"))
        .orderBy(desc(helpRequestsTable.createdAt)),
    ]);
    res.json({
      counts: { posts: posts.length, events: events.length, helpRequests: helpReqs.length },
      posts: posts.map(({ p, userName, userAvatar }) => ({
        id: p.id,
        userId: p.userId,
        userName: userName ?? "Unknown",
        userAvatar: userAvatar ?? "",
        content: p.content,
        category: p.category,
        helpedPeople: p.helpedPeople,
        location: p.location ?? null,
        images: p.images ?? [],
        timestamp: p.timestamp?.toISOString() ?? null,
      })),
      events: events.map(({ e, organizerName, organizerAvatar }) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        category: e.category,
        eventType: e.eventType,
        date: e.date,
        time: e.time,
        location: e.location,
        organizerId: e.organizerId,
        organizerName: organizerName ?? "Unknown",
        organizerAvatar: organizerAvatar ?? "",
        volunteersNeeded: e.volunteersNeeded,
        image: e.image ?? null,
        createdAt: e.createdAt?.toISOString() ?? null,
      })),
      helpRequests: helpReqs.map(({ hr, requesterName, requesterAvatar }) => ({
        id: hr.id,
        title: hr.title,
        description: hr.description,
        category: hr.category,
        urgency: hr.urgency,
        location: hr.location,
        requesterId: hr.requesterId,
        requesterName: requesterName ?? "Unknown",
        requesterAvatar: requesterAvatar ?? "",
        peopleNeeded: hr.peopleNeeded,
        deadline: hr.deadline ?? null,
        createdAt: hr.createdAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/posts/:id/approve
router.post("/admin/posts/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.transaction(async (tx) => {
      const [post] = await tx.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
      if (!post) return { notFound: true } as const;
      if (post.approvalStatus === "approved") {
        return { id: post.id, approvalStatus: post.approvalStatus };
      }
      const wasPending = post.approvalStatus === "pending";
      const [updated] = await tx
        .update(postsTable)
        .set({ approvalStatus: "approved" })
        .where(eq(postsTable.id, id))
        .returning();
      if (wasPending) {
        await tx
          .update(usersTable)
          .set({
            postsCount: sql`${usersTable.postsCount} + 1`,
            totalHelped: sql`${usersTable.totalHelped} + ${post.helpedPeople}`,
          })
          .where(eq(usersTable.id, post.userId));
        await applyRank(tx, post.userId);
      }
      return { id: updated.id, approvalStatus: updated.approvalStatus };
    });
    if ("notFound" in result) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/posts/:id/reject
router.post("/admin/posts/:id/reject", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await db.transaction(async (tx) => {
      const [post] = await tx.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
      if (!post) return { notFound: true } as const;
      const wasApproved = post.approvalStatus === "approved";
      const [updated] = await tx
        .update(postsTable)
        .set({ approvalStatus: "rejected" })
        .where(eq(postsTable.id, id))
        .returning();
      if (wasApproved) {
        await tx
          .update(usersTable)
          .set({
            postsCount: sql`GREATEST(${usersTable.postsCount} - 1, 0)`,
            totalHelped: sql`GREATEST(${usersTable.totalHelped} - ${post.helpedPeople}, 0)`,
          })
          .where(eq(usersTable.id, post.userId));
        await applyRank(tx, post.userId);
      }
      return { id: updated.id, approvalStatus: updated.approvalStatus };
    });
    if ("notFound" in result) { res.status(404).json({ error: "Not found" }); return; }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/events/:id/approve | reject
router.post("/admin/events/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [event] = await db
      .update(eventsTable)
      .set({ approvalStatus: "approved" })
      .where(eq(eventsTable.id, id))
      .returning();
    if (!event) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: event.id, approvalStatus: event.approvalStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/events/:id/reject", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [event] = await db
      .update(eventsTable)
      .set({ approvalStatus: "rejected" })
      .where(eq(eventsTable.id, id))
      .returning();
    if (!event) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: event.id, approvalStatus: event.approvalStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/help-requests/:id/approve | reject
router.post("/admin/help-requests/:id/approve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [hr] = await db
      .update(helpRequestsTable)
      .set({ approvalStatus: "approved" })
      .where(eq(helpRequestsTable.id, id))
      .returning();
    if (!hr) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: hr.id, approvalStatus: hr.approvalStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/help-requests/:id/reject", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [hr] = await db
      .update(helpRequestsTable)
      .set({ approvalStatus: "rejected" })
      .where(eq(helpRequestsTable.id, id))
      .returning();
    if (!hr) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: hr.id, approvalStatus: hr.approvalStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── EVENTS ────────────────────────────────────────────────────────────────────

router.get("/admin/events", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const rows = await db
      .select({ event: eventsTable, organizerName: usersTable.name })
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
        approvalStatus: event.approvalStatus,
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

router.patch("/admin/events/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status?: string };
    if (!status) { res.status(400).json({ error: "status required" }); return; }
    const [event] = await db.update(eventsTable).set({ status }).where(eq(eventsTable.id, id)).returning();
    if (!event) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: event.id, status: event.status });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

router.get("/admin/help-requests", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const rows = await db
      .select({ hr: helpRequestsTable, requesterName: usersTable.name })
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
        approvalStatus: hr.approvalStatus,
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

router.patch("/admin/help-requests/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status?: string };
    if (!status) { res.status(400).json({ error: "status required" }); return; }
    const [hr] = await db.update(helpRequestsTable).set({ status }).where(eq(helpRequestsTable.id, id)).returning();
    if (!hr) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: hr.id, status: hr.status });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

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
