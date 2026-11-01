// Database helper.
// Uses libSQL (SQLite): a local file in development, Turso in production.
import { createClient } from "@libsql/client";

let client;
let ready;

export function getDb() {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || "file:bedboard.db",
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    });
  }
  return client;
}

// Creates the tables the first time the app runs. Safe to call many times.
export async function db() {
  const c = getDb();
  if (!ready) ready = createTables(c);
  await ready;
  return c;
}

export async function createTables(c) {
  await c.batch(
    [
      `CREATE TABLE IF NOT EXISTS homes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        gender TEXT NOT NULL,              -- 'Men', 'Women', or 'Co-ed'
        phone TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        beds_available INTEGER NOT NULL DEFAULT 0,
        total_beds INTEGER NOT NULL DEFAULT 0,
        price_low INTEGER NOT NULL DEFAULT 0,
        price_high INTEGER NOT NULL DEFAULT 0,
        price_period TEXT NOT NULL DEFAULT 'month', -- 'week' or 'month'
        inquiries_on INTEGER NOT NULL DEFAULT 1,
        owner_email TEXT NOT NULL UNIQUE,
        owner_password_hash TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      // Inquiries only — no medical or insurance-member details are collected.
      `CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        home_id INTEGER NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        for_whom TEXT NOT NULL,
        payment TEXT NOT NULL,
        move_in_date TEXT,
        notes TEXT NOT NULL DEFAULT '',
        emailed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    ],
    "write"
  );
}

export async function getHomeBySlug(slug) {
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM homes WHERE slug = ?", args: [slug] });
  return r.rows[0] ? toHome(r.rows[0]) : null;
}

export async function getHomeById(id) {
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM homes WHERE id = ?", args: [id] });
  return r.rows[0] ? toHome(r.rows[0]) : null;
}

export async function getHomeByEmail(email) {
  const c = await db();
  const r = await c.execute({
    sql: "SELECT * FROM homes WHERE owner_email = ?",
    args: [email.trim().toLowerCase()],
  });
  return r.rows[0] ? toHome(r.rows[0]) : null;
}

export async function listHomes() {
  const c = await db();
  const r = await c.execute("SELECT * FROM homes ORDER BY city, name");
  return r.rows.map(toHome);
}

export async function recentInquiries(homeId, limit = 10) {
  const c = await db();
  const r = await c.execute({
    sql: "SELECT * FROM inquiries WHERE home_id = ? ORDER BY id DESC LIMIT ?",
    args: [homeId, limit],
  });
  return r.rows.map((row) => ({ ...row }));
}

function toHome(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    city: row.city,
    gender: row.gender,
    phone: row.phone,
    description: row.description,
    bedsAvailable: Number(row.beds_available),
    totalBeds: Number(row.total_beds),
    priceLow: Number(row.price_low),
    priceHigh: Number(row.price_high),
    pricePeriod: row.price_period,
    inquiriesOn: Number(row.inquiries_on) === 1,
    ownerEmail: row.owner_email,
    passwordHash: row.owner_password_hash,
    updatedAt: row.updated_at,
  };
}
