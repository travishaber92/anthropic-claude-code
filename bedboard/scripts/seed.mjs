// Adds 3 demo homes in Orange County. Safe to run more than once.
//   npm run seed
import bcrypt from "bcryptjs";
import { getDb, createTables } from "../lib/db.js";

const DEMO_PASSWORD = "demo1234";

const homes = [
  {
    slug: "harbor-light-mens-house",
    name: "Harbor Light Men's House",
    city: "Costa Mesa",
    gender: "Men",
    phone: "(714) 555-0141",
    description: "A structured, 12-bed sober living home near the Westside. House meetings weekly, close to bus lines and 12-step meetings.",
    beds_available: 3, total_beds: 12, price_low: 850, price_high: 1200, price_period: "month",
    owner_email: "harborlight@example.com",
  },
  {
    slug: "seabreeze-womens-sober-living",
    name: "Seabreeze Women's Sober Living",
    city: "Huntington Beach",
    gender: "Women",
    phone: "(714) 555-0172",
    description: "A calm, women-only home a short bike ride from the beach. Shared and private rooms, house manager on site.",
    beds_available: 1, total_beds: 8, price_low: 250, price_high: 350, price_period: "week",
    owner_email: "seabreeze@example.com",
  },
  {
    slug: "mission-trail-recovery-residence",
    name: "Mission Trail Recovery Residence",
    city: "San Juan Capistrano",
    gender: "Co-ed",
    phone: "(949) 555-0108",
    description: "Separate men's and women's wings in a quiet neighborhood. Curfew, chores, and weekly check-ins with the house manager.",
    beds_available: 0, total_beds: 10, price_low: 1100, price_high: 1500, price_period: "month",
    owner_email: "missiontrail@example.com",
  },
];

const db = getDb();
await createTables(db);
const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

for (const h of homes) {
  await db.execute({
    sql: `INSERT INTO homes (slug, name, city, gender, phone, description, beds_available, total_beds,
            price_low, price_high, price_period, owner_email, owner_password_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(slug) DO UPDATE SET
            name = excluded.name, city = excluded.city, gender = excluded.gender, phone = excluded.phone,
            description = excluded.description, beds_available = excluded.beds_available,
            total_beds = excluded.total_beds, price_low = excluded.price_low, price_high = excluded.price_high,
            price_period = excluded.price_period, owner_email = excluded.owner_email,
            owner_password_hash = excluded.owner_password_hash, updated_at = datetime('now')`,
    args: [h.slug, h.name, h.city, h.gender, h.phone, h.description, h.beds_available, h.total_beds,
      h.price_low, h.price_high, h.price_period, h.owner_email, hash],
  });
  console.log(`✓ ${h.name}  →  /homes/${h.slug}   login: ${h.owner_email} / ${DEMO_PASSWORD}`);
}
console.log("\nDone. Demo homes are ready.");
