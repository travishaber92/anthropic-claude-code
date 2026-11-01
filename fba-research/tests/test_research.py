import json
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from fba_research.fees import estimate_fees, size_tier  # noqa: E402
from fba_research.scoring import rank_products, score_product  # noqa: E402
from fba_research.sources import CsvSource, parse_number  # noqa: E402

with open(os.path.join(ROOT, "config.json"), encoding="utf-8") as f:
    CONFIG = json.load(f)


def product(**kw):
    base = {k: None for k in ("asin", "title", "category", "bsr", "monthly_sales", "reviews",
                              "rating", "sellers", "weight_lb", "length_in", "width_in",
                              "height_in", "cost")}
    base.update(price=25.0)
    base.update(kw)
    return base


class TestParsing(unittest.TestCase):
    def test_parse_number(self):
        self.assertEqual(parse_number("$1,299.99"), 1299.99)
        self.assertEqual(parse_number("4.5 out of 5"), 4.5)
        self.assertEqual(parse_number("12%"), 12.0)
        self.assertIsNone(parse_number(""))
        self.assertIsNone(parse_number("-"))

    def test_csv_aliases(self):
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as f:
            f.write("ASIN,Product Name,Buy Box Price,Sales Rank,Review Count\n")
            f.write("B01,Thing,$19.99,\"1,500\",42\n")
            f.write("B02,No price,,100,1\n")
            path = f.name
        try:
            rows = CsvSource(path).load()
        finally:
            os.unlink(path)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["price"], 19.99)
        self.assertEqual(rows[0]["bsr"], 1500)
        self.assertEqual(rows[0]["reviews"], 42)
        self.assertEqual(rows[0]["title"], "Thing")


class TestFees(unittest.TestCase):
    def test_size_tiers(self):
        fees = CONFIG["fees"]
        self.assertEqual(size_tier([6, 4, 0.5], 0.3, fees), "small_standard")
        self.assertEqual(size_tier([10, 8, 4], 2, fees), "large_standard")
        self.assertEqual(size_tier([32, 6, 4], 9, fees), "oversize")
        self.assertEqual(size_tier(None, 1, fees), "unknown")

    def test_referral_minimum_and_category(self):
        cheap = estimate_fees(product(price=1.0), CONFIG)
        self.assertEqual(cheap["referral_fee"], 0.30)
        elec = estimate_fees(product(price=100.0, category="Electronics"), CONFIG)
        self.assertEqual(elec["referral_fee"], 8.00)


class TestScoring(unittest.TestCase):
    def test_good_beats_bad(self):
        good = product(price=30, monthly_sales=900, reviews=80, sellers=2, rating=4.0,
                       weight_lb=0.8, length_in=8, width_in=6, height_in=3, cost=5)
        bad = product(price=30, monthly_sales=40, reviews=15000, sellers=30, rating=4.8,
                      weight_lb=0.8, length_in=8, width_in=6, height_in=3, cost=5)
        ranked = rank_products([bad, good], CONFIG)
        self.assertIs(ranked[0]["monthly_sales"], 900)

    def test_unprofitable_capped(self):
        r = score_product(product(price=15, monthly_sales=5000, reviews=0, sellers=1, cost=20), CONFIG)
        self.assertIn("unprofitable", r["flags"])
        self.assertLessEqual(r["score"], 20)

    def test_assumed_cost_flagged(self):
        r = score_product(product(price=40, monthly_sales=500), CONFIG)
        self.assertFalse(r["cost_known"])
        self.assertIn("cost assumed", r["flags"])
        self.assertEqual(r["cost_used"], 10.0)

    def test_bsr_estimate(self):
        r = score_product(product(bsr=1000), CONFIG)
        self.assertEqual(r["sales_source"], "bsr_estimate")
        self.assertTrue(1000 < r["est_monthly_sales"] < 2000)

    def test_score_range(self):
        r = score_product(product(monthly_sales=100000, reviews=0, sellers=1, rating=3.0, cost=1,
                                  weight_lb=0.2, length_in=5, width_in=4, height_in=0.5), CONFIG)
        self.assertLessEqual(r["score"], 100)
        self.assertGreater(r["score"], 90)


if __name__ == "__main__":
    unittest.main()
