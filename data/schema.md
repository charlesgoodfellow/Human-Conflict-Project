# Entry schema — every field required, exactly these keys

{
  "id":"kebab-slug",
  "title":"Short event name",
  "startYear":-745,            // integer. NEGATIVE = BCE (-745 means 745 BCE). No year zero: use -1 then 1.
  "endYear":-727,
  "dateApprox":true,           // true where the dating is uncertain or conventional
  "type":"displacement" | "territory" | "both" | "confinement",
  "region":"Europe & Northern Eurasia" | "Balkans, Anatolia & the Caucasus" | "Middle East & North Africa" | "Sub-Saharan Africa" | "South & Central Asia" | "East & Southeast Asia" | "Americas" | "Oceania",
  "actors":"Who did what to whom, one short clause",
  "peopleDisplaced":150000,    // best central estimate, or null if no defensible figure exists
  "peopleRange":"Human-readable range AND its evidentiary basis. For pre-modern events state plainly what the number rests on — royal inscriptions, chronicles, tax records, archaeology, modern demographic reconstruction — and whether the figures are literal or rhetorical.",
  "territoryKm2":null,
  "territoryDesc":null,
  "lat":36.36,"lon":43.15,
  "flows":[{"fromLat":32.0,"fromLon":35.2,"toLat":36.4,"toLon":43.2,"label":"Samaria → Assyrian heartland","people":27000}],
  "summary":"3–6 sentences. Neutral and factual: what happened, who was involved, the scale, the outcome. Where figures or characterizations are disputed, say so and give the range. For ancient events, say what the evidence actually is.",
  "contested":"One sentence on what specifically is disputed, or null",
  "sources":[{"title":"...","url":"https://..."}],
  "deathsLow":null,"deathsHigh":null,
  "deathsNote":"Who produced each end of the range and what drives the disagreement; or, if there was no significant death toll, say so plainly and explain.",
  "deathsBasis":"direct killing" | "conflict deaths incl. combatants" | "excess mortality incl. disease and starvation" | "deaths in transit or in camps" | null,
  "atrocityPrimary":false,
  "atrocityFindings":[{"body":"...","finding":"...","year":1948,"url":"https://..."}],
  "violenceForms":[],
  "violenceNote":"One sentence naming who documented the forms listed, or null if the array is empty."
}

## violenceForms — closed vocabulary
Use ONLY these exact strings, and ONLY where a named source documents that form for that specific event. Never infer a form from the fact that a conquest was violent. An empty array is a valid, honest answer.
"mass killing","summary execution","sexual violence","torture","starvation & siege","forced labour","enforced disappearance","abduction or transfer of children","arbitrary detention","destruction of homes & property","cultural or religious destruction","denationalization"

## atrocityPrimary
True ONLY where mass killing was the DEFINING act of the event rather than an accompaniment to moving, taking or holding. Be strict; expect a minority to qualify.

## atrocityFindings
Formal determinations by courts, tribunals, UN bodies, truth commissions, parliaments or governments. For pre-modern events this is almost always an empty array — do not stretch it. Modern scholarly consensus is NOT a formal finding; put that in `summary` instead.

## Rules that apply to every entry
- Use WebSearch/WebFetch and verify every URL you cite by fetching it.
- `lat`/`lon` must be real coordinates for the focal location. Flows need geographically sensible endpoints; an empty array is fine for confinement or where no movement is mapped.
- Include an event only if a state, empire, army or comparable authority took territory, moved a population against its will, held one in place, or committed mass killing of comparable scale. Exclude ordinary migration, famine with no policy driver, and battles without population consequences.
- NEUTRALITY IS ESSENTIAL. Attribute contested characterizations rather than adopting them. Where a modern state disputes a historical characterization (Turkey and the Armenian genocide; Russia and the Circassian expulsion; Japan and wartime forced labour and sexual slavery), state the competing positions and who holds them.
- Ancient and medieval figures are frequently propagandistic. Say so in `peopleRange` rather than laundering a chronicler's number into a clean total. Where modern scholarship has revised a figure sharply downward, give both and name the scholarship.
