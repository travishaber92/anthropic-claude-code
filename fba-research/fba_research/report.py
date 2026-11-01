"""Write ranked results to CSV and a self-contained HTML report."""

import csv
import html
from datetime import date

CSV_COLUMNS = [
    "rank", "score", "asin", "title", "category", "price", "est_monthly_sales", "sales_source",
    "reviews", "rating", "sellers", "size_tier", "referral_fee", "fulfillment_fee",
    "storage_fee", "inbound_shipping", "prep", "total_fees", "cost_used", "cost_known",
    "profit_per_unit", "margin", "roi", "max_cost_for_target_roi", "est_monthly_profit",
    "demand_score", "profit_score", "competition_score", "price_score", "opportunity_score",
    "flags",
]


def write_csv(results, path):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for i, r in enumerate(results, 1):
            writer.writerow({**r, "rank": i, "flags": "; ".join(r["flags"])})


def _money(v):
    return "" if v is None else f"${v:,.2f}"


def _whole(v):
    return "" if v is None else f"${v:,.0f}"


def _num(v):
    return "" if v is None else f"{v:,.0f}"


def _pct(v):
    return "" if v is None else f"{v * 100:.0f}%"


def _score_class(s):
    return "good" if s >= 65 else "ok" if s >= 45 else "bad"


def write_html(results, path, source_name):
    rows = []
    for i, r in enumerate(results, 1):
        title = html.escape(r.get("title") or "")
        asin = html.escape(r.get("asin") or "")
        link = f'<a href="https://www.amazon.com/dp/{asin}" target="_blank" rel="noopener">{asin}</a>' if asin else ""
        flags = "".join(f'<span class="flag">{html.escape(f)}</span>' for f in r["flags"])
        cost_note = "" if r["cost_known"] else " <small>(est.)</small>"
        rows.append(f"""<tr>
<td class="n">{i}</td>
<td class="n"><span class="score {_score_class(r['score'])}">{r['score']:.0f}</span></td>
<td><div class="title">{title}</div><div class="sub">{link} · {html.escape(r.get('category') or '')}</div><div>{flags}</div></td>
<td class="n" data-v="{r['price']}">{_money(r['price'])}</td>
<td class="n" data-v="{r['est_monthly_sales'] or 0}">{_num(r['est_monthly_sales'])}</td>
<td class="n" data-v="{r['total_fees']}">{_money(r['total_fees'])}</td>
<td class="n" data-v="{r['cost_used']}">{_money(r['cost_used'])}{cost_note}</td>
<td class="n" data-v="{r['profit_per_unit']}">{_money(r['profit_per_unit'])}</td>
<td class="n" data-v="{r['margin']}">{_pct(r['margin'])}</td>
<td class="n" data-v="{r['roi'] or 0}">{_pct(r['roi'])}</td>
<td class="n" data-v="{r['est_monthly_profit'] or 0}">{_whole(r['est_monthly_profit'])}</td>
<td class="n" data-v="{r['max_cost_for_target_roi']}">{_money(r['max_cost_for_target_roi'])}</td>
<td class="n" data-v="{r.get('reviews') or 0}">{_num(r.get('reviews'))}</td>
<td class="n" data-v="{r.get('sellers') or 0}">{_num(r.get('sellers'))}</td>
</tr>""")

    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FBA Product Research</title>
<style>
:root {{ --bg:#fff; --fg:#1d1d1f; --muted:#6b6b70; --line:#e4e4e7; --head:#f6f6f7;
  --good:#1a7f37; --ok:#9a6700; --bad:#cf222e; --flag:#f1f1f3; }}
@media (prefers-color-scheme: dark) {{ :root {{ --bg:#111113; --fg:#ececee; --muted:#9b9ba1;
  --line:#2a2a2e; --head:#1a1a1d; --good:#4ac26b; --ok:#d4a72c; --bad:#ff6b6b; --flag:#232327; }} }}
body {{ background:var(--bg); color:var(--fg); font:14px/1.45 system-ui,-apple-system,sans-serif; margin:0; padding:24px 16px; }}
h1 {{ font-size:22px; margin:0 0 4px; }}
p.meta {{ color:var(--muted); margin:0 0 16px; }}
.wrap {{ overflow-x:auto; border:1px solid var(--line); border-radius:8px; }}
table {{ border-collapse:collapse; width:100%; min-width:1100px; }}
th, td {{ padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:top; text-align:left; }}
th {{ background:var(--head); position:sticky; top:0; cursor:pointer; white-space:nowrap; font-weight:600; }}
td.n, th.n {{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }}
.title {{ max-width:340px; }}
.sub {{ color:var(--muted); font-size:12px; }}
a {{ color:inherit; }}
.score {{ font-weight:700; }}
.good {{ color:var(--good); }} .ok {{ color:var(--ok); }} .bad {{ color:var(--bad); }}
.flag {{ display:inline-block; background:var(--flag); color:var(--muted); font-size:11px; border-radius:4px; padding:1px 6px; margin:3px 4px 0 0; }}
small {{ color:var(--muted); }}
</style></head><body>
<h1>FBA Product Research</h1>
<p class="meta">{len(results)} products from {html.escape(source_name)} · {date.today().isoformat()} ·
Fees and BSR-based sales are estimates. Click a column header to sort.</p>
<div class="wrap"><table id="t"><thead><tr>
<th class="n">#</th><th class="n">Score</th><th>Product</th><th class="n">Price</th><th class="n">Sales/mo</th>
<th class="n">Fees</th><th class="n">Cost</th><th class="n">Profit/unit</th><th class="n">Margin</th><th class="n">ROI</th>
<th class="n">Profit/mo</th><th class="n">Max cost</th><th class="n">Reviews</th><th class="n">Sellers</th>
</tr></thead><tbody>
{''.join(rows)}
</tbody></table></div>
<script>
document.querySelectorAll('#t th').forEach((th, col) => {{
  let asc = false;
  th.addEventListener('click', () => {{
    asc = !asc;
    const body = document.querySelector('#t tbody');
    const val = tr => {{ const td = tr.children[col]; return td.dataset.v !== undefined ? parseFloat(td.dataset.v) : (parseFloat(td.textContent) || td.textContent); }};
    [...body.rows].sort((a, b) => {{ const x = val(a), y = val(b); return (x > y ? 1 : x < y ? -1 : 0) * (asc ? 1 : -1); }})
      .forEach(r => body.appendChild(r));
  }});
}});
</script>
</body></html>"""
    with open(path, "w", encoding="utf-8") as f:
        f.write(doc)
