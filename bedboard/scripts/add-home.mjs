// Adds a real home and its owner login. Run it and answer the questions:
//   npm run add-home
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { getDb, createTables } from "../lib/db.js";

const rl = readline.createInterface({ input, output });
const ask = async (q, def = "") => (await rl.question(def ? `${q} [${def}]: ` : `${q}: `)).trim() || def;

const name = await ask("Home name");
const city = await ask("City");
const gender = await ask("Who it serves (Men / Women / Co-ed)", "Men");
const phone = await ask("Phone number");
const totalBeds = Number(await ask("Total beds in the house", "0"));
const priceLow = Number(await ask("Lowest price ($)", "0"));
const priceHigh = Number(await ask("Highest price ($)", String(priceLow)));
const period = (await ask("Charged per week or month", "month")).startsWith("w") ? "week" : "month";
const email = (await ask("Owner email (inquiries go here)")).toLowerCase();
const password = await ask("Owner password (at least 8 characters)");
rl.close();

if (!name || !city || !phone || !email || password.length < 8) {
  console.error("Missing info, or password too short. Nothing was saved.");
  process.exit(1);
}

const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const db = getDb();
await createTables(db);
await db.execute({
  sql: `INSERT INTO homes (slug, name, city, gender, phone, total_beds, price_low, price_high, price_period, owner_email, owner_password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [slug, name, city, gender, phone, totalBeds, priceLow, priceHigh, period, email, await bcrypt.hash(password, 10)],
});
console.log(`\n✓ Added ${name}. Public page: /homes/${slug}  Owner login: ${email}`);
