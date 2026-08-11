#!/usr/bin/env python3
"""Build the Redrawn static site from the working files.

Usage:  SITE_URL=https://your.domain/ python3 build_site.py
Outputs everything into ./dist
"""
import json, os, re, shutil, html, datetime, csv, io

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_URL = os.environ.get('SITE_URL', 'https://redrawn.example').rstrip('/')
# BASE_PATH: set when the site is served from a subdirectory, e.g. a GitHub Pages
# project site at https://user.github.io/Repo -> BASE_PATH=/Repo
BASE = os.environ.get('BASE_PATH', '').rstrip('/')
DIST = os.path.join(ROOT, 'dist')
TODAY = datetime.date.today().isoformat()

EVENTS = json.load(open(os.path.join(ROOT, 'data/events.json')))
WORLD_PATH = os.path.join(ROOT, 'data/world.json')
D3_PATH = os.path.join(ROOT, 'vendor/d3.min.js')

CSS = open(os.path.join(ROOT, 'src/app.css')).read()
BODY = open(os.path.join(ROOT, 'src/body.html')).read()
APPJS = open(os.path.join(ROOT, 'src/app.js')).read()

TYPE_LABEL = {'displacement': 'Forced displacement', 'territory': 'Territory seized',
              'both': 'Territory and displacement', 'confinement': 'Population confined in place'}
FORM_SHORT = {"mass killing": "Mass killing", "summary execution": "Summary execution",
    "sexual violence": "Sexual violence", "torture": "Torture", "starvation & siege": "Starvation and siege",
    "forced labour": "Forced labour", "enforced disappearance": "Enforced disappearance",
    "abduction or transfer of children": "Abduction of children", "arbitrary detention": "Arbitrary detention",
    "destruction of homes & property": "Destruction of property",
    "cultural or religious destruction": "Cultural destruction", "denationalization": "Denationalization"}
TIER_SHORT = {'official': 'official', 'ngo': 'NGO', 'scholarly': 'scholarly',
              'reference': 'reference', 'press': 'press', 'openedited': 'open-edited'}
ERAS = [('Antiquity', -1600, 500), ('The medieval world', 500, 1450),
        ('Conquest and the slave trades', 1450, 1750), ('Empire, clearance and removal', 1750, 1900),
        ('The world wars', 1900, 1945), ("The war's long shadow", 1945, 1960),
        ('Empires unmade', 1960, 1975), ('Cold War proxies', 1975, 1990),
        ('After the Wall', 1990, 2000), ('The long emergencies', 2000, 2014),
        ('Borders by force again', 2014, 2026)]

def yr(y):
    return f"{abs(y)} BCE" if y < 0 else str(y)

def yrrange(a, b):
    if a == b: return yr(a)
    if a < 0 and b < 0: return f"{abs(a)}–{abs(b)} BCE"
    if a < 0 <= b: return f"{abs(a)} BCE – {b} CE"
    return f"{a}–{b}"

def span(e):
    if e.get('ongoing'): return f"{yr(e['startYear'])}–ongoing"
    return ('c. ' if e.get('dateApprox') else '') + yrrange(e['startYear'], e['endYear'])

def fmt(n):
    if n is None: return '—'
    if n >= 1e9: return f"{n/1e9:.1f} bn".replace('.0 ', ' ')
    if n >= 1e6:
        v = n/1e6
        return f"{v:.0f} million" if v >= 10 else f"{v:.1f} million".replace('.0 ', ' ')
    return f"{n:,.0f}"

def fmt_deaths(lo, hi):
    if lo is None or hi is None: return None
    if lo == hi: return fmt(lo)
    if hi >= 1e6:
        a, b = lo/1e6, hi/1e6
        fa = f"{a:.2f}".rstrip('0').rstrip('.') if a < 1 else (f"{a:.1f}".rstrip('0').rstrip('.') if a < 10 else f"{a:.0f}")
        fb = f"{b:.1f}".rstrip('0').rstrip('.') if b < 10 else f"{b:.0f}"
        return f"{fa}–{fb} million"
    return f"{lo:,}–{hi:,}"

def fmt_share(e):
    s = e.get('_share')
    if s is None: return None
    if s > 1.2: return f"{s:.1f}×"
    if s >= 0.01: return f"{s*100:.1f}%" if s < 0.1 else f"{s*100:.0f}%"
    return f"{s*100:.2f}%"

def esc(t):
    return html.escape(str(t), quote=True) if t is not None else ''

def era_of(e):
    for name, a, b in ERAS:
        if a <= e['startYear'] < b: return name
    return ERAS[-1][0]

def slugpath(eid):
    return f"events/{eid}.html"

