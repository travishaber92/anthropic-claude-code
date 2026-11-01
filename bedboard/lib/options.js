// Choices shown on the inquiry form.
export const FOR_WHOM = ["Myself", "A family member", "A friend", "A client (I'm a professional)"];
export const PAYMENT = ["Insurance", "Cash pay", "Not sure yet"];
export const GENDERS = ["Men", "Women", "Co-ed"];

export function formatPrice(home) {
  const per = home.pricePeriod === "week" ? "/week" : "/month";
  const $ = (n) => "$" + n.toLocaleString("en-US");
  if (!home.priceLow && !home.priceHigh) return "Call for pricing";
  if (home.priceLow === home.priceHigh) return `${$(home.priceLow)}${per}`;
  return `${$(home.priceLow)} – ${$(home.priceHigh)}${per}`;
}

export function telHref(phone) {
  return "tel:+1" + phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
}

// "updated_at" is stored in UTC like "2026-11-01 14:05:00".
export function timeAgo(sqlDate) {
  const t = new Date(sqlDate.replace(" ", "T") + "Z").getTime();
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
