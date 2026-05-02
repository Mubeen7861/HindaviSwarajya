import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, usersTable, postTagsTable, postLikesTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";

const router = Router();

// GET /api/stats/summary
router.get("/stats/summary", async (req, res) => {
  try {
    const [postStats] = await db
      .select({
        totalPosts: sql<number>`COUNT(*)::int`,
        totalHelped: sql<number>`COALESCE(SUM(${postsTable.helpedPeople}), 0)::int`,
        totalLikes: sql<number>`COALESCE(SUM(${postsTable.likes}), 0)::int`,
      })
      .from(postsTable);

    const [userStats] = await db
      .select({ totalUsers: sql<number>`COUNT(*)::int` })
      .from(usersTable);

    const categoryBreakdown = await db
      .select({
        category: postsTable.category,
        count: sql<number>`COUNT(*)::int`,
        totalHelped: sql<number>`COALESCE(SUM(${postsTable.helpedPeople}), 0)::int`,
      })
      .from(postsTable)
      .groupBy(postsTable.category);

    res.json({
      totalPosts: postStats.totalPosts ?? 0,
      totalHelped: postStats.totalHelped ?? 0,
      totalUsers: userStats.totalUsers ?? 0,
      totalLikes: postStats.totalLikes ?? 0,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        count: c.count,
        totalHelped: c.totalHelped,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const users = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.totalHelped))
      .limit(limit);

    const leaderboard = await Promise.all(
      users.map(async (u, index) => {
        const [postStats] = await db
          .select({
            count: sql<number>`COUNT(*)::int`,
            totalLikes: sql<number>`COALESCE(SUM(${postsTable.likes}), 0)::int`,
          })
          .from(postsTable)
          .where(sql`${postsTable.userId} = ${u.id}`);

        return {
          rank: index + 1,
          user: {
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            location: u.location,
            rank: u.rank,
            totalHelped: u.totalHelped,
            followersCount: u.followersCount,
            postsCount: u.postsCount,
          },
          totalHelped: u.totalHelped,
          postCount: postStats.count ?? 0,
          totalLikes: postStats.totalLikes ?? 0,
        };
      })
    );

    res.json(leaderboard);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tags/trending
router.get("/tags/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 12;
    const tags = await db
      .select({
        tag: postTagsTable.tag,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(postTagsTable)
      .groupBy(postTagsTable.tag)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(limit);

    res.json(tags.map((t) => ({ tag: t.tag, count: t.count })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