# ---------------------------------------------------------------- shared chrome
SITE_CSS = """
:root{color-scheme:dark;--bg:#0b0b0d;--surface:#161618;--panel:#111113;--text:#fff;--text2:#c3c2b7;
 --muted:#8b8a83;--border:rgba(255,255,255,.10);--s1:#3987e5;--s2:#d95926;--s3:#199e70;--s4:#eef0ee;--crit:#d03b3b;--chip:#1e1e21}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);
 font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.65}
a{color:var(--s1)}
.wrap{max-width:760px;margin:0 auto;padding:0 22px 80px}
.wide{max-width:1080px}
header.site{border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:5}
header.site .inner{max-width:1080px;margin:0 auto;padding:12px 22px;display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}
header.site a.brand{font-weight:650;font-size:17px;color:var(--text);text-decoration:none;letter-spacing:.01em}
header.site nav{margin-left:auto;display:flex;gap:16px;font-size:14px}
header.site nav a{color:var(--text2);text-decoration:none}
header.site nav a:hover{color:var(--text)}
h1{font-size:30px;line-height:1.2;letter-spacing:-.02em;margin:34px 0 8px}
h2{font-size:20px;margin:34px 0 10px;letter-spacing:-.01em}
h3{font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin:28px 0 8px;font-weight:600}
p{color:var(--text2);margin:0 0 14px}
.meta{color:var(--muted);font-size:14px;margin:0 0 18px}
.badges{margin:0 0 18px}
.badge{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;padding:3px 10px;border-radius:999px;
 border:1px solid var(--border);background:var(--chip);color:var(--text2);margin:0 6px 6px 0}
.sw{width:9px;height:9px;border-radius:50%;display:inline-block}
.sw.sq{border-radius:2px}.sw.di{border-radius:1px;transform:rotate(45deg)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:18px 0 6px;align-items:start}
.stat{background:var(--chip);border:1px solid var(--border);border-radius:11px;padding:12px 14px}
.stat.wide{grid-column:1/-1}.stat.crit{border-color:rgba(208,59,59,.42)}
.stat .k{font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted)}
.stat .v{font-size:24px;font-weight:600;letter-spacing:-.02em;margin-top:2px;line-height:1.15}
.stat .n{font-size:12.5px;color:var(--muted);margin-top:4px;line-height:1.45}
.note{border-left:2px solid var(--s2);padding:2px 0 2px 12px;margin:6px 0 16px;color:var(--text2);font-size:15px}
.note.grey{border-left-color:var(--muted)}
.cta{display:inline-block;margin:8px 0 6px;background:var(--s1);color:#fff;text-decoration:none;
 padding:11px 18px;border-radius:10px;font-size:15px;font-weight:600}
.cta.ghost{background:var(--chip);color:var(--text);border:1px solid var(--border)}
ul.plain{list-style:none;padding:0;margin:0}
ul.plain li{padding:8px 0;border-bottom:1px solid var(--border);color:var(--text2);font-size:15px}
.tier{font-size:10.5px;padding:1px 7px;border-radius:999px;border:1px solid var(--border);color:var(--muted);margin-left:7px;white-space:nowrap}
.tier.official{color:var(--s1)}.tier.ngo{color:var(--s3)}.tier.scholarly{color:var(--s2)}
.forms span{display:inline-block;font-size:13px;padding:3px 10px;border-radius:999px;
 border:1px solid rgba(208,59,59,.42);background:rgba(208,59,59,.12);color:var(--text2);margin:0 6px 6px 0}
.flowrow{display:flex;justify-content:space-between;gap:14px}
.flowrow b{color:var(--text);font-weight:500}
.pager{display:flex;justify-content:space-between;gap:16px;margin:40px 0 0;border-top:1px solid var(--border);padding-top:18px;font-size:14px}
.pager a{text-decoration:none;max-width:46%}
.pager .lbl{display:block;color:var(--muted);font-size:12px;margin-bottom:3px}
footer.site{border-top:1px solid var(--border);margin-top:56px;padding:26px 22px 60px;color:var(--muted);font-size:13.5px}
footer.site .inner{max-width:1080px;margin:0 auto}
footer.site a{color:var(--text2)}
.idx{columns:2;column-gap:34px}
.idx a{display:block;text-decoration:none;color:var(--text2);padding:5px 0;font-size:14.5px;break-inside:avoid}
.idx a:hover{color:var(--text)}
.idx a .y{color:var(--muted);font-variant-numeric:tabular-nums}
.lede{font-size:18px;color:var(--text2);margin:0 0 22px}
.grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin:20px 0}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 16px}
.card .n{font-size:26px;font-weight:600;letter-spacing:-.02em}
.card .l{font-size:12.5px;color:var(--muted)}
@media(max-width:640px){.idx{columns:1}h1{font-size:25px}}
"""

