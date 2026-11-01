"""Turn a product row into estimates, sub-scores (0-1) and a 0-100 score."""

import math

from .fees import estimate_fees


def _clamp(x):
    return max(0.0, min(1.0, x))


def estimate_monthly_sales(product, config):
    """Use the export's sales figure if present, else a rough BSR power curve."""
    if product.get("monthly_sales") is not None:
        return product["monthly_sales"], "export"
    bsr = product.get("bsr")
    if not bsr or bsr <= 0:
        return None, "none"
    a = config["assumptions"]
    curve = a["bsr_to_sales_by_category"].get(product.get("category") or "", {})
    k = curve.get("k", a["bsr_to_sales_k"])
    exp = curve.get("exponent", a["bsr_to_sales_exponent"])
    return k * bsr ** -exp, "bsr_estimate"


def score_product(product, config):
    t = config["targets"]
    w = config["weights"]
    price = product["price"]
    flags = []

    fees = estimate_fees(product, config)

    cost = product.get("cost")
    cost_known = cost is not None
    if not cost_known:
        cost = price * config["assumptions"]["default_cost_ratio"]
        flags.append("cost assumed")

    profit = price - fees["total_fees"] - cost
    margin = profit / price
    roi = profit / cost if cost > 0 else None
    # Highest landed cost that still hits the target ROI.
    max_cost = (price - fees["total_fees"]) / (1 + t["target_roi"])

    sales, sales_source = estimate_monthly_sales(product, config)
    if sales_source == "none":
        flags.append("no sales data")
    elif sales_source == "bsr_estimate":
        flags.append("sales from BSR")

    # Demand: log scale between min and good monthly sales.
    if sales:
        lo, hi = math.log(t["min_monthly_sales"]), math.log(t["good_monthly_sales"])
        demand = _clamp((math.log(max(sales, 1)) - lo) / (hi - lo))
    else:
        demand = 0.0

    # Profit: margin relative to target margin.
    profit_score = _clamp(margin / t["target_margin"]) if margin > 0 else 0.0

    # Competition: fewer reviews and fewer sellers are better.
    reviews = product.get("reviews")
    sellers = product.get("sellers")
    parts = []
    if reviews is not None:
        parts.append(1 - _clamp(math.log(reviews + 1) / math.log(t["max_reviews"] + 1)))
    if sellers is not None:
        parts.append(1 - _clamp((sellers - 1) / (t["max_sellers"] - 1)))
    competition = sum(parts) / len(parts) if parts else 0.5
    if not parts:
        flags.append("no competition data")

    # Price: full marks inside the sweet spot, tapering outside it.
    lo_p, hi_p = t["price_sweet_spot"]
    if lo_p <= price <= hi_p:
        price_score = 1.0
    elif price < lo_p:
        price_score = _clamp((price - t["min_price"]) / (lo_p - t["min_price"]))
    else:
        price_score = _clamp(1 - (price - hi_p) / hi_p)

    # Opportunity: a weak average rating leaves room for a better product.
    rating = product.get("rating")
    opportunity = _clamp((t["weak_rating"] + 0.5 - rating) / 1.0) if rating else 0.0

    if price < t["min_price"]:
        flags.append("price below minimum")
    if fees["size_tier"] == "oversize":
        flags.append("oversize")
    if fees["size_tier"] == "unknown":
        flags.append("no dimensions")
    if profit <= 0:
        flags.append("unprofitable")

    subs = {
        "demand": demand,
        "profit": profit_score,
        "competition": competition,
        "price": price_score,
        "opportunity": opportunity,
    }
    total_weight = sum(w.values())
    score = 100 * sum(subs[k] * w[k] for k in subs) / total_weight
    if profit <= 0:
        score = min(score, 20)  # never rank a money-loser near the top

    return {
        **product,
        **fees,
        "est_monthly_sales": round(sales) if sales else None,
        "sales_source": sales_source,
        "cost_used": round(cost, 2),
        "cost_known": cost_known,
        "profit_per_unit": round(profit, 2),
        "margin": round(margin, 3),
        "roi": round(roi, 2) if roi is not None else None,
        "max_cost_for_target_roi": round(max_cost, 2),
        "est_monthly_profit": round(profit * sales) if sales else None,
        **{f"{k}_score": round(v * 100) for k, v in subs.items()},
        "score": round(score, 1),
        "flags": flags,
    }


def rank_products(products, config):
    scored = [score_product(p, config) for p in products]
    return sorted(scored, key=lambda r: r["score"], reverse=True)
