# IIA scoring

BA calculator: sum Cust + P/P + Tech + Comp + CIF + CDF (negative floor at 0).

Band lookup: {0–1 VL, 2–4 L, 5–8 M, 9–12 MH, 13–16 H, 17–20 VH}.

PU per year column from rules config. Duration from lookup table, not fixed.

Always call `score_ba` tool — never compute score or PU inline.
