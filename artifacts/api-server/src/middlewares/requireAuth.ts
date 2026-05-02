import type { Request, Response, NextFunction, RequestHandler } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import type { User as ClerkUser } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

export type DbUser = typeof usersTable.$inferSelect;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      dbUser?: DbUser;
    }
  }
}

function getPrimaryEmail(clerkUser: ClerkUser): string | null {
  return (
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null
  );
}

function computeDisplayName(clerkUser: ClerkUser): string {
  const primaryEmail = getPrimaryEmail(clerkUser);
  return (
    [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    clerkUser.username ||
    primaryEmail?.split("@")[0] ||
    "Sevak"
  );
}

export async function resolveOrProvisionUser(
  clerkUserId: string,
): Promise<DbUser> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (existing[0]) {
    return syncClerkProfile(existing[0], clerkUserId);
  }

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail = getPrimaryEmail(clerkUser);
  const displayName = computeDisplayName(clerkUser);

  const [created] = await db
    .insert(usersTable)
    .values({
      clerkId: clerkUserId,
      email: primaryEmail ?? undefined,
      name: displayName,
      avatar: clerkUser.imageUrl || null,
      location: null,
    })
    .onConflictDoNothing({ target: usersTable.clerkId })
    .returning();

  if (created) return created;

  const after = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);
  if (!after[0]) throw new Error("Failed to provision user");
  return after[0];
}

async function syncClerkProfile(
  dbUser: DbUser,
  clerkUserId: string,
): Promise<DbUser> {
  let clerkUser: ClerkUser;
  try {
    clerkUser = await clerkClient.users.getUser(clerkUserId);
  } catch (err) {
    logger.warn(
      { err, clerkUserId },
      "Failed to fetch Clerk user for profile sync; using cached DB row",
    );
    return dbUser;
  }

  const desiredName = computeDisplayName(clerkUser);
  const desiredAvatar = clerkUser.imageUrl || null;

  const updates: Partial<{ name: string; avatar: string | null }> = {};
  if (desiredName !== dbUser.name) updates.name = desiredName;
  if (desiredAvatar !== dbUser.avatar) updates.avatar = desiredAvatar;

  if (Object.keys(updates).length === 0) return dbUser;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, dbUser.id))
    .returning();

  return updated ?? dbUser;
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    req.dbUser = await resolveOrProvisionUser(userId);
    next();
  } catch (err) {
    req.log?.error({ err }, "requireAuth failed");
    res.status(500).json({ error: "Authentication error" });
  }
};
