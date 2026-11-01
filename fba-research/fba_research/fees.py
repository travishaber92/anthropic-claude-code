"""Estimate Amazon FBA fees for one unit. All rates come from config.json."""

import math


def size_tier(dims, weight_lb, fees):
    """Return 'small_standard', 'large_standard', 'oversize' or 'unknown'."""
    if not dims or weight_lb is None:
        return "unknown"
    d = sorted(dims, reverse=True)
    if all(a <= b for a, b in zip(d, fees["small_standard_max_in"])) and weight_lb <= fees["small_standard_max_lb"]:
        return "small_standard"
    if all(a <= b for a, b in zip(d, fees["large_standard_max_in"])) and weight_lb <= fees["large_standard_max_lb"]:
        return "large_standard"
    return "oversize"


def _tier_fee(table, weight):
    for step in table:
        if weight <= step["max_lb"]:
            return step["fee"]
    return None


def fulfillment_fee(tier, ship_weight, fees):
    if tier == "small_standard":
        return _tier_fee(fees["small_standard_fees"], ship_weight)
    if tier in ("large_standard", "unknown"):
        fee = _tier_fee(fees["large_standard_fees"], ship_weight)
        if fee is None:
            extra = math.ceil(ship_weight - 3)
            fee = fees["large_standard_over_3lb_base"] + extra * fees["large_standard_per_extra_lb"]
        return fee
    return fees["oversize_base"] + max(0.0, ship_weight - 1) * fees["oversize_per_lb"]


def estimate_fees(product, config):
    """Return a dict of per-unit fee estimates for a product row."""
    fees = config["fees"]
    price = product["price"]
    category = product.get("category") or ""

    rate = fees["referral_rate_by_category"].get(category, fees["referral_rate_default"])
    referral = max(price * rate, fees["referral_min"])

    dims = None
    if all(product.get(k) for k in ("length_in", "width_in", "height_in")):
        dims = [product["length_in"], product["width_in"], product["height_in"]]
    unit_weight = product.get("weight_lb")
    # Without a weight, assume 1 lb so the estimate isn't wildly optimistic.
    weight = unit_weight if unit_weight is not None else 1.0

    tier = size_tier(dims, unit_weight, fees)
    ship_weight = weight
    if dims and tier != "small_standard":
        dim_weight = dims[0] * dims[1] * dims[2] / fees["dim_weight_divisor"]
        ship_weight = max(weight, dim_weight)

    fulfillment = fulfillment_fee(tier, ship_weight, fees)

    cubic_ft = (dims[0] * dims[1] * dims[2] / 1728) if dims else 0.1
    storage = cubic_ft * fees["storage_per_cubic_ft_month"] * fees["storage_months"]
    inbound = weight * fees["inbound_shipping_per_lb"]
    prep = fees["prep_per_unit"]

    total = referral + fulfillment + storage + inbound + prep
    return {
        "size_tier": tier,
        "referral_fee": round(referral, 2),
        "fulfillment_fee": round(fulfillment, 2),
        "storage_fee": round(storage, 2),
        "inbound_shipping": round(inbound, 2),
        "prep": round(prep, 2),
        "total_fees": round(total, 2),
    }
