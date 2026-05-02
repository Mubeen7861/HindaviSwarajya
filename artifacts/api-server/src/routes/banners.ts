import { Router } from "express";
import { db, bannersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAdminAuth } from "../middlewares/adminAuth";

const router = Router();

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function isHex(v: unknown): v is string {
  return typeof v === "string" && HEX_RE.test(v);
}
function isSafeImageUrl(v: unknown): v is string {
  if (typeof v !== "string" || v.length === 0) return false;
  if (v.length > 2048) return false;
  if (/[)"'\s\\]/.test(v)) return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function serialize(b: typeof bannersTable.$inferSelect) {
  return {
    id: b.id,
    subtitle: b.subtitle,
    title: b.title,
    body: b.body,
    ctaLabel: b.ctaLabel,
    ctaHref: b.ctaHref,
    imageUrl: b.imageUrl ?? null,
    gradientFrom: b.gradientFrom,
    gradientTo: b.gradientTo,
    position: b.position,
    active: b.active,
    createdAt: b.createdAt?.toISOString() ?? null,
    updatedAt: b.updatedAt?.toISOString() ?? null,
  };
}

// ── PUBLIC: list active banners ────────────────────────────────────────────────
router.get("/banners", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(bannersTable)
      .where(eq(bannersTable.active, true))
      .orderBy(asc(bannersTable.position), asc(bannersTable.id));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

router.get("/admin/banners", requireAdminAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(bannersTable)
      .orderBy(asc(bannersTable.position), asc(bannersTable.id));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/banners", requireAdminAuth, async (req, res) => {
  try {
    const b = req.body as Partial<typeof bannersTable.$inferInsert>;
    if (!b.title || typeof b.title !== "string" || b.title.trim() === "") {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const [row] = await db
      .insert(bannersTable)
      .values({
        title: b.title.trim(),
        subtitle: typeof b.subtitle === "string" ? b.subtitle : "",
        body: typeof b.body === "string" ? b.body : "",
        ctaLabel: typeof b.ctaLabel === "string" ? b.ctaLabel : "",
        ctaHref: typeof b.ctaHref === "string" ? b.ctaHref : "",
        imageUrl: isSafeImageUrl(b.imageUrl) ? b.imageUrl : null,
        gradientFrom: isHex(b.gradientFrom) ? b.gradientFrom : "#FF6F00",
        gradientTo: isHex(b.gradientTo) ? b.gradientTo : "#EA580C",
        position: typeof b.position === "number" ? b.position : 0,
        active: typeof b.active === "boolean" ? b.active : true,
      })
      .returning();
    if (!row) {
      res.status(500).json({ error: "Failed to create banner" });
      return;
    }
    res.status(201).json(serialize(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/banners/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const b = req.body as Partial<typeof bannersTable.$inferInsert>;
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof b.title === "string") update.title = b.title.trim();
    if (typeof b.subtitle === "string") update.subtitle = b.subtitle;
    if (typeof b.body === "string") update.body = b.body;
    if (typeof b.ctaLabel === "string") update.ctaLabel = b.ctaLabel;
    if (typeof b.ctaHref === "string") update.ctaHref = b.ctaHref;
    if (b.imageUrl === null || b.imageUrl === "") update.imageUrl = null;
    else if (isSafeImageUrl(b.imageUrl)) update.imageUrl = b.imageUrl;
    if (isHex(b.gradientFrom)) update.gradientFrom = b.gradientFrom;
    if (isHex(b.gradientTo)) update.gradientTo = b.gradientTo;
    if (typeof b.position === "number") update.position = b.position;
    if (typeof b.active === "boolean") update.active = b.active;
    const [row] = await db
      .update(bannersTable)
      .set(update)
      .where(eq(bannersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }
    res.json(serialize(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/banners/:id", requireAdminAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const [row] = await db
      .delete(bannersTable)
      .where(eq(bannersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Banner not found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
