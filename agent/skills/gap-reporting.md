# Gap reporting

When manifest fields are missing, ambiguous, or contradictory:

1. Call `gap_report` with field id and impact ranking.
2. Widen confidence band per coverage model.
3. Flag status as `missing` or `contradictory` — never guess dimension scores or journey counts.

Correct behaviour for absent journey counts: flag + widen band, not inference.
