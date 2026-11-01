"use server";

// All the things a visitor, owner, or admin can "do" live here.
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db, getHomeByEmail, getHomeById, getHomeBySlug } from "@/lib/db";
import {
  checkAdminPassword, clearSessions, getOwnerHomeId, setAdminSession, setOwnerSession,
} from "@/lib/auth";
import { sendInquiryEmail } from "@/lib/email";
import { FOR_WHOM, PAYMENT } from "@/lib/options";


const clean = (v, max = 200) => String(v ?? "").trim().slice(0, max);

/* ---------------- Public: inquiry form ---------------- */

export async function submitInquiry(_prev, formData) {
  // Hidden "website" field: real people never fill it in, spam bots do.
  if (clean(formData.get("website"))) return { ok: true };

  const home = await getHomeBySlug(clean(formData.get("slug")));
  if (!home) return { error: "This home could not be found." };
  if (!home.inquiriesOn) return { error: "This home is not taking inquiries right now. Please call instead." };

  const inquiry = {
    name: clean(formData.get("name"), 100),
    phone: clean(formData.get("phone"), 30),
    forWhom: clean(formData.get("forWhom")),
    payment: clean(formData.get("payment")),
    moveInDate: clean(formData.get("moveInDate"), 10),
    notes: clean(formData.get("notes"), 1000),
  };

  const errors = {};
  if (inquiry.name.length < 2) errors.name = "Please enter a name.";
  const digits = inquiry.phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) errors.phone = "Please enter a 10-digit phone number.";
  if (!FOR_WHOM.includes(inquiry.forWhom)) errors.forWhom = "Please choose one.";
  if (!PAYMENT.includes(inquiry.payment)) errors.payment = "Please choose one.";
  if (inquiry.moveInDate && !/^\d{4}-\d{2}-\d{2}$/.test(inquiry.moveInDate)) errors.moveInDate = "Please pick a date.";
  if (Object.keys(errors).length) return { errors, values: inquiry };

  const c = await db();

  // Simple flood protection: max 3 inquiries per phone number per home per hour.
  const recent = await c.execute({
    sql: `SELECT COUNT(*) AS n FROM inquiries
          WHERE home_id = ? AND phone = ? AND created_at > datetime('now', '-1 hour')`,
    args: [home.id, inquiry.phone],
  });
  if (Number(recent.rows[0].n) >= 3) {
    return { error: "We already got your inquiry. The home will call you back soon." };
  }

  const ins = await c.execute({
    sql: `INSERT INTO inquiries (home_id, name, phone, for_whom, payment, move_in_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [home.id, inquiry.name, inquiry.phone, inquiry.forWhom, inquiry.payment,
      inquiry.moveInDate || null, inquiry.notes],
  });

  try {
    if (await sendInquiryEmail(home, inquiry)) {
      await c.execute({ sql: "UPDATE inquiries SET emailed = 1 WHERE id = ?", args: [ins.lastInsertRowid] });
    }
  } catch (e) {
    console.error("[BedBoard] Email error:", e);
  }

  return { ok: true };
}

/* ---------------- Owner: login & updates ---------------- */

export async function ownerLogin(_prev, formData) {
  const email = clean(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const home = email ? await getHomeByEmail(email) : null;
  const ok = home && (await bcrypt.compare(password, home.passwordHash));
  if (!ok) return { error: "That email and password don't match. Please try again.", email };
  await setOwnerSession(home.id);
  redirect("/owner");
}

export async function logout() {
  await clearSessions();
  redirect("/");
}

async function requireOwnerHome() {
  const id = await getOwnerHomeId();
  const home = id ? await getHomeById(id) : null;
  if (!home) redirect("/owner/login");
  return home;
}

function refresh(home) {
  revalidatePath("/owner");
  revalidatePath(`/homes/${home.slug}`);
  revalidatePath("/");
  revalidatePath("/admin");
}

// delta is +1 or -1. Never goes below 0 or above the home's total beds.
export async function changeBeds(delta) {
  const home = await requireOwnerHome();
  const step = delta > 0 ? 1 : -1;
  const c = await db();
  await c.execute({
    sql: `UPDATE homes SET
            beds_available = MAX(0, CASE WHEN total_beds > 0
              THEN MIN(total_beds, beds_available + ?) ELSE beds_available + ? END),
            updated_at = datetime('now')
          WHERE id = ?`,
    args: [step, step, home.id],
  });
  refresh(home);
  const updated = await getHomeById(home.id);
  return updated.bedsAvailable;
}

export async function updatePrice(_prev, formData) {
  const home = await requireOwnerHome();
  const low = Math.round(Number(formData.get("priceLow")));
  const high = Math.round(Number(formData.get("priceHigh")));
  const period = formData.get("pricePeriod") === "week" ? "week" : "month";
  if (!Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high < 0 || low > 100000 || high > 100000) {
    return { error: "Please enter prices as numbers, like 900." };
  }
  if (high < low) return { error: "The highest price can't be lower than the lowest price." };
  const c = await db();
  await c.execute({
    sql: `UPDATE homes SET price_low = ?, price_high = ?, price_period = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [low, high, period, home.id],
  });
  refresh(home);
  return { ok: true, savedAt: Date.now() };
}

export async function setInquiriesOn(on) {
  const home = await requireOwnerHome();
  const c = await db();
  await c.execute({
    sql: "UPDATE homes SET inquiries_on = ?, updated_at = datetime('now') WHERE id = ?",
    args: [on ? 1 : 0, home.id],
  });
  refresh(home);
  return on;
}

/* ---------------- Admin ---------------- */

export async function adminLogin(_prev, formData) {
  if (!checkAdminPassword(formData.get("password"))) {
    return { error: "Wrong password." };
  }
  await setAdminSession();
  redirect("/admin");
}
