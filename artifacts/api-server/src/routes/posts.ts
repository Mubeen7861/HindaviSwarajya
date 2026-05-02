import { Router } from "express";
import { db, mudraFromHelped } from "@workspace/db";
import {
  postsTable,
  usersTable,
  commentsTable,
  postTagsTable,
  postLikesTable,
} from "@workspace/db";
import { eq, desc, ilike, or, and, sql, type SQL } from "drizzle-orm";
import {
  ListPostsQueryParams,
  CreatePostBody,
  AddCommentBody,
  UpdatePostBody,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { applyRank } from "../lib/applyRank";

const router = Router();

async function buildPost(post: typeof postsTable.$inferSelect) {
  const user = await db.select().from(usersTable).where(eq(usersTable.id, post.userId)).limit(1);
  const comments = await db
    .select({
      id: commentsTable.id,
      postId: commentsTable.postId,
      userId: commentsTable.userId,
      content: commentsTable.content,
      timestamp: commentsTable.timestamp,
    })
    .from(commentsTable)
    .where(eq(commentsTable.postId, post.id))
    .orderBy(commentsTable.timestamp);

  const commentUsers = await Promise.all(
    comments.map(async (c) => {
      const u = await db.select().from(usersTable).where(eq(usersTable.id, c.userId)).limit(1);
      return { ...c, userName: u[0]?.name ?? "Unknown", userAvatar: u[0]?.avatar ?? "" };
    })
  );

  const tags = await db.select().from(postTagsTable).where(eq(postTagsTable.postId, post.id));
  const likes = await db.select().from(postLikesTable).where(eq(postLikesTable.postId, post.id));

  const u = user[0];
  return {
    id: post.id,
    userId: post.userId,
    user: u
      ? {
          id: u.id,
          name: u.name,
          avatar: u.avatar ?? "",
          location: u.location ?? "",
          rank: u.rank,
          totalHelped: u.totalHelped,
          mudra: mudraFromHelped(u.totalHelped),
          chhava: u.chhava,
          followersCount: u.followersCount,
          postsCount: u.postsCount,
        }
      : null,
    content: post.content,
    category: post.category,
    helpedPeople: post.helpedPeople,
    likes: post.likes,
    likedBy: likes.map((l) => l.userId),
    comments: commentUsers.map((c) => ({
      id: c.id,
      postId: c.postId,
      userId: c.userId,
      userName: c.userName,
      userAvatar: c.userAvatar,
      content: c.content,
      timestamp: c.timestamp?.toISOString() ?? new Date().toISOString(),
    })),
    tags: tags.map((t) => t.tag),
    images: post.images ?? [],
    timestamp: post.timestamp?.toISOString() ?? new Date().toISOString(),
    location: post.location ?? null,
    approvalStatus: post.approvalStatus,
  };
}

// GET /api/posts
router.get("/posts", async (req, res) => {
  try {
    const parsed = ListPostsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    const conditions: SQL[] = [eq(postsTable.approvalStatus, "approved")];

    if (params.category) {
      conditions.push(eq(postsTable.category, params.category));
    }

    if (params.search) {
      const term = `%${params.search}%`;
      const searchCondition = or(
        ilike(postsTable.content, term),
        sql`EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = ${postsTable.id} AND pt.tag ILIKE ${term})`,
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    const orderBy = (() => {
      switch (params.sortBy) {
        case "likes":
          return desc(postsTable.likes);
        case "impact":
          return desc(postsTable.helpedPeople);
        case "comments":
          return desc(
            sql`(SELECT COUNT(*) FROM comments c WHERE c.post_id = ${postsTable.id})`,
          );
        default:
          return desc(postsTable.timestamp);
      }
    })();

    const limit = params.limit ?? 20;
    const offset = params.offset ?? 0;

    const query = db.select().from(postsTable).$dynamic();
    if (conditions.length > 0) {
      query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    const rows = await query.orderBy(orderBy).limit(limit).offset(offset);

    const result = await Promise.all(rows.map((p) => buildPost(p)));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/posts (auth required)
router.post("/posts", requireAuth, async (req, res) => {
  try {
    const parsed = CreatePostBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const { tags, ...rest } = parsed.data;
    const userId = req.dbUser!.id;

    const [post] = await db
      .insert(postsTable)
      .values({ ...rest, userId })
      .returning();

    if (tags && tags.length > 0) {
      await db.insert(postTagsTable).values(tags.map((tag: string) => ({ postId: post.id, tag })));
    }

    // NOTE: postsCount / totalHelped are NOT incremented here — they are
    // updated when an admin approves the post via /api/admin/posts/:id/approve.
    const result = await buildPost(post);
    res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/posts/:id
router.get("/posts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    // Treat un-approved posts as non-existent for the public API so admins
    // remain the only ones who can see pending or rejected content.
    if (!post || post.approvalStatus !== "approved") {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const result = await buildPost(post);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/posts/:id/like (auth required)
router.post("/posts/:id/like", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const userId = req.dbUser!.id;

    const existing = await db
      .select()
      .from(postLikesTable)
      .where(sql`${postLikesTable.postId} = ${id} AND ${postLikesTable.userId} = ${userId}`)
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(postLikesTable)
        .where(sql`${postLikesTable.postId} = ${id} AND ${postLikesTable.userId} = ${userId}`);
      await db
        .update(postsTable)
        .set({ likes: sql`GREATEST(${postsTable.likes} - 1, 0)` })
        .where(eq(postsTable.id, id));
    } else {
      await db.insert(postLikesTable).values({ postId: id, userId }).onConflictDoNothing();
      await db
        .update(postsTable)
        .set({ likes: sql`${postsTable.likes} + 1` })
        .where(eq(postsTable.id, id));
    }

    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (!post) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const result = await buildPost(post);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/me/posts (auth required) — returns ALL of the current user's posts
// regardless of approval status, so they can manage drafts that are still
// pending or that admins have rejected.
router.get("/me/posts", requireAuth, async (req, res) => {
  try {
    const userId = req.dbUser!.id;
    const rows = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.userId, userId))
      .orderBy(desc(postsTable.timestamp));
    const result = await Promise.all(rows.map((p) => buildPost(p)));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/posts/:id (auth required, author-only)
router.patch("/posts/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const userId = req.dbUser!.id;

    const [existing] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    const parsed = UpdatePostBody.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    // Drop undefined keys so the SET clause only touches fields the client
    // actually sent. This also keeps zod's coercion (e.g. helpedPeople → number)
    // from clobbering existing rows with `undefined`.
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed.data)) {
      if (v !== undefined) update[k] = v;
    }
    // Reject negative helpedPeople — otherwise a malicious delta could later
    // inflate totalHelped (subtracting a negative on delete) or skew stats.
    if ("helpedPeople" in update && (update.helpedPeople as number) < 0) {
      res.status(400).json({ error: "helpedPeople must be >= 0" });
      return;
    }
    if (Object.keys(update).length === 0) {
      const result = await buildPost(existing);
      res.json(result);
      return;
    }

    // If post was approved and helpedPeople changed, adjust the user's
    // totalHelped counter so stats stay accurate. helpedPeople is now
    // guaranteed to be a non-negative number after zod validation.
    const helpedDelta =
      existing.approvalStatus === "approved" &&
      typeof update.helpedPeople === "number"
        ? update.helpedPeople - existing.helpedPeople
        : 0;

    const updated = await db.transaction(async (tx) => {
      const [row] = await tx.update(postsTable).set(update).where(eq(postsTable.id, id)).returning();
      if (helpedDelta !== 0) {
        await tx
          .update(usersTable)
          .set({ totalHelped: sql`GREATEST(${usersTable.totalHelped} + ${helpedDelta}, 0)` })
          .where(eq(usersTable.id, userId));
        await applyRank(tx, userId);
      }
      return row;
    });

    const result = await buildPost(updated);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/posts/:id (auth required, author-only)
router.delete("/posts/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const userId = req.dbUser!.id;

    const ok = await db.transaction(async (tx) => {
      const [post] = await tx.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
      if (!post) return { notFound: true } as const;
      if (post.userId !== userId) return { forbidden: true } as const;

      const wasApproved = post.approvalStatus === "approved";
      await tx.delete(postTagsTable).where(eq(postTagsTable.postId, id));
      await tx.delete(postLikesTable).where(eq(postLikesTable.postId, id));
      await tx.delete(commentsTable).where(eq(commentsTable.postId, id));
      await tx.delete(postsTable).where(eq(postsTable.id, id));

      if (wasApproved) {
        // Mirror the admin delete logic so totalHelped/postsCount stay
        // accurate when an author removes a previously approved seva.
        await tx
          .update(usersTable)
          .set({
            postsCount: sql`GREATEST(${usersTable.postsCount} - 1, 0)`,
            totalHelped: sql`GREATEST(${usersTable.totalHelped} - ${post.helpedPeople}, 0)`,
          })
          .where(eq(usersTable.id, userId));
        await applyRank(tx, userId);
      }
      return { deleted: true } as const;
    });

    if ("notFound" in ok) { res.status(404).json({ error: "Not found" }); return; }
    if ("forbidden" in ok) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json({ deleted: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/posts/:id/comments (auth required)
router.post("/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const parsed = AddCommentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const { content } = parsed.data;
    const user = req.dbUser!;

    const [comment] = await db
      .insert(commentsTable)
      .values({ postId: id, userId: user.id, content })
      .returning();

    res.status(201).json({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      userName: user.name,
      userAvatar: user.avatar ?? "",
      content: comment.content,
      timestamp: comment.timestamp?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
