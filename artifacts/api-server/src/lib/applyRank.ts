import { db, usersTable, computeRank } from "@workspace/db";
import { eq } from "drizzle-orm";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Recompute and persist a user's Swarajya rank from their current
 * `total_helped` count. Call this inside the same transaction immediately
 * after any update that changes `total_helped` so rank stays in sync.
 *
 * Chhava is an honorary badge stored in its own boolean column and is
 * not affected here.
 */
export async function applyRank(tx: Tx, userId: number): Promise<void> {
  const [row] = await tx
    .select({ totalHelped: usersTable.totalHelped })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!row) return;
  const next = computeRank(row.totalHelped);
  await tx
    .update(usersTable)
    .set({ rank: next })
    .where(eq(usersTable.id, userId));
}

/** Same as applyRank but for the top-level `db` (no enclosing transaction). */
export async function applyRankNoTx(userId: number): Promise<void> {
  await db.transaction(async (tx) => {
    await applyRank(tx, userId);
  });
}
