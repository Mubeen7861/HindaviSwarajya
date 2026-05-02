import type { Request, Response, NextFunction, RequestHandler } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type DbUser = typeof usersTable.$inferSelect;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      dbUser?: DbUser;
    }
  }
}

export async function resolveOrProvisionUser(
  clerkUserId: string,
): Promise<DbUser> {
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);
  if (existing[0]) return existing[0];

  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const primaryEmail =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    primaryEmail?.split("@")[0] ||
    "Sevak";

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
