# FBA Product Research

Scores and ranks Amazon FBA product candidates from a CSV export. For each product it estimates fees, profit per unit, ROI, monthly sales and competition, then writes a ranked spreadsheet and a sortable HTML report.

Only Python 3.9+ is needed. There is nothing to install.

## Quick start

```bash
cd fba-research
python3 research.py sample_products.csv
```

The results go to `results/`:

- `ranked_products.csv`: every product with all estimates and sub-scores, for Excel or Sheets
- `report.html`: the same data as a sortable table you open in a browser

To use your own data, export products from Helium 10, Jungle Scout, Keepa or Seller Central and run:

```bash
python3 research.py my_export.csv --out results --top 20
```

## Input columns

Only **price** is required. Column names are matched loosely, so `Buy Box Price`, `price` and `Current Price` all count as price. Every other column is optional, and each one makes the score more accurate:

| Field | Accepted header examples | Used for |
|---|---|---|
| price | Price, Buy Box Price | fees, profit, price score |
| monthly_sales | Monthly Sales, Est. Monthly Sales | demand (preferred) |
| bsr | BSR, Sales Rank | demand (estimated when there's no sales column) |
| reviews, rating, sellers | Reviews, Rating, Sellers / FBA Sellers | competition and opportunity |
| weight_lb, length/width/height (in) | Weight (lb), Length, Width, Height | size tier and fulfillment fee |
| cost | Unit Cost, Landed Cost, COGS | profit and ROI (25% of price is assumed when missing) |
| asin, title, category | ASIN, Title, Category | display and category referral rates |

## How the score works (0–100)

| Part | Weight | Higher when… |
|---|---|---|
| Competition | 35% | fewer reviews on the listing, fewer sellers |
| Demand | 25% | more monthly sales (log scale, 100 → 1,000/mo) |
| Profit | 25% | net margin closer to the 30% target |
| Price | 10% | price between $20 and $50 |
| Opportunity | 5% | weak average rating, so a better product can win |

A product that loses money is capped at 20. Warnings appear as flags, for example `cost assumed`, `sales from BSR`, `oversize` and `price below minimum`.

**Max cost** is the highest landed unit cost that still reaches your target ROI (100% by default). Use it as your ceiling when you negotiate with suppliers.

## Tuning

Everything lives in `config.json`: fee tables, referral rates by category, storage, inbound shipping, prep cost, targets and score weights. Edit it, or point the tool at your own copy with `--config`.

**These are estimates.** The fee tables approximate US FBA rates. Check them against Amazon's FBA Revenue Calculator and update them whenever Amazon changes its fees. The BSR-to-sales curve is rough and varies a lot by category. Use a `Monthly Sales` column from your research tool when you have one, or add per-category curves under `assumptions.bsr_to_sales_by_category`, for example:

```json
"bsr_to_sales_by_category": { "Home & Kitchen": { "k": 900000, "exponent": 0.88 } }
```

## Tests

```bash
python3 -m unittest discover -s tests
```

## Next step: Amazon SP-API

Data loading is isolated in `fba_research/sources.py`. Each source returns rows with the same fields, so an SP-API source (live prices, sales rank and fee estimates through `getMyFeesEstimate`) can replace `CsvSource` without changes to the scoring or reports.
