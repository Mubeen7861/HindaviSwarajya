import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, postsTable, followsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { postTagsTable, postLikesTable, commentsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

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
    .where(eq(commentsTable.postId, post.id));

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

// GET /api/users
router.get("/users", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await db.select().from(usersTable).limit(limit);
    res.json(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar ?? "",
        location: u.location ?? "",
        rank: u.rank,
        totalHelped: u.totalHelped,
        followersCount: u.followersCount,
        postsCount: u.postsCount,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      avatar: user.avatar ?? "",
      location: user.location ?? "",
      rank: user.rank,
      totalHelped: user.totalHelped,
      followersCount: user.followersCount,
      postsCount: user.postsCount,
      bio: user.bio ?? undefined,
      joinedAt: user.joinedAt?.toISOString() ?? undefined,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/:id/follow (auth required)
router.post("/users/:id/follow", requireAuth, async (req, res) => {
  try {
    const followedId = parseInt(String(req.params.id));
    const followerId = req.dbUser!.id;

    if (followerId === followedId) {
      res.status(400).json({ error: "Cannot follow yourself" });
      return;
    }

    const existing = await db
      .select()
      .from(followsTable)
      .where(
        sql`${followsTable.followerId} = ${followerId} AND ${followsTable.followedId} = ${followedId}`
      )
      .limit(1);

    let following: boolean;
    if (existing.length > 0) {
      await db
        .delete(followsTable)
        .where(
          sql`${followsTable.followerId} = ${followerId} AND ${followsTable.followedId} = ${followedId}`
        );
      await db
        .update(usersTable)
        .set({ followersCount: sql`GREATEST(${usersTable.followersCount} - 1, 0)` })
        .where(eq(usersTable.id, followedId));
      following = false;
    } else {
      await db.insert(followsTable).values({ followerId, followedId }).onConflictDoNothing();
      await db
        .update(usersTable)
        .set({ followersCount: sql`${usersTable.followersCount} + 1` })
        .where(eq(usersTable.id, followedId));
      following = true;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, followedId)).limit(1);
    res.json({ following, followersCount: user?.followersCount ?? 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id/posts
router.get("/users/:id/posts", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const posts = await db
      .select()
      .from(postsTable)
      .where(eq(postsTable.userId, id))
      .orderBy(desc(postsTable.timestamp));
    const result = await Promise.all(posts.map(buildPost));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
