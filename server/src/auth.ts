import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { User } from "@prisma/client";
import { prisma } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
const REDIRECT_URI =
  process.env.DISCORD_REDIRECT_URI || "http://localhost:3000/api/auth/discord/callback";
const ADMIN_IDS = (process.env.ADMIN_DISCORD_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const COOKIE = "f1coop_session";
export const STATE_COOKIE = "f1coop_oauth_state";
export const cookieSecure = process.env.NODE_ENV === "production";

export const discordConfigured = () => Boolean(CLIENT_ID && CLIENT_SECRET);

export function discordAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify",
    state,
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string }> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("Discord token exchange failed");
  return res.json() as Promise<{ access_token: string }>;
}

export async function fetchDiscordUser(
  accessToken: string
): Promise<{ id: string; username: string; global_name?: string; avatar?: string }> {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Discord user");
  return res.json() as Promise<{ id: string; username: string; global_name?: string; avatar?: string }>;
}

export const isAdminId = (discordId: string) => ADMIN_IDS.includes(discordId);

export function avatarUrl(discordId: string, avatar?: string | null): string {
  return avatar
    ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png?size=64`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;
}

// A trimmed, public-safe view of a claiming user.
export function publicUser(u: User | null | undefined) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.globalName || u.username,
    avatarUrl: avatarUrl(u.discordId, u.avatar),
    isAdmin: u.isAdmin,
  };
}

export const signToken = (userId: string) =>
  jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: "30d" });

export interface AuthedRequest extends Request {
  user?: User;
}

// Populates req.user from the session cookie if present (never blocks).
export async function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const { uid } = jwt.verify(token, JWT_SECRET) as { uid: string };
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (user) req.user = user;
    } catch {
      /* invalid/expired token — treat as logged out */
    }
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Log in with Discord first." });
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Log in with Discord first." });
  if (!req.user.isAdmin) return res.status(403).json({ error: "Admins only." });
  next();
}
