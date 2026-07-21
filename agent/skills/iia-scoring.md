# IIA scoring

BA calculator: sum Cust + P/P + Tech + Comp + CIF + CDF (negative floor at zero).

Band lookup, PU per year, effort %, and duration come from `packages/rules` via the `score_ba` tool only — never from skills or inline arithmetic.

Always call `score_ba` — never compute score, band, or PU inline.
