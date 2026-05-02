import { Router } from "express";
import { db } from "@workspace/db";
import {
  postsTable,
  usersTable,
  commentsTable,
  postTagsTable,
  postLikesTable,
} from "@workspace/db";
import { eq, desc, ilike, or, sql, inArray } from "drizzle-orm";
import {
  ListPostsQueryParams,
  CreatePostBody,
  ToggleLikeBody,
  AddCommentBody,
} from "@workspace/api-zod";

const router = Router();

async function buildPost(post: typeof postsTable.$inferSelect, currentUserId?: number) {
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
          avatar: u.avatar,
          location: u.location,
          rank: u.rank,
          totalHelped: u.totalHelped,
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
    image: post.image ?? null,
    timestamp: post.timestamp?.toISOString() ?? new Date().toISOString(),
    location: post.location ?? null,
  };
}

// GET /api/posts
router.get("/posts", async (req, res) => {
  try {
    const parsed = ListPostsQueryParams.safeParse(req.query);
    const params = parsed.success ? parsed.data : { limit: 20, offset: 0 };

    let query = db.select().from(postsTable);
    const conditions = [];

    if (params.category) {
      conditions.push(eq(postsTable.category, params.category));
    }

    if (params.search) {
      const term = `%${params.search}%`;
      conditions.push(
        or(
          ilike(postsTable.content, term),
          sql`EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = ${postsTable.id} AND pt.tag ILIKE ${term})`
        )
      );
    }

    let rows: typeof postsTable.$inferSelect[];
    const baseQuery = db.select().from(postsTable);

    let sortedQuery = baseQuery;
    switch (params.sortBy) {
      case "likes":
        sortedQuery = baseQuery.orderBy(desc(postsTable.likes)) as typeof baseQuery;
        break;
      case "impact":
        sortedQuery = baseQuery.orderBy(desc(postsTable.helpedPeople)) as typeof baseQuery;
        break;
      case "comments":
        sortedQuery = baseQuery.orderBy(
          desc(sql`(SELECT COUNT(*) FROM comments c WHERE c.post_id = ${postsTable.id})`)
        ) as typeof baseQuery;
        break;
      default:
        sortedQuery = baseQuery.orderBy(desc(postsTable.timestamp)) as typeof baseQuery;
    }

    const allConditions = conditions.length > 0 ? conditions : undefined;
    rows = allConditions
      ? await (sortedQuery.where(
          allConditions.length === 1 ? allConditions[0] : sql`${allConditions[0]} AND ${allConditions[1]}`
        ) as any)
      : await sortedQuery;

    const limited = rows.slice(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 20));
    const result = await Promise.all(limited.map((p) => buildPost(p)));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/posts
router.post("/posts", async (req, res) => {
  try {
    const parsed = CreatePostBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const { tags, userId, ...rest } = parsed.data;

    const [post] = await db
      .insert(postsTable)
      .values({ ...rest, userId })
      .returning();

    if (tags && tags.length > 0) {
      await db.insert(postTagsTable).values(tags.map((tag: string) => ({ postId: post.id, tag })));
    }

    await db
      .update(usersTable)
      .set({
        postsCount: sql`${usersTable.postsCount} + 1`,
        totalHelped: sql`${usersTable.totalHelped} + ${rest.helpedPeople}`,
      })
      .where(eq(usersTable.id, userId));

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

// POST /api/posts/:id/like
router.post("/posts/:id/like", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = ToggleLikeBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const { userId } = parsed.data;

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

// POST /api/posts/:id/comments
router.post("/posts/:id/comments", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = AddCommentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }
    const { userId, content } = parsed.data;

    const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user[0]) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [comment] = await db
      .insert(commentsTable)
      .values({ postId: id, userId, content })
      .returning();

    res.status(201).json({
      id: comment.id,
      postId: comment.postId,
      userId: comment.userId,
      userName: user[0].name,
      userAvatar: user[0].avatar,
      content: comment.content,
      timestamp: comment.timestamp?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
