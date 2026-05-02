import { type Request, type Response, type NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";

const ADMIN_TOKEN_HEADER = "x-admin-token";
const SECRET = process.env["SESSION_SECRET"] ?? "dev-secret-change-me";

export function signAdminToken(username: string): string {
  const payload = `${username}:${Date.now()}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyAdminToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return false;
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    const expectedBuf = Buffer.from(expected, "hex");
    const sigBuf = Buffer.from(sig, "hex");
    if (expectedBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers[ADMIN_TOKEN_HEADER] as string | undefined;
  if (!token || !verifyAdminToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