def head(title, desc, canonical, extra=''):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE_URL}/{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Redrawn">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{SITE_URL}/{canonical}">
<meta property="og:image" content="{SITE_URL}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/site.css">
{extra}
</head>
<body>
<header class="site"><div class="inner">
  <a class="brand" href="/">Redrawn</a>
  <nav><a href="/">Map</a><a href="/events/">All events</a><a href="/about.html">Method</a><a href="/data/">Data</a></nav>
</div></header>
"""

FOOT = f"""
<footer class="site"><div class="inner">
<p><strong>Redrawn</strong> — an atlas of territory seized, populations displaced, confined and killed, from the earliest historical record to the present. {len(EVENTS)} events, 1600 BCE to 2026.</p>
<p>Text and data are published under a <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">Creative Commons Attribution 4.0 licence</a>. Reuse it, with credit. Each entry names its own sources; follow them — they carry detail this atlas cannot. Figures are estimates and many are contested; every entry says where.</p>
<p><a href="/data/">Download the dataset</a> · <a href="/about.html">Method and caveats</a> · Built {TODAY}.</p>
</div></footer>
</body></html>
"""

# ---------------------------------------------------------------- dist tree
if os.path.isdir(DIST): shutil.rmtree(DIST)
for d in ['assets', 'events', 'data']:
    os.makedirs(os.path.join(DIST, d), exist_ok=True)

# assets
shutil.copy(D3_PATH, os.path.join(DIST, 'assets/d3.min.js'))
shutil.copy(WORLD_PATH, os.path.join(DIST, 'assets/world.json'))
open(os.path.join(DIST, 'assets/app.css'), 'w').write(CSS)
open(os.path.join(DIST, 'assets/site.css'), 'w').write(SITE_CSS.strip())
open(os.path.join(DIST, 'assets/app.js'), 'w').write(
    "/* Redrawn — application. CC BY 4.0. */\nfunction startApp(WORLD, EVENTS){\n" + APPJS + "\n}\n")

# runtime data (strip derived fields that the app recomputes, keep the rest)
runtime = []
for e in EVENTS:
    o = {k: v for k, v in e.items() if k != '_search'}
    runtime.append(o)
open(os.path.join(DIST, 'assets/events.json'), 'w').write(json.dumps(runtime, ensure_ascii=False, separators=(',', ':')))

# public dataset copies
open(os.path.join(DIST, 'data/redrawn-events.json'), 'w').write(
    json.dumps({'name': 'Redrawn', 'license': 'CC BY 4.0', 'generated': TODAY,
                'count': len(EVENTS), 'events': runtime}, ensure_ascii=False, indent=1))
CSVCOLS = ['id','title','startYear','endYear','dateApprox','type','region','actors','peopleDisplaced','peopleRange',
 'baselinePop','baselineWhat','baselineYear','shareCaveat','asOf','settlers','territoryKm2','territoryDesc',
 'deathsLow','deathsHigh','deathsBasis','deathsNote','atrocityPrimary','violenceForms','violenceNote',
 'countries','summary','contested','sources']
buf = io.StringIO(); w = csv.writer(buf); w.writerow(CSVCOLS)
for e in EVENTS:
    row = []
    for c in CSVCOLS:
        v = e.get(c)
        if isinstance(v, list):
            v = ' | '.join(x['title'] + ' <' + x['url'] + '>' if isinstance(x, dict) else str(x) for x in v)
        row.append('' if v is None else v)
    w.writerow(row)
open(os.path.join(DIST, 'data/redrawn-events.csv'), 'w').write(buf.getvalue())

# static passthrough (host configs, .nojekyll) and licence
_static = os.path.join(ROOT, 'static')
if os.path.isdir(_static):
    for fn in os.listdir(_static):
        shutil.copy(os.path.join(_static, fn), os.path.join(DIST, fn))
for fn in ('LICENSE.txt', 'README.md'):
    _p = os.path.join(ROOT, fn)
    if os.path.exists(_p): shutil.copy(_p, os.path.join(DIST, fn))

# ---------------------------------------------------------------- index.html (the app)
LOADER = """
<div id="boot" style="position:fixed;inset:0;display:grid;place-items:center;background:var(--plane,#0b0b0d);z-index:999;color:#c3c2b7;font:14px system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="text-align:center;max-width:430px;padding:24px">
    <div style="font-size:19px;font-weight:650;color:#fff;letter-spacing:.01em;margin-bottom:8px">Redrawn</div>
    <div style="margin-bottom:20px;line-height:1.6">An atlas of territory seized, populations displaced, confined and killed — from the earliest historical record to the present.</div>
    <div id="bootbar" style="height:3px;background:#2c2c2a;border-radius:2px;overflow:hidden">
      <div id="bootfill" style="height:100%;width:12%;background:#3987e5;transition:width .35s"></div></div>
    <div id="bootmsg" style="margin-top:10px;font-size:12px;color:#8b8a83">Loading the record…</div>
    <noscript><div style="margin-top:18px;color:#fff">This map needs JavaScript. You can still <a style="color:#3987e5" href="/events/">browse all events as pages</a>.</div></noscript>
  </div>
</div>
<script src="/assets/d3.min.js"></script>
<script src="/assets/app.js"></script>
<script>
(function(){
  var fill=document.getElementById('bootfill'), msg=document.getElementById('bootmsg'), done=0;
  function step(){ done++; fill.style.width=(12+done*40)+'%'; }
  function fail(e){ msg.innerHTML='Could not load the data. <a style="color:#3987e5" href="/events/">Browse events as pages</a> instead.'; console.error(e); }
  Promise.all([
    fetch('/assets/world.json').then(function(r){ if(!r.ok) throw new Error('world'); return r.json(); }).then(function(v){ step(); return v; }),
    fetch('/assets/events.json').then(function(r){ if(!r.ok) throw new Error('events'); return r.json(); }).then(function(v){ step(); return v; })
  ]).then(function(a){
    fill.style.width='100%'; msg.textContent='Drawing the map…';
    setTimeout(function(){
      try { startApp(a[0], a[1]); } catch(e){ return fail(e); }
      var b=document.getElementById('boot');
      b.style.transition='opacity .35s'; b.style.opacity='0';
      setTimeout(function(){ b.remove(); }, 380);
    }, 30);
  }).catch(fail);
})();
</script>
"""

JSONLD_SITE = json.dumps({
    "@context": "https://schema.org", "@type": "Dataset",
    "name": "Redrawn — an atlas of territory seized, populations displaced, confined and killed",
    "description": f"{len(EVENTS)} sourced episodes of forced displacement, territorial seizure, confinement and mass violence, from 1600 BCE to 2026.",
    "url": SITE_URL + "/",
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "temporalCoverage": "-1600/2026",
    "keywords": ["forced displacement", "refugees", "annexation", "internment", "genocide", "historical atlas"],
    "distribution": [
        {"@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": SITE_URL + "/data/redrawn-events.json"},
        {"@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": SITE_URL + "/data/redrawn-events.csv"}]
}, ensure_ascii=False)

app_head = f"""<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Redrawn — An Atlas of Territory Seized, Populations Displaced and Confined</title>
<meta name="description" content="An interactive atlas of {len(EVENTS)} sourced episodes of forced displacement, territorial seizure, confinement and mass violence, from 1600 BCE to the present.">
<link rel="canonical" href="{SITE_URL}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Redrawn">
<meta property="og:title" content="Redrawn — an atlas of territory seized and populations displaced">
<meta property="og:description" content="{len(EVENTS)} sourced episodes, 1600 BCE to 2026, on an interactive map and globe.">
<meta property="og:url" content="{SITE_URL}/">
<meta property="og:image" content="{SITE_URL}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="preload" as="fetch" href="/assets/events.json" crossorigin>
<link rel="preload" as="fetch" href="/assets/world.json" crossorigin>
<link rel="stylesheet" href="/assets/app.css">
<script type="application/ld+json">{JSONLD_SITE}</script>
</head>
<body>
"""
open(os.path.join(DIST, 'index.html'), 'w').write(app_head + BODY + LOADER + "\n</body>\n</html>\n")

# ---------------------------------------------------------------- event pages
by_id = {e['id']: e for e in EVENTS}
order = sorted(EVENTS, key=lambda e: (e['startYear'], e['title']))
pos = {e['id']: i for i, e in enumerate(order)}

def shape_cls(t):
    return 'sq' if t == 'territory' else ('di' if t == 'both' else '')

def dot_style(t):
    if t == 'confinement': return 'background:transparent;border:1.5px dashed var(--s4)'
    return 'background:' + {'displacement': 'var(--s1)', 'territory': 'var(--s2)', 'both': 'var(--s3)'}[t]

def event_page(e):
    i = pos[e['id']]
    prev = order[i-1] if i > 0 else None
    nxt = order[i+1] if i < len(order)-1 else None
    desc = re.sub(r'\s+', ' ', (e.get('summary') or ''))[:180].rsplit(' ', 1)[0] + '…'
    ld = {"@context": "https://schema.org", "@type": "Article",
          "headline": e['title'], "description": desc,
          "about": {"@type": "Thing", "name": e['title']},
          "isPartOf": {"@type": "Dataset", "name": "Redrawn", "url": SITE_URL + "/"},
          "license": "https://creativecommons.org/licenses/by/4.0/",
          "temporalCoverage": f"{e['startYear']}/{e['endYear']}",
          "spatialCoverage": [{"@type": "Place", "name": c} for c in (e.get('countries') or [])][:8],
          "citation": [s['url'] for s in (e.get('sources') or [])]}
    extra = f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>'
    h = [head(f"{e['title']} — Redrawn", desc, slugpath(e['id']), extra)]
    a = h.append
    a('<div class="wrap">')
    a(f'<p class="meta" style="margin-top:26px"><a href="/events/">All events</a> · {esc(era_of(e))}</p>')
    a(f'<h1>{esc(e["title"])}</h1>')
    a(f'<p class="meta">{esc(span(e))} · {esc(e["region"])}</p>')
    a('<div class="badges">')
    a(f'<span class="badge"><span class="sw {shape_cls(e["type"])}" style="{dot_style(e["type"])}"></span>{TYPE_LABEL[e["type"]]}</span>')
    if e.get('ongoing'): a('<span class="badge">Ongoing</span>')
    if e.get('atrocityPrimary'): a('<span class="badge" style="border-color:rgba(208,59,59,.5);color:#d03b3b">Mass killing was the defining act</span>')
    a('</div>')

    a('<div class="stats">')
    if e.get('peopleDisplaced'):
        lbl = 'Confined' if e['type'] == 'confinement' else 'Displaced'
        a(f'<div class="stat"><div class="k">{lbl}</div><div class="v">{fmt(e["peopleDisplaced"])}</div><div class="n">{esc(e.get("peopleRange") or "")}</div></div>')
    if e.get('settlers'):
        a(f'<div class="stat"><div class="k">Settlers moved in</div><div class="v">{fmt(e["settlers"])}</div></div>')
    sh = fmt_share(e)
    if sh:
        bw = (e.get('baselineWhat') or 'the affected population')
        bw = bw[0].lower() + bw[1:]
        yrtxt = f", {yr(e['baselineYear'])}" if e.get('baselineYear') else ''
        a(f'<div class="stat"><div class="k">Share of the population affected</div><div class="v">{sh}</div><div class="n">of {esc(bw)}{esc(yrtxt)}</div></div>')
    dd = fmt_deaths(e.get('deathsLow'), e.get('deathsHigh'))
    if dd:
        a(f'<div class="stat crit wide"><div class="k">Killed</div><div class="v">{dd}</div><div class="n">{esc(e.get("deathsBasis") or "")}</div></div>')
    if e.get('territoryKm2'):
        a(f'<div class="stat wide"><div class="k">Territory</div><div class="v">{e["territoryKm2"]:,} km²</div><div class="n">{esc(e.get("territoryDesc") or "")}</div></div>')
    a('</div>')

    if e.get('asOfNote'):
        a(f'<p class="note grey"><strong>As of {esc(e.get("asOf"))}.</strong> {esc(e["asOfNote"])}</p>')
    a(f'<p><a class="cta" href="/#e={e["id"]}">Open on the interactive map →</a></p>')

    a('<h2>What happened</h2>')
    a(f'<p>{esc(e.get("summary") or "")}</p>')
    a('<h3>Parties</h3>')
    a(f'<p>{esc(e.get("actors") or "")}</p>')
    if e.get('contested'):
        a('<h3>Disputed</h3>'); a(f'<div class="note">{esc(e["contested"])}</div>')
    if e.get('baselineNote') or e.get('shareCaveat'):
        a('<h3>The denominator</h3>')
        if e.get('baselineNote'): a(f'<p>{esc(e["baselineNote"])}</p>')
        if e.get('shareCaveat'): a(f'<div class="note">{esc(e["shareCaveat"])}</div>')
    if e.get('deathsNote'):
        a('<h3>On the death toll</h3>'); a(f'<p>{esc(e["deathsNote"])}</p>')
    if e.get('violenceForms'):
        a('<h3>Documented forms of violence</h3>')
        a('<div class="forms">' + ''.join(f'<span>{FORM_SHORT.get(f, f)}</span>' for f in e['violenceForms']) + '</div>')
        if e.get('violenceNote'): a(f'<p style="font-size:14px">{esc(e["violenceNote"])}</p>')
    if e.get('atrocityFindings'):
        a('<h3>Formal findings</h3><ul class="plain">')
        for f in e['atrocityFindings']:
            yy = f' ({f["year"]})' if f.get('year') else ''
            link = f' — <a href="{esc(f["url"])}" rel="nofollow noopener">source</a>' if f.get('url') else ''
            a(f'<li><strong style="color:var(--text)">{esc(f.get("body"))}</strong>{yy} — {esc(f.get("finding"))}{link}</li>')
        a('</ul>')
    if e.get('flows'):
        a('<h3>Movements mapped</h3><ul class="plain">')
        for f in e['flows']:
            ppl = f'<b>{fmt(f.get("people"))}</b>' if f.get('people') else ''
            a(f'<li><span class="flowrow"><span>{esc(f.get("label") or "—")}</span>{ppl}</span></li>')
        a('</ul>')
    if e.get('countries'):
        a('<h3>Countries touched, on present-day borders</h3><p>' +
          ', '.join(esc(c) for c in e['countries']) + '</p>')

    a('<h3>Sources</h3>')
    if e.get('weakSources'):
        a('<div class="note grey">This entry rests only on reference, press or open-edited sources. Treat its figures as indicative and follow the links before relying on them.</div>')
    a('<ul class="plain">')
    for s in (e.get('sources') or []):
        t = f'<span class="tier {s.get("tier","")}">{TIER_SHORT.get(s.get("tier"), "")}</span>' if s.get('tier') else ''
        a(f'<li><a href="{esc(s["url"])}" rel="nofollow noopener">{esc(s["title"])}</a>{t}</li>')
    a('</ul>')
    for b in (e.get('baselineSources') or []):
        pass

    a('<div class="pager">')
    if prev: a(f'<a href="/{slugpath(prev["id"])}"><span class="lbl">← Earlier</span>{esc(prev["title"])}</a>')
    else: a('<span></span>')
    if nxt: a(f'<a href="/{slugpath(nxt["id"])}" style="text-align:right"><span class="lbl">Later →</span>{esc(nxt["title"])}</a>')
    else: a('<span></span>')
    a('</div>')
    a('</div>')
    h.append(FOOT)
    return '\n'.join(h)

for e in EVENTS:
    open(os.path.join(DIST, slugpath(e['id'])), 'w').write(event_page(e))

# ---------------------------------------------------------------- events index
def events_index():
    h = [head(f"All {len(EVENTS)} events — Redrawn",
              f"A complete chronological index of {len(EVENTS)} episodes of forced displacement, territorial seizure, confinement and mass violence, 1600 BCE to 2026.",
              "events/")]
    a = h.append
    a('<div class="wrap wide">')
    a(f'<h1>All {len(EVENTS)} events</h1>')
    a(f'<p class="lede">Every episode in the atlas, in chronological order, grouped by era. Each links to its own page; the <a href="/">interactive map</a> shows them in place and in time.</p>')
    for name, a0, b0 in ERAS:
        grp = [e for e in order if a0 <= e['startYear'] < b0] if name != ERAS[-1][0] else [e for e in order if e['startYear'] >= a0]
        if not grp: continue
        a(f'<h2 id="{re.sub(r"[^a-z]+","-",name.lower()).strip("-")}">{esc(name)} <span style="color:var(--muted);font-weight:400;font-size:15px">· {yrrange(a0,b0)} · {len(grp)} events</span></h2>')
        a('<div class="idx">')
        for e in grp:
            a(f'<a href="/{slugpath(e["id"])}">{esc(e["title"])} <span class="y">{esc(span(e))}</span></a>')
        a('</div>')
    a('</div>')
    h.append(FOOT)
    return '\n'.join(h)

open(os.path.join(DIST, 'events/index.html'), 'w').write(events_index())

# ---------------------------------------------------------------- about + data pages
def about_page():
    n_conf = sum(1 for e in EVENTS if e['type'] == 'confinement')
    n_weak = sum(1 for e in EVENTS if e.get('weakSources'))
    n_base = sum(1 for e in EVENTS if e.get('baselinePop'))
    n_deaths = sum(1 for e in EVENTS if e.get('_deaths') is not None)
    n_find = sum(len(e.get('atrocityFindings') or []) for e in EVENTS)
    n_src = sum(len(e.get('sources') or []) for e in EVENTS)
    h = [head("Method and caveats — Redrawn",
              "How the atlas was compiled: what counts, how figures and their ranges are handled, how contested framings are attributed, and where the evidence is weakest.",
              "about.html")]
    a = h.append
    a('<div class="wrap"><h1>Method and caveats</h1>')
    a('<p class="lede">Every mark is one episode in which a state, empire or armed force took territory, moved a population against its will, or held one in place. This page is the long version of what that means and where it fails.</p>')
    a('<div class="grid3">')
    for n, l in [(f"{len(EVENTS)}", "events"), (f"{n_src:,}", "sources"), (f"{n_base}", "population baselines"),
                 (f"{n_deaths}", "death ranges"), (f"{n_find}", "formal findings"), (f"{n_conf}", "confinement entries")]:
        a(f'<div class="card"><div class="n">{n}</div><div class="l">{l}</div></div>')
    a('</div>')
    a('''
<h2>What counts</h2>
<p>Four kinds of episode: <strong>territory seized</strong> — annexation, occupation, partition, or a border imposed by force; <strong>forced displacement</strong> — expulsion, population transfer, ethnic cleansing, or a mass exodus driven by violence; events that are <strong>both</strong>; and <strong>confinement</strong> — populations held in place through closed camps, internment systems, blockade, encampment law, or permit and closure regimes. Confinement is the mirror image of the rest: the same control over where a people may live, exercised by preventing movement rather than forcing it.</p>
<p>Inclusion is by scale and significance, so this is a survey of the major cases rather than a complete register. A few entries record something adjacent to a seizure and say so: a territory returned, a secession the parent state contests, a standing claim where nothing changed hands.</p>

<h2>About the numbers, and about ancient numbers in particular</h2>
<p>Figures before about 1800 rest on a different kind of evidence from figures after it, and the atlas does not pretend otherwise. Assyrian deportation totals come from royal inscriptions written to impress; Roman and medieval chroniclers inflate as a matter of convention; the Mongol tolls that circulated for centuries have been cut by an order of magnitude by modern scholarship. Each pre-modern entry says what its number rests on — a victor's monument, a chronicle, a tax register, archaeology, or a modern demographic reconstruction — and gives the reassessment where one exists. Compare a Bronze Age figure with a UNHCR one only with that difference in mind.</p>
<p>Nothing here sums cleanly. Territory figures overlap between events. Death ranges are built on different bases — direct killing, conflict deaths including combatants, excess mortality including disease and starvation, deaths in transit — which differ by an order of magnitude and must not be added naively. People displaced more than once are counted more than once.</p>

<h2>Violence, and why it is not a category</h2>
<p>Almost every event here involved violence, so a violence category would tag most of the atlas and stop telling you anything. Violence is recorded instead as three attributes: a <strong>death range</strong> with the sources for each end and a note on what drives the disagreement; a <strong>basis</strong>, because a war's conflict deaths and a genocide's direct killing are not the same measurement; and a set of <strong>documented forms</strong> — mass killing, summary execution, sexual violence, torture, starvation and siege, forced labour, enforced disappearance, abduction or transfer of children, arbitrary detention, destruction of property, cultural destruction, denationalization — recorded only where a named source documents that form for that specific event.</p>
<p>That rule matters both ways. A form missing from an event means no source consulted here documents it, not that it did not happen. A separate marker identifies the minority of events where mass killing was the defining act rather than an accompaniment.</p>

<h2>Proportion</h2>
<p>Three hundred thousand people displaced from a population of a million is a different event from three hundred thousand out of a hundred million. Where a defensible denominator exists, each entry carries the population of the specific group or territory the event acted on, with the year and the basis. Where none was defensible the field is empty rather than guessed. A few entries exceed their own baseline — a registered-refugee population that grows by descent, or a count of displacement incidents rather than people — and those are shown as a multiple, with a caveat naming the problem.</p>

<h2>On framing</h2>
<p>Several events here are described in incompatible ways by the parties to them. The summaries set out the competing characterizations and attribute them rather than picking one, and note findings by courts, tribunals, parliaments and commissions as facts about the record — naming the body, and recording rejections by the states concerned. Where you see "described by X as", that attribution is deliberate.</p>
''')
    a(f'''
<h2>Where the evidence is weakest</h2>
<p>Sources are tiered by publisher — official and treaty bodies, NGO and investigative reporting, scholarly work, reference works, press, and open-edited encyclopedias — and every citation shows its tier. <strong>{n_weak} of {len(EVENTS)} entries currently rest only on reference, press or open-edited sources.</strong> Those entries carry a warning above their source list, and the map's Evidence filter isolates them. This is published rather than hidden because it is the clearest thing a reader should know before relying on a figure, and the clearest thing a contributor could fix.</p>
<p>Country links are derived from where each event's points and mapped movements fall on <em>present-day</em> borders, so a 1945 event in East Prussia links to Poland and Russia — the countries whose territory it now is, not the ones that existed at the time.</p>

<h2>Licence and reuse</h2>
<p>Text and data are published under <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>. The complete dataset is available as <a href="/data/">JSON and CSV</a> with every field and source. If you find an error — and in a dataset this size there will be errors — the entry's own sources are the place to start, and corrections are welcome.</p>
<div class="pager"><a href="/">← Back to the map</a><a href="/events/" style="text-align:right">All events →</a></div>
</div>''')
    h.append(FOOT)
    return '\n'.join(h)

open(os.path.join(DIST, 'about.html'), 'w').write(about_page())

def data_page():
    jb = os.path.getsize(os.path.join(DIST, 'data/redrawn-events.json')) // 1024
    cb = os.path.getsize(os.path.join(DIST, 'data/redrawn-events.csv')) // 1024
    h = [head("Download the data — Redrawn",
              "The complete Redrawn dataset as JSON and CSV, under CC BY 4.0: every event, figure, range, source and formal finding.",
              "data/")]
    a = h.append
    a('<div class="wrap"><h1>The data</h1>')
    a(f'<p class="lede">All {len(EVENTS)} events with every field — figures and their ranges, death tolls and their bases, population baselines, documented forms of violence, formal findings, and every source with its tier.</p>')
    a(f'<p><a class="cta" href="/data/redrawn-events.json" download>Download JSON · {jb} KB</a> <a class="cta ghost" href="/data/redrawn-events.csv" download>Download CSV · {cb} KB</a></p>')
    a('''<h2>Fields</h2><ul class="plain">
<li><code>startYear</code>, <code>endYear</code> — integers; negative means BCE. <code>dateApprox</code> marks uncertain dating.</li>
<li><code>type</code> — displacement · territory · both · confinement.</li>
<li><code>peopleDisplaced</code> with <code>peopleRange</code> — central estimate and the range, with its basis in prose. On confinement entries this is the number confined.</li>
<li><code>baselinePop</code>, <code>baselineWhat</code>, <code>baselineYear</code>, <code>shareCaveat</code> — the denominator, what it is, and when the ratio misleads.</li>
<li><code>deathsLow</code>, <code>deathsHigh</code>, <code>deathsBasis</code>, <code>deathsNote</code> — the range, what it measures, and who disputes it.</li>
<li><code>violenceForms</code> — closed vocabulary; present only where a named source documents that form for that event.</li>
<li><code>atrocityFindings</code> — determinations by courts, tribunals, commissions and parliaments, with the disputing state's position where it exists.</li>
<li><code>sources</code> — each with a <code>tier</code>: official · ngo · scholarly · reference · press · openedited.</li>
<li><code>asOf</code> — the month or year an ongoing figure refers to.</li>
</ul>
<h2>Caveats that travel with the data</h2>
<p>Territory figures overlap between events and are not additive. Death ranges mix bases and must not be summed naively. People displaced more than once are counted more than once. Pre-modern figures rest on chronicles and reconstructions; read each entry's own range field before using its number. See <a href="/about.html">the method page</a>.</p>
<p>Licensed <a href="https://creativecommons.org/licenses/by/4.0/" rel="license">CC BY 4.0</a>. Please credit <em>Redrawn</em> and link back, and keep each entry's own sources attached where you can — they are the load-bearing part.</p>
</div>''')
    h.append(FOOT)
    return '\n'.join(h)

open(os.path.join(DIST, 'data/index.html'), 'w').write(data_page())

# 404
open(os.path.join(DIST, '404.html'), 'w').write(
    head("Not found — Redrawn", "That page does not exist.", "404.html") +
    '<div class="wrap"><h1>Not found</h1><p>That page does not exist. Try <a href="/">the map</a>, '
    '<a href="/events/">the full index of events</a>, or <a href="/about.html">the method page</a>.</p></div>' + FOOT)

# favicon
open(os.path.join(DIST, 'assets/favicon.svg'), 'w').write(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
    '<rect width="32" height="32" rx="7" fill="#161618"/>'
    '<circle cx="12" cy="13" r="5" fill="#3987e5" fill-opacity=".5" stroke="#3987e5" stroke-width="1.6"/>'
    '<rect x="17" y="17" width="9" height="9" rx="2" fill="#d95926" fill-opacity=".5" stroke="#d95926" stroke-width="1.6"/>'
    '</svg>')

# sitemap + robots
urls = ['', 'events/', 'about.html', 'data/'] + [slugpath(e['id']) for e in EVENTS]
sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    pri = '1.0' if u == '' else ('0.8' if u in ('events/', 'about.html', 'data/') else '0.6')
    sm.append(f'<url><loc>{SITE_URL}/{u}</loc><lastmod>{TODAY}</lastmod><priority>{pri}</priority></url>')
sm.append('</urlset>')
open(os.path.join(DIST, 'sitemap.xml'), 'w').write('\n'.join(sm))
open(os.path.join(DIST, 'robots.txt'), 'w').write(f"User-agent: *\nAllow: /\n\nSitemap: {SITE_URL}/sitemap.xml\n")

# ------------------------------------------------- rewrite root-absolute paths for BASE_PATH
if BASE:
    import glob as _g
    pat = [(re.compile(r'(href|src)="/(?!/)'), r'\1="' + BASE + '/'),
           (re.compile(r"fetch\('/(?!/)"), "fetch('" + BASE + "/"),
           (re.compile(r'url\(/(?!/)'), 'url(' + BASE + '/')]
    n = 0
    for f in _g.glob(os.path.join(DIST, '**', '*'), recursive=True):
        if not os.path.isfile(f): continue
        if not f.endswith(('.html', '.css', '.js', '.xml', '.webmanifest')): continue
        t = open(f, encoding='utf-8').read(); o = t
        for rx, rep in pat: t = rx.sub(rep, t)
        if t != o: open(f, 'w', encoding='utf-8').write(t); n += 1
    print(f"rewrote {n} files for BASE_PATH={BASE}")

print(f"built {len(EVENTS)} event pages into {DIST}")
