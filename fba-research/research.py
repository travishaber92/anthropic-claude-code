#!/usr/bin/env python3
"""Rank FBA product candidates from a CSV export.

Usage:
    python3 research.py products.csv
    python3 research.py products.csv --out results --top 10 --config my_config.json
"""

import argparse
import json
import os
import sys

from fba_research.report import write_csv, write_html
from fba_research.scoring import rank_products
from fba_research.sources import CsvSource

HERE = os.path.dirname(os.path.abspath(__file__))


def main(argv=None):
    p = argparse.ArgumentParser(description="Score and rank Amazon FBA product candidates.")
    p.add_argument("csv", help="CSV export of candidate products")
    p.add_argument("--config", default=os.path.join(HERE, "config.json"), help="fee/target/weight settings")
    p.add_argument("--out", default="results", help="output folder (default: results)")
    p.add_argument("--top", type=int, default=10, help="how many to print (default: 10)")
    args = p.parse_args(argv)

    with open(args.config, encoding="utf-8") as f:
        config = json.load(f)

    try:
        products = CsvSource(args.csv).load()
    except (OSError, ValueError) as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    if not products:
        print("No products with a price were found in the CSV.", file=sys.stderr)
        return 1

    results = rank_products(products, config)

    os.makedirs(args.out, exist_ok=True)
    csv_path = os.path.join(args.out, "ranked_products.csv")
    html_path = os.path.join(args.out, "report.html")
    write_csv(results, csv_path)
    write_html(results, html_path, os.path.basename(args.csv))

    print(f"{'#':>2}  {'Score':>5}  {'Price':>8}  {'Sales/mo':>8}  {'Profit/u':>8}  {'ROI':>5}  Product")
    for i, r in enumerate(results[: args.top], 1):
        roi = f"{r['roi'] * 100:.0f}%" if r["roi"] is not None else "-"
        sales = f"{r['est_monthly_sales']:,}" if r["est_monthly_sales"] else "-"
        name = (r.get("title") or r.get("asin") or "")[:50]
        print(f"{i:>2}  {r['score']:>5.1f}  ${r['price']:>7.2f}  {sales:>8}  ${r['profit_per_unit']:>7.2f}  {roi:>5}  {name}")
    print(f"\nWrote {csv_path} and {html_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
