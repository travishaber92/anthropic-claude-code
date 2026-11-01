"""Where product data comes from.

Every source returns a list of dicts with the same keys (see FIELDS), so the
scoring code doesn't care whether rows came from a CSV export or an API.
To add Amazon SP-API later, write a class with a `load()` method that
returns rows in this shape.
"""

import csv
import re

# Canonical field -> header names commonly used by Seller Central,
# Helium 10, Jungle Scout and Keepa exports.
FIELDS = {
    "asin": ["asin"],
    "title": ["title", "product name", "product title", "name"],
    "category": ["category", "main category", "root category"],
    "price": ["price", "buy box price", "buybox price", "current price", "avg price", "sale price"],
    "bsr": ["bsr", "sales rank", "best sellers rank", "bsr current"],
    "monthly_sales": ["monthly sales", "est monthly sales", "estimated monthly sales", "asin sales", "sales"],
    "reviews": ["reviews", "review count", "ratings count", "number of reviews", "ratings"],
    "rating": ["rating", "stars", "average rating", "review rating"],
    "sellers": ["sellers", "seller count", "number of sellers", "fba sellers", "offers"],
    "weight_lb": ["weight", "weight lb", "weight lbs", "item weight", "weight pounds"],
    "length_in": ["length", "length in", "item length"],
    "width_in": ["width", "width in", "item width"],
    "height_in": ["height", "height in", "item height"],
    "cost": ["cost", "unit cost", "landed cost", "supplier cost", "cogs"],
}

TEXT_FIELDS = {"asin", "title", "category"}


def _norm(header):
    return re.sub(r"[^a-z0-9]", "", header.lower())


_ALIASES = {_norm(alias): field for field, aliases in FIELDS.items() for alias in aliases}


def parse_number(value):
    """'$1,299.99' -> 1299.99, '4.5 out of 5' -> 4.5; blanks and junk -> None."""
    if value is None:
        return None
    match = re.search(r"-?\d[\d,]*(?:\.\d+)?|-?\.\d+", str(value))
    if not match:
        return None
    return float(match.group().replace(",", ""))


class CsvSource:
    """Reads a CSV export. Unknown columns are ignored."""

    def __init__(self, path):
        self.path = path

    def load(self):
        with open(self.path, newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            mapping = {}
            for header in reader.fieldnames or []:
                field = _ALIASES.get(_norm(header))
                if field and field not in mapping.values():
                    mapping[header] = field
            if "price" not in mapping.values():
                raise ValueError(
                    f"{self.path}: no price column found. Columns seen: {reader.fieldnames}"
                )
            rows = []
            for raw in reader:
                row = {field: None for field in FIELDS}
                for header, field in mapping.items():
                    value = raw.get(header)
                    if field in TEXT_FIELDS:
                        row[field] = (value or "").strip() or None
                    else:
                        row[field] = parse_number(value)
                if row["price"]:
                    rows.append(row)
            return rows
