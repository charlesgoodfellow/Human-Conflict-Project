# Task: population baselines and currency dates

For each event in your assigned file, return ONE object:

{
  "id": "<exactly the id from the input>",
  "baselinePop": 1300000,
  "baselineWhat": "The Palestinian Arab population of Mandate Palestine in 1947",
  "baselineNote": "Estimated at roughly 1.3 million by the 1945 Village Statistics and the UNSCOP report; the figure excludes the Jewish population of about 600,000.",
  "baselineYear": 1947,
  "baselineSources": [{"title":"...","url":"https://..."}],
  "shareCaveat": "One sentence ONLY if the resulting percentage would mislead — e.g. the displaced figure counts repeat displacements, or spans generations, or the denominator grew a great deal over the event's span. Otherwise null.",
  "asOf": "2026-06",
  "asOfNote": "The displacement figure is OCHA's as of June 2026 and will move."
}

## baselinePop — the denominator
The population of the SPECIFIC GROUP OR TERRITORY the event acted upon, at the time it began — NOT world or national population unless the event genuinely acted on a whole nation.
- Nakba 1948 → the Palestinian Arab population of Mandate Palestine (~1.3m), not the population of the Middle East.
- Highland Clearances → the Highland and Island population of Scotland.
- Rwanda 1994 → Rwanda's population, since the state acted on the whole country.
- Assyrian deportations → the population of the conquered territories over the programme's span, if reconstructible; otherwise null.
State plainly in `baselineWhat` which population you chose. That field is shown to readers, so it must stand on its own.

`baselineNote` gives the evidentiary basis and names the source. For pre-modern events say what the reconstruction rests on — census, tax register, archaeological survey, or modern demographic modelling — and give a range where scholars differ.

**Set `baselinePop` to null** where no defensible denominator exists rather than inventing one, and explain why in `baselineNote`. That is a perfectly good answer, and is expected for many ancient and trans-regional events (the Atlantic slave trade has no single denominator; a multi-century programme spanning many polities may have none).

`baselineYear` — the year the baseline refers to.

## shareCaveat
The atlas divides the affected figure by the baseline to show a percentage. Flag anything that makes that ratio misleading: the numerator counting displacement *incidents* rather than people, an event spanning generations while the denominator is a single-year snapshot, or a numerator that includes people from outside the baseline group. Null when the ratio is sound.

## asOf — currency
For events with an ONGOING or recently-updated figure, give the month or year the headline figure refers to, as "YYYY-MM" or "YYYY", plus one sentence in `asOfNote`. For closed historical events set both to null — a figure for the 1755 Acadian expulsion does not need a currency date.

## Rules
- Use WebSearch/WebFetch; verify every URL you cite by fetching it. Prefer national censuses and statistical offices, UN Population Division, Maddison Project, HYDE, UNHCR/OCHA/IDMC for current figures, and peer-reviewed historical demography (McEvedy & Jones, Biraben, Durand, Livi-Bacci) for pre-modern baselines.
- Be conservative. A wrong denominator produces a wrong percentage that looks authoritative, which is worse than a null.
- Neutrality: where a baseline is itself politically contested (the population of a disputed territory, the size of a minority a state disputes), give the range and attribute it.

Return ONLY a JSON array of these objects.
