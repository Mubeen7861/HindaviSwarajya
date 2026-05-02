import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

function serializeProfile(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    avatar: u.avatar ?? "",
    location: u.location ?? "",
    rank: u.rank,
    totalHelped: u.totalHelped,
    followersCount: u.followersCount,
    postsCount: u.postsCount,
    bio: u.bio ?? undefined,
    joinedAt: u.joinedAt?.toISOString() ?? undefined,
  };
}

router.get("/me", requireAuth, (req, res) => {
  res.json(serializeProfile(req.dbUser!));
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const { name, bio, location } = (req.body ?? {}) as {
      name?: string;
      bio?: string;
      location?: string;
    };
    const update: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) update.name = name.trim();
    if (typeof bio === "string") update.bio = bio.trim();
    if (typeof location === "string") update.location = location.trim() || null;

    if (Object.keys(update).length === 0) {
      res.json(serializeProfile(req.dbUser!));
      return;
    }

    const [user] = await db
      .update(usersTable)
      .set(update)
      .where(eq(usersTable.id, req.dbUser!.id))
      .returning();
    res.json(serializeProfile(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
