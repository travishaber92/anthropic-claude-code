// Simple, dependency-free login sessions using a signed cookie.
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const OWNER_COOKIE = "bb_owner";
const ADMIN_COOKIE = "bb_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // stay logged in for 30 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is not set");
  }
  return s || "dev-only-secret";
}

function sign(value) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `${value}.${exp}`;
  const mac = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${mac}`;
}

function verify(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [value, exp, mac] = parts;
  const expected = createHmac("sha256", secret()).update(`${value}.${exp}`).digest("base64url");
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return value;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};

export async function setOwnerSession(homeId) {
  (await cookies()).set(OWNER_COOKIE, sign(String(homeId)), cookieOptions);
}

export async function getOwnerHomeId() {
  const v = verify((await cookies()).get(OWNER_COOKIE)?.value);
  return v ? Number(v) : null;
}

export async function setAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, sign("admin"), cookieOptions);
}

export async function isAdmin() {
  return verify((await cookies()).get(ADMIN_COOKIE)?.value) === "admin";
}

export async function clearSessions() {
  const c = await cookies();
  c.delete(OWNER_COOKIE);
  c.delete(ADMIN_COOKIE);
}

export function checkAdminPassword(input) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real || !input) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}
