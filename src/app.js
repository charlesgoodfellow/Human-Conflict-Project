/* ==================================================== constants & state */
const TYPES=['displacement','territory','both','confinement'];
const TYPE_LABEL={displacement:'Forced displacement',territory:'Territory seized',both:'Territory + displacement',confinement:'Population confined in place'};
const TYPE_SHORT={displacement:'Displacement',territory:'Territory',both:'Both',confinement:'Confinement'};
const REGIONS=Array.from(new Set(EVENTS.map(e=>e.region))).sort();
const FLOW_STEPS=[0,20,40,80,140,240,Infinity];
const FLOW_LABEL=['None','Minimal','Light','Balanced','Dense','Very dense','All'];
const LIST_PAGE=60;
const TIER_LABEL={official:'Official',ngo:'NGO / investigative',scholarly:'Scholarly',reference:'Reference',press:'Press',openedited:'Open-edited'};
const TIER_SHORT={official:'official',ngo:'NGO',scholarly:'scholarly',reference:'reference',press:'press',openedited:'open-edited'};
const STRONG_TIERS=new Set(['official','ngo','scholarly']);
const lcFirst=t=>t?(t[0].toLowerCase()+t.slice(1)):t;
const fmtShare=e=>{
  if(e._share==null) return null;
  if(e._share>1.2) return `${e._share.toFixed(1)}\u00d7`;
  if(e._share>=0.01) return `${(e._share*100).toFixed(e._share<0.1?1:0)}%`;
  return `${(e._share*100).toFixed(2)}%`;
};
const FORMS=["mass killing","summary execution","sexual violence","torture","starvation & siege","forced labour","enforced disappearance","abduction or transfer of children","arbitrary detention","destruction of homes & property","cultural or religious destruction","denationalization"];
const FORM_SHORT={"mass killing":"Mass killing","summary execution":"Summary execution","sexual violence":"Sexual violence","torture":"Torture","starvation & siege":"Starvation & siege","forced labour":"Forced labour","enforced disappearance":"Enforced disappearance","abduction or transfer of children":"Abduction of children","arbitrary detention":"Arbitrary detention","destruction of homes & property":"Destruction of property","cultural or religious destruction":"Cultural destruction","denationalization":"Denationalization"};
const fmtDeaths=(lo,hi)=>{
  if(lo==null||hi==null) return null;
  if(lo===hi) return fmt(lo);
  if(hi>=1e6){ const a=lo/1e6,b=hi/1e6;
    return `${a<1?a.toFixed(2).replace(/0$/,''):a.toFixed(a<10?1:0).replace(/\.0$/,'')}–${b.toFixed(b<10?1:0).replace(/\.0$/,'')} million`; }
  return d3.format(',')(lo)+'–'+d3.format(',')(hi);
};
const ERAS=[
 {id:'e1',title:'Antiquity',from:-1600,to:500,share:10,blurb:"The first records of population as something a state moves. Egyptian and Hittite deportations from Canaan, the Neo-Assyrian programme that uprooted millions across three centuries, the Babylonian exile of Judah, Rome's destructions of Carthage and Jerusalem, and mass enslavement as the routine consequence of conquest. The numbers come from victors' monuments and must be read as such."},
 {id:'e2',title:'The medieval world',from:500,to:1450,share:10,blurb:"Empires move populations as administration. Byzantine transfers of Slavs and Armenians, the Arab conquests and the dhimma settlement, three slave-trade systems running at once across the Sahara, the Indian Ocean and the Baltic, the Mongol campaigns and the chroniclers' arithmetic that modern scholarship has cut by an order of magnitude, the Ottoman sürgün, and the expulsion of Europe's Jewish communities one kingdom at a time."},
 {id:'e3',title:'Conquest &amp; the slave trades',from:1450,to:1750,share:12,blurb:"The Atlantic opens and the scale changes. Iberian expulsions of Jews and Moriscos, the conquest of the Americas and the demographic collapse that followed it, the reducciones that resettled a million Andeans, the Atlantic slave trade in its first three centuries, the Manchu Great Clearance that emptied China's southern coast, Cromwell's Ireland, and the Thirty Years' War."},
 {id:'e4',title:'Empire, clearance &amp; removal',from:1750,to:1900,share:14,blurb:"Removal becomes policy, written into law. The Trail of Tears and the reservation system, the Highland Clearances, the Circassian expulsion from the Caucasus, the internal slave trade of the United States, the Congo Free State, indentured labour replacing slavery across the Indian Ocean, and the frontier wars of Australia, Argentina and Chile."},
 {id:'e5',title:'The world wars',from:1900,to:1945,share:14,blurb:"Concentration camps, genocide and the compulsory population exchange all acquire their modern form within four decades. The Boer and Cyrenaican camps, the Herero and Nama genocide, the Armenian genocide, the Greek–Turkish exchange codified at Lausanne, Soviet dekulakization and the Holodomor, the Gulag, and the Holocaust."},
 {id:'e6',title:"The war's long shadow",from:1945,to:1960,share:8,blurb:"The map is redrawn twice over. Twelve million Germans expelled from central and eastern Europe, Stalin's deported nationalities held under the special-settlement regime, Partition in South Asia, the war over Mandate Palestine, and the Korean War."},
 {id:'e7',title:'Empires unmade',from:1960,to:1975,share:8,blurb:"Decolonization moves borders faster than at any point since the war, and rarely peacefully. Algeria, Tibet, Goa, West Papua, Biafra, Bangladesh, and the Six-Day War; meanwhile settlement programmes quietly change who lives where."},
 {id:'e8',title:'Cold War proxies',from:1975,to:1990,share:8,blurb:"Superpower rivalry drives displacement on a continental scale — Cambodia's emptied cities, Vietnam's boat people, Afghanistan after 1979, Central America — while Turkey partitions Cyprus, Morocco takes Western Sahara and Indonesia takes East Timor."},
 {id:'e9',title:'After the Wall',from:1990,to:2000,share:6,blurb:"Yugoslavia and the Soviet Union come apart, and ethnic cleansing returns to Europe. Bosnia, Krajina, Kosovo, the Caucasus, and Rwanda's genocide with the Congo wars that follow it."},
 {id:'e10',title:'The long emergencies',from:2000,to:2014,share:5,blurb:"Displacement stops being an event and becomes a condition. Darfur, Iraq after 2003, eastern Congo, Sri Lanka's endgame, Colombia's slow attrition — and camp systems built as temporary shelters hardening into permanent places."},
 {id:'e11',title:'Borders by force again',from:2014,to:2026,share:5,blurb:"Annexation returns to Europe with Crimea and then Ukraine. ISIS carves out territory; Myanmar expels the Rohingya; Nagorno-Karabakh empties in a week; Sudan produces the largest displacement crisis in the world; Gaza is displaced within itself; and confinement systems hold millions in place."}
];
const TMIN=ERAS[0].from, TMAX=ERAS[ERAS.length-1].to;
const T_BREAKS=[ERAS[0].from].concat(ERAS.map(e=>e.to));
const T_POS=(()=>{ let c=0; const out=[0]; ERAS.forEach(e=>{ c+=e.share; out.push(c); }); return out.map(v=>v/c); })();
const yr=y=>y<0?Math.abs(y)+' BCE':String(y);
const yrRange=(a,b)=>{
  if(a===b) return yr(a);
  if(a<0&&b<0) return `${Math.abs(a)}–${Math.abs(b)} BCE`;
  if(a<0&&b>=0) return `${Math.abs(a)} BCE – ${b} CE`;
  return `${a}–${b}`;
};
const state={
  from:1900, to:2026, playing:false, speed:330, trail:false, view:'map', proj:'flat',
  types:new Set(TYPES), regions:new Set(REGIONS), q:'',
  selected:null, country:null, era:null, panel:'year', pins:[], autoZoomed:false,
  sortKey:'startYear', sortDir:1, atro:false, lethal:false, forms:new Set(),
  animate:true, showLegend:true, showTotals:true, showChapters:true,
  flowStep:3, listLimit:60, strongSrc:false, hasBase:false, sizeByShare:false
};

/* ==================================================== derived data */
EVENTS.forEach(e=>{
  e._people=e.peopleDisplaced||0;
  if(e._mag==null) e._mag=Math.max(e._people,(e.territoryKm2||0)*6,(e.settlers||0)*0.6);
  e._search=(e.title+' '+e.actors+' '+e.summary+' '+e.region+' '+(e.territoryDesc||'')+' '+
             (e.countries||[]).join(' ')+' '+(e.violenceForms||[]).join(' ')+' '+(e.flows||[]).map(f=>f.label).join(' ')).toLowerCase();
});
const BY_ID=new Map(EVENTS.map(e=>[e.id,e]));
const COUNTRY_INDEX=new Map();
EVENTS.forEach(e=>(e.countries||[]).forEach(c=>{
  if(!COUNTRY_INDEX.has(c)) COUNTRY_INDEX.set(c,[]);
  COUNTRY_INDEX.get(c).push(e.id);
}));
const rScale=d3.scaleSqrt().domain([0,d3.max(EVENTS,e=>e._mag)||1]).range([4.5,27]);
const sScale=d3.scaleSqrt().domain([0,1]).clamp(true).range([4.5,27]);
const markR=e=>(state.sizeByShare && e._share!=null) ? sScale(Math.min(1,e._share)) : rScale(e._mag);
const wScale=d3.scaleSqrt().domain([0,d3.max(EVENTS,e=>d3.max(e.flows||[],f=>f.people||0)||0)||1]).range([1,8]);
const color=t=>t==='displacement'?'var(--s1)':t==='territory'?'var(--s2)':t==='both'?'var(--s3)':'var(--s4)';
const HEX={displacement:'--s1',territory:'--s2',both:'--s3',confinement:'--s4'};
const peopleWord=e=>e.type==='confinement'?'confined':'displaced';
const fmt=n=>{ if(n==null) return '—';
  if(n>=1e9) return (n/1e9).toFixed(1).replace(/\.0$/,'')+' bn';
  if(n>=1e6) return (n/1e6).toFixed(n>=1e7?0:1).replace(/\.0$/,'')+' million';
  if(n>=1e3) return d3.format(',')(Math.round(n));
  return d3.format(',')(n); };
const fmtKm=n=>n==null?'—':d3.format(',')(n)+' km²';
const span=e=>e.ongoing?yr(e.startYear)+'–ongoing':(e.dateApprox?'c. ':'')+yrRange(e.startYear,e.endYear);
const shapeClass=t=>t==='territory'?'sq':t==='both'?'di':'';
const dotStyle=t=>t==='confinement'?'background:transparent;border:1.5px dashed var(--s4)':'background:'+color(t);

/* ==================================================== svg scaffolding */
const svg=d3.select('#map');
const defs=svg.append('defs');
defs.html(`
 <radialGradient id="oceanGrad" cx="50%" cy="42%" r="72%">
   <stop offset="0%" stop-color="var(--ocean-1)"/><stop offset="100%" stop-color="var(--ocean-2)"/>
 </radialGradient>
 <radialGradient id="globeGrad" cx="34%" cy="30%" r="78%">
   <stop offset="0%" stop-color="var(--ocean-1)"/>
   <stop offset="62%" stop-color="var(--ocean-1)"/>
   <stop offset="100%" stop-color="var(--ocean-2)"/>
 </radialGradient>
 <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
   <stop offset="86%" stop-color="var(--s1)" stop-opacity="0"/>
   <stop offset="98%" stop-color="var(--s1)" stop-opacity="0.20"/>
   <stop offset="100%" stop-color="var(--s1)" stop-opacity="0"/>
 </radialGradient>
 <radialGradient id="vig" cx="50%" cy="48%" r="76%">
   <stop offset="55%" stop-color="#000" stop-opacity="0"/>
   <stop offset="100%" stop-color="#000" stop-opacity="0.42"/>
 </radialGradient>
 <filter id="landblur" x="-12%" y="-12%" width="124%" height="124%">
   <feGaussianBlur stdDeviation="2.2"/>
 </filter>
 <filter id="glow" x="-70%" y="-70%" width="240%" height="240%">
   <feGaussianBlur stdDeviation="3.4" result="b"/>
   <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
 </filter>
 <filter id="softshadow" x="-30%" y="-30%" width="160%" height="160%">
   <feDropShadow dx="0" dy="1.6" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
 </filter>
 <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto-start-reverse">
   <path d="M0,1.4 L9,5 L0,8.6 z" fill="context-stroke"/>
 </marker>`);

const gBack=svg.append('g');
const gRoot=svg.append('g');
const gSphere=gRoot.append('g'), gGrat=gRoot.append('g'), gLandShadow=gRoot.append('g'),
      gLand=gRoot.append('g'), gAtmo=gRoot.append('g'),
      gFlow=gRoot.append('g'), gNode=gRoot.append('g');
const gVig=svg.append('g').attr('class','vignette');

const projFlat=d3.geoNaturalEarth1();
const projGlobe=d3.geoOrthographic().clipAngle(90);
let projection=projFlat, path=d3.geoPath(projection), W=0,H=0, baseScale=1, zoomK=1;
const graticule=d3.geoGraticule10();

function activeProjection(){ return state.proj==='globe'?projGlobe:projFlat; }

function layout(){
  const r=svg.node().getBoundingClientRect(); W=r.width; H=r.height;
  if(!W||!H) return;
  projection=activeProjection();
  if(state.proj==='globe'){
    projGlobe.translate([W/2,H/2]).scale(Math.min(W,H)/2.28*zoomK);
    baseScale=Math.min(W,H)/2.28;
  } else {
    projFlat.fitExtent([[8,8],[W-8,H-8]],{type:'Sphere'});
  }
  path=d3.geoPath(projection);
  gBack.selectAll('rect').data([0]).join('rect').attr('width',W).attr('height',H).attr('fill','url(#oceanGrad)')
    .attr('opacity',state.proj==='globe'?0:1);
  gVig.selectAll('rect').data([0]).join('rect').attr('width',W).attr('height',H).attr('fill','url(#vig)')
    .attr('opacity',getComputedStyle(document.documentElement).getPropertyValue('--glow').trim()==='0'?0:1);
  drawBase();
}
function drawBase(){
  gSphere.selectAll('path').data([{type:'Sphere'}]).join('path')
    .attr('d',path).attr('fill',state.proj==='globe'?'url(#globeGrad)':'none');
  gAtmo.selectAll('circle').data(state.proj==='globe'?[0]:[]).join('circle')
    .attr('cx',W/2).attr('cy',H/2).attr('r',projGlobe.scale()*1.055)
    .attr('fill','url(#atmo)').attr('pointer-events','none');
  gGrat.selectAll('path').data([graticule]).join('path').attr('class','graticule').attr('d',path);
  gLandShadow.selectAll('path').data(WORLD.features).join('path')
    .attr('d',path).attr('fill','#000').attr('opacity',0.34)
    .attr('transform','translate(0,1.2)').attr('filter','url(#landblur)').attr('pointer-events','none')
    .attr('display',getComputedStyle(document.documentElement).getPropertyValue('--glow').trim()==='0'?'none':null);
  const c=gLand.selectAll('path').data(WORLD.features).join('path')
    .attr('class',d=>'country hoverable'+(state.country===d.properties.name?' pickedC':''))
    .attr('d',path);
  c.on('click',(ev,d)=>{ ev.stopPropagation(); pickCountry(d.properties.name); })
   .on('mousemove',(ev,d)=>{
      const n=(COUNTRY_INDEX.get(d.properties.name)||[]).length;
      showTip(`<b>${d.properties.name}</b><span class="m">${n?n+' event'+(n===1?'':'s')+' on this map — click to open':'no events on this map'}</span>`,ev);
   })
   .on('mouseleave',hideTip);
}

/* ---------- zoom & rotate ---------- */
const zoom=d3.zoom().scaleExtent([1,16])
  .on('start',()=>svg.classed('dragging',true))
  .on('end',()=>svg.classed('dragging',false))
  .on('zoom',ev=>{
    if(state.proj==='globe'){
      zoomK=ev.transform.k; projGlobe.scale(baseScale*zoomK); drawBase(); render();
    } else {
      zoomK=ev.transform.k; gRoot.attr('transform',ev.transform); rescale(ev.transform.k);
    }
  });
svg.call(zoom).on('dblclick.zoom',null);

let rot=[-20,-12,0];
const drag=d3.drag()
  .on('start',()=>svg.classed('dragging',true))
  .on('drag',ev=>{
    if(state.proj!=='globe') return;
    const k=62/projGlobe.scale();
    rot=[rot[0]+ev.dx*k, Math.max(-82,Math.min(82,rot[1]-ev.dy*k)), 0];
    projGlobe.rotate(rot); drawBase(); render();
  })
  .on('end',()=>svg.classed('dragging',false));
svg.call(drag);

function rescale(k){
  gNode.selectAll('.node').attr('transform',d=>`translate(${proj(d)}) scale(${1/k})`);
  gFlow.selectAll('path').attr('stroke-width',function(){return this.__w/k;});
  gLand.attr('stroke-width',1/k);
}
const proj=d=>projection([d.lon,d.lat])||[-9999,-9999];
function visiblePt(lon,lat){
  if(state.proj!=='globe') return true;
  const r=projGlobe.rotate();
  return d3.geoDistance([lon,lat],[-r[0],-r[1]])<Math.PI/2-0.02;
}

/* ---------- arcs ---------- */
function arcPath(f){
  if(state.proj==='globe'){
    if(!visiblePt(f.fromLon,f.fromLat)||!visiblePt(f.toLon,f.toLat)) return null;
    const i=d3.geoInterpolate([f.fromLon,f.fromLat],[f.toLon,f.toLat]);
    const pts=[]; for(let t=0;t<=1.0001;t+=1/44){ const p=projection(i(t)); if(!p) return null; pts.push(p); }
    return d3.line().curve(d3.curveBasis)(pts);
  }
  const a=projection([f.fromLon,f.fromLat]), b=projection([f.toLon,f.toLat]);
  if(!a||!b) return null;
  const dx=b[0]-a[0], dy=b[1]-a[1], dist=Math.hypot(dx,dy);
  if(dist<1.5) return null;
  const bend=Math.min(0.30,36/Math.max(dist,36));
  return `M${a[0]},${a[1]}Q${(a[0]+b[0])/2-dy*bend},${(a[1]+b[1])/2+dx*bend} ${b[0]},${b[1]}`;
}

/* ==================================================== filtering */
function passes(e){
  if(!state.types.has(e.type)) return false;
  if(!state.regions.has(e.region)) return false;
  if(state.q && !e._search.includes(state.q)) return false;
  if(state.country && !(e.countries||[]).includes(state.country)) return false;
  if(state.atro && !e.atrocityPrimary) return false;
  if(state.lethal && e._deaths==null) return false;
  if(state.strongSrc && e.weakSources) return false;
  if(state.hasBase && e._share==null) return false;
  if(state.forms.size && !(e.violenceForms||[]).some(f=>state.forms.has(f))) return false;
  return true;
}
const phase=e=>e.startYear>state.to?'future':(e.endYear>=state.from?'active':'past');
const visibleEvents=()=>EVENTS.filter(e=>{
  if(!passes(e)) return false;
  const p=phase(e); return p==='active'||(p==='past'&&state.trail);
});
const activeNow=()=>EVENTS.filter(e=>passes(e)&&phase(e)==='active');
const startedBy=()=>EVENTS.filter(e=>passes(e)&&e.startYear<=state.to);

/* ==================================================== tooltip */
const tip=d3.select('#tip');
function showTip(html,ev){
  const wrap=document.getElementById('stage').getBoundingClientRect();
  tip.html(html).style('opacity',1);
  const t=tip.node().getBoundingClientRect();
  let x=ev.clientX-wrap.left+15, y=ev.clientY-wrap.top+15;
  if(x+t.width>wrap.width-8) x=ev.clientX-wrap.left-t.width-15;
  if(y+t.height>wrap.height-8) y=ev.clientY-wrap.top-t.height-15;
  tip.style('left',x+'px').style('top',y+'px');
}
const hideTip=()=>tip.style('opacity',0);

/* ==================================================== render */
let dashFlows=[];
function render(){
  if(!W) return;
  const k=state.proj==='globe'?1:zoomK;
  const vis=visibleEvents(), sel=state.selected;

  /* flows — capped when the window is crowded, so the map stays readable */
  const FLOW_CAP=FLOW_STEPS[state.flowStep];
  const flowSet = vis.length>FLOW_CAP
    ? new Set(vis.slice().sort((a,b)=>b._mag-a._mag).slice(0,FLOW_CAP).map(e=>e.id))
    : null;
  window.__flowCapped = flowSet ? vis.length-FLOW_CAP : 0;
  window.__flowShown = flowSet ? FLOW_CAP : vis.length;
  const rows=[];
  vis.forEach(e=>{
    if(sel ? sel!==e.id : (flowSet && !flowSet.has(e.id))) return;
    (e.flows||[]).forEach((f,i)=>{
      const d=arcPath(f); if(d) rows.push({e,f,d,key:e.id+'|'+i,active:phase(e)==='active'});
    });
  });
  const base=gFlow.selectAll('path.flow-base').data(rows,d=>d.key);
  base.exit().remove();
  base.enter().append('path').attr('class','flow-base').attr('marker-end','url(#ah)')
    .merge(base)
    .each(function(d){ this.__w=Math.max(1,wScale(d.f.people||0)); })
    .attr('d',d=>d.d).attr('stroke',d=>color(d.e.type))
    .attr('stroke-width',function(){return this.__w/k;})
    .attr('opacity',d=> sel?(sel===d.e.id?0.9:0.05):(d.active?0.55:0.10));

  const dashRows=state.animate?rows.filter(d=>(sel?sel===d.e.id:d.active)):[];
  const dash=gFlow.selectAll('path.flow-dash').data(dashRows,d=>d.key);
  dash.exit().remove();
  dash.enter().append('path').attr('class','flow-dash')
    .merge(dash)
    .each(function(d){ this.__w=Math.max(1,wScale(d.f.people||0)); })
    .attr('d',d=>d.d).attr('stroke',d=>color(d.e.type))
    .attr('stroke-width',function(){return Math.max(1.1,this.__w*0.55)/k;})
    .attr('stroke-dasharray',()=>`${5/k} ${16/k}`)
    .attr('opacity',0.95)
    .attr('filter',glowOn()?'url(#glow)':null);
  dashFlows=gFlow.selectAll('path.flow-dash').nodes();

  /* nodes */
  const shown=vis.filter(e=>visiblePt(e.lon,e.lat));
  const nd=gNode.selectAll('.node').data(shown,d=>d.id);
  nd.exit().remove();
  const en=nd.enter().append('g').attr('class','node')
    .on('mousemove',(ev,d)=>{ ev.stopPropagation(); showTip(
        `<b>${d.title}</b><span class="m">${span(d)} &middot; ${TYPE_LABEL[d.type]}</span>`+
        (d._people?`<div class="m">${fmt(d._people)} ${peopleWord(d)}</div>`:'')+
        (d.territoryKm2?`<div class="m">${fmtKm(d.territoryKm2)}</div>`:'')+
        (d._deaths!=null?`<div class="m" style="color:var(--crit)">${fmtDeaths(d.deathsLow,d.deathsHigh)} killed${d.atrocityPrimary?' · mass atrocity':''}</div>`:'')+
        `<div class="m" style="margin-top:4px;opacity:.7">Click for the full entry</div>`,ev); })
    .on('mouseleave',hideTip)
    .on('click',(ev,d)=>{ ev.stopPropagation(); hideTip(); selectEvent(d.id); });
  en.append('circle').attr('class','halo').attr('fill','none').attr('stroke-width',1.4);
  en.append('path').attr('class','mark');
  en.append('g').attr('class','atro');
  en.append('circle').attr('class','inner');
  en.append('circle').attr('class','hit');

  const all=en.merge(nd);
  all.attr('transform',d=>`translate(${proj(d)}) scale(${1/k})`);
  all.select('.mark')
    .attr('d',d=>{ const r=markR(d), A=Math.PI*r*r;
      if(d.type==='territory') return d3.symbol(d3.symbolSquare,A*0.92)();
      if(d.type==='both') return d3.symbol(d3.symbolDiamond,A*0.92)();
      return d3.symbol(d3.symbolCircle,A)(); })
    .attr('stroke-dasharray',d=>d.type==='confinement'?'4.5 3.5':null)
    .attr('fill',d=>color(d.type)).attr('stroke',d=>color(d.type))
    .attr('stroke-width',d=>sel===d.id?2.4:1.5)
    .attr('filter',d=>glowOn()&&(sel===d.id||(!sel&&phase(d)==='active'))?'url(#glow)':null)
    .attr('fill-opacity',d=>{ const b=d.type==='confinement'?0.10:0.32;
      return sel?(sel===d.id?b*1.6:0.035):(phase(d)==='active'?b:b*0.2); })
    .attr('stroke-opacity',d=>{ const hi=d.type==='confinement'?0.72:0.92, lo=d.type==='confinement'?0.18:0.24;
      return sel?(sel===d.id?Math.min(1,hi+0.25):0.10):(phase(d)==='active'?hi:lo); });
  all.select('.inner')
    .attr('r',d=>d.type==='confinement'?2.9:0).attr('fill',d=>color(d.type))
    .attr('fill-opacity',d=>sel?(sel===d.id?1:0.13):(phase(d)==='active'?0.95:0.28));
  all.select('.halo')
    .attr('r',d=>markR(d)+9).attr('stroke',d=>color(d.type))
    .attr('stroke-opacity',d=>sel===d.id?0.8:(state.pins.includes(d.id)?0.5:0))
    .attr('stroke-dasharray',d=>state.pins.includes(d.id)&&sel!==d.id?'2 3':null);
  all.select('.atro').each(function(d){
    const g=d3.select(this);
    if(!d.atrocityPrimary){ g.selectAll('*').remove(); return; }
    if(g.select('circle').empty()){
      g.append('circle').attr('fill','none').attr('stroke','var(--crit)');
      g.append('path').attr('stroke','var(--crit)').attr('stroke-linecap','round');
    }
    const r=Math.max(9,markR(d)*0.52);
    const on=state.selected?state.selected===d.id:phase(d)==='active';
    g.select('circle').attr('r',r).attr('stroke-width',1.7)
      .attr('stroke-opacity',state.selected&&state.selected!==d.id?0.12:(on?0.95:0.3));
    const q=r*0.5;
    g.select('path').attr('d',`M${-q},${-q} L${q},${q} M${q},${-q} L${-q},${q}`)
      .attr('stroke-width',1.7)
      .attr('stroke-opacity',state.selected&&state.selected!==d.id?0.12:(on?0.95:0.3));
  });
  document.getElementById('legAtro').toggleAttribute('hidden', !vis.some(e=>e.atrocityPrimary));
  const ls=document.getElementById('legSize');
  if(ls) ls.innerHTML = state.sizeByShare
    ? 'Scale of the event<br>(share of the population affected)'
    : 'Scale of the event<br>(people affected, or km&sup2;)';
  const fc=document.getElementById('legFlowCap');
  if(fc){ fc.toggleAttribute('hidden', !window.__flowCapped);
    fc.textContent = window.__flowCapped
      ? (FLOW_STEPS[state.flowStep]===0
          ? `Flow arcs are switched off; every event still shows its marker. Turn them back on under Display.`
          : `Arcs go to the ${window.__flowShown} largest events in view; ${window.__flowCapped} smaller ones show their marker only. Adjust the density under Display.`)
      : ''; }
  all.select('.hit').attr('r',d=>Math.max(13,markR(d)+5));
  all.sort((a,b)=>(phase(a)==='active')-(phase(b)==='active')||b._mag-a._mag);

  updateHUD();
  if(state.panel==='year') drawYearPanel();
}
const glowOn=()=>getComputedStyle(document.documentElement).getPropertyValue('--glow').trim()!=='0';

/* dash animation */
let dashOff=0, lastT=0;
function tick(t){
  if(!lastT) lastT=t;
  const dt=Math.min(64,t-lastT); lastT=t;
  if(state.animate && !document.hidden && dashFlows.length && state.view==='map'){
    dashOff-=dt*0.030;
    for(const n of dashFlows) n.setAttribute('stroke-dashoffset',dashOff);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

/* ==================================================== HUD */
function updateHUD(){
  const started=startedBy();
  const ppl=d3.sum(started,e=>e.type==='confinement'?0:(e._people||0));
  const conf=d3.sum(started.filter(e=>e.type==='confinement'),e=>e._people||0);
  const km=d3.sum(started,e=>e.territoryKm2||0);
  const dk=started.filter(e=>e._deaths!=null);
  const dkl=d3.sum(dk,e=>e.deathsLow), dkh=d3.sum(dk,e=>e.deathsHigh);
  document.getElementById('totals').innerHTML=`
    <div class="t" title="Every event begun by ${yr(state.to)}, summed across its whole span. People displaced more than once are counted more than once.">
      <div class="k">Displaced</div><div class="v">${fmt(ppl)}</div><div class="u">cumulative to ${yr(state.to)}</div></div>
    <div class="t" title="Confinement entries only, summed the same way."><div class="k">Confined</div><div class="v">${fmt(conf)}</div><div class="u">cumulative</div></div>
    <div class="t" title="Low and high ends of every sourced death range, added together. The bases differ — direct killing, conflict deaths, excess mortality — so this is an order of magnitude, not a count.">
      <div class="k">Killed</div><div class="v" style="color:var(--crit)">${dk?fmtDeaths(dkl,dkh):'—'}</div><div class="u">summed ranges, mixed bases</div></div>
    <div class="t" title="Territory figures overlap between events and are not additive; read as an order of magnitude.">
      <div class="k">Territory</div><div class="v">${d3.format('.2s')(km).replace('M','m').replace('k','k')}</div><div class="u">km², overlapping</div></div>`;
  const host=document.getElementById('hudTL'); let html='';
  if(state.era&&state.showChapters){
    const c=ERAS.find(x=>x.id===state.era);
    html+=`<div class="card chapcard"><div class="yr">${yrRange(c.from,c.to)}</div><h4>${c.title}</h4><p>${c.blurb}</p>
      <div class="nav"><button class="btn" id="chPrev">&larr; Previous</button><button class="btn" id="chNext">Next &rarr;</button><button class="btn" id="chExit">Close</button></div></div>`;
  }
  if(state.country){
    html+=`<div class="card countrycard" style="margin-top:${state.chapter?'8px':'0'}"><b>${state.country}</b>
      <span style="color:var(--muted);font-size:11.5px">${(COUNTRY_INDEX.get(state.country)||[]).length} events</span>
      <button id="clearCountry">clear</button></div>`;
  }
  host.innerHTML=html;
  const g=id=>document.getElementById(id);
  if(g('chPrev')) g('chPrev').onclick=()=>stepEra(-1);
  if(g('chNext')) g('chNext').onclick=()=>stepEra(1);
  if(g('chExit')) g('chExit').onclick=()=>{ state.era=null; drawTimeline(); updateHUD(); };
  if(g('clearCountry')) g('clearCountry').onclick=()=>pickCountry(null);
}

/* ==================================================== panel */
const panel=document.getElementById('panel');
function pinBar(){
  if(!state.pins.length) return '';
  return `<div class="pinbar"><span style="color:var(--muted)">Pinned</span>
    ${state.pins.map(id=>`<span class="px">${BY_ID.get(id).title.slice(0,26)}${BY_ID.get(id).title.length>26?'…':''}<button data-unpin="${id}" title="Unpin">×</button></span>`).join('')}
    ${state.pins.length>=2?`<button class="btn" id="cmpBtn">Compare</button>`:`<span style="color:var(--muted)">pin one more to compare</span>`}</div>`;
}
function wirePins(){
  panel.querySelectorAll('[data-unpin]').forEach(b=>b.onclick=()=>{
    state.pins=state.pins.filter(x=>x!==b.dataset.unpin); renderPanel(); render();
  });
  const c=document.getElementById('cmpBtn'); if(c) c.onclick=()=>{ state.panel='compare'; renderPanel(); };
}
function evRow(e){
  return `<li><button data-id="${e.id}">
    <span class="dot ${shapeClass(e.type)}" style="${dotStyle(e.type)}"></span>
    <span style="flex:1">${e.title}</span><span class="yr">${span(e)}</span></button></li>`;
}
function wireRows(){
  const rows=[...panel.querySelectorAll('button[data-id]')];
  rows.forEach((b,i)=>{
    b.onclick=()=>selectEvent(b.dataset.id);
    b.onkeydown=ev=>{
      if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){
        ev.preventDefault();
        const n=rows[i+(ev.key==='ArrowDown'?1:-1)];
        if(n) n.focus();
        else if(ev.key==='ArrowDown'){ const lm=document.getElementById('loadMore')||document.getElementById('loadMoreC'); if(lm) lm.focus(); }
      } else if(ev.key==='Home'){ ev.preventDefault(); rows[0].focus(); }
      else if(ev.key==='End'){ ev.preventDefault(); rows[rows.length-1].focus(); }
    };
  });
}
function renderPanel(){
  if(state.panel==='about') return drawAbout();
  if(state.panel==='compare') return drawCompare();
  if(state.panel==='event') return drawEventPanel(BY_ID.get(state.selected));
  if(state.panel==='country') return drawCountryPanel();
  drawYearPanel();
}
function drawYearPanel(){
  const act=eventsInWindow().sort((a,b)=>b._mag-a._mag);
  const ppl=d3.sum(act,e=>e._people||0);
  const withD=act.filter(e=>e._deaths!=null);
  const dl=withD.length?d3.sum(withD,e=>e.deathsLow):0, dh=withD.length?d3.sum(withD,e=>e.deathsHigh):0;
  const era=state.era?ERAS.find(e=>e.id===state.era):null;
  const shown=act.slice(0,state.listLimit);
  panel.innerHTML=pinBar()+`
    <h2>${yrRange(state.from,state.to)}</h2>
    <p class="meta">${era?era.title.replace(/&amp;/g,'&')+' · ':''}${act.length?'Events overlapping this window'+(state.country?' in '+state.country:''):'Nothing in this window on the current filters.'}</p>
    <div class="stats">
      <div class="stat"><div class="k">In view</div><div class="v">${act.length}</div><div class="n">events overlapping ${yrRange(state.from,state.to)}</div></div>
      <div class="stat"><div class="k">People affected</div><div class="v">${ppl?fmt(ppl):'—'}</div><div class="n">displaced or confined by these events across their whole span, not within the window alone</div></div>
      ${dl?`<div class="stat deathstat wide"><div class="k">Killed</div><div class="v">${fmtDeaths(dl,dh)}</div><div class="n">summed low and high ends; bases differ, so read as an order of magnitude</div></div>`:''}
    </div>
    ${era?`<h3>About this era</h3><p>${era.blurb}</p>`:''}
    <h3>In this window${act.length>shown.length?` — showing ${shown.length} of ${act.length}, largest first`:''}</h3>
    <ul class="evlist">${shown.map(evRow).join('')||'<li class="empty">Widen the window, or relax the filters.</li>'}</ul>
    ${act.length>shown.length?`<button class="loadmore" id="loadMore">Load ${Math.min(LIST_PAGE,act.length-shown.length)} more &middot; ${act.length-shown.length} remaining</button>`:''}`;
  const lm=document.getElementById('loadMore');
  if(lm) lm.onclick=()=>{ const t=panel.scrollTop; state.listLimit+=LIST_PAGE; drawYearPanel(); panel.scrollTop=t; };
  wirePins(); wireRows(); if(!lm||state.listLimit===LIST_PAGE) panel.scrollTop=0;
}
function drawEventPanel(e){
  if(!e) return drawYearPanel();
  const pinned=state.pins.includes(e.id);
  panel.innerHTML=pinBar()+`
    <button class="back" id="backBtn">&larr; Back</button>
    <h2>${e.title}</h2>
    <p class="meta">${span(e)} &middot; ${e.region}</p>
    <div><span class="badge"><span style="width:8px;height:8px;border-radius:${e.type==='territory'||e.type==='both'?'2px':'50%'};${dotStyle(e.type)}"></span>${TYPE_LABEL[e.type]}</span>${e.ongoing?'<span class="badge">Ongoing</span>':''}</div>
    <div class="stats stack">
      ${e._people?`<div class="stat"><div class="k">${e.type==='confinement'?'Confined':'Displaced'}</div><div class="v">${fmt(e._people)}</div><div class="n">${e.peopleRange||''}</div></div>`:''}
      ${e.settlers?`<div class="stat"><div class="k">Settlers moved in</div><div class="v">${fmt(e.settlers)}</div><div class="n">${e._people?'':(e.peopleRange||'')}</div></div>`:''}
      ${e._share!=null?`<div class="stat"><div class="k">Share of the population affected</div><div class="v">${fmtShare(e)}</div><div class="n">of ${lcFirst(e.baselineWhat)||'the affected population'}${e.baselineYear?`, ${yr(e.baselineYear)}`:''}${e._share>1.2?' — more than the baseline; see the caveat below':''}</div></div>`:''}
      ${e._deaths!=null?`<div class="stat deathstat wide"><div class="k">Killed</div><div class="v">${fmtDeaths(e.deathsLow,e.deathsHigh)}</div><div class="n">${e.deathsBasis||''}</div></div>`:''}
      ${e.territoryKm2?`<div class="stat"><div class="k">Territory</div><div class="v">${d3.format('~s')(e.territoryKm2).replace('G','bn').replace('M','m')} km²</div><div class="n">${e.territoryDesc||''}</div></div>`:''}
    </div>
    ${!e._people&&!e.territoryKm2&&e.territoryDesc?`<p class="meta">${e.territoryDesc}</p>`:''}
    <div class="actions">
      <button class="btn" id="pinBtn">${pinned?'Unpin':'Pin to compare'}</button>
      <button class="btn" id="flyBtn">Centre the map here</button>
      <button class="btn" id="citeBtn">Copy citation</button>
    </div>
    <h3>What happened</h3><p>${e.summary}</p>
    <h3>Parties</h3><p>${e.actors}</p>
    ${e.asOfNote?`<p class="asof"><b>As of ${e.asOf}.</b> ${e.asOfNote}</p>`:''}
    ${(e.baselineNote||e.shareCaveat)?`<h3>The denominator</h3>
      ${e.baselineNote?`<p>${e.baselineNote}</p>`:''}
      ${e.shareCaveat?`<div class="note">${e.shareCaveat}</div>`:''}
      ${(e.baselineSources||[]).length?`<ul class="srcs">${e.baselineSources.map(b=>`<li><a href="${b.url}" target="_blank" rel="noopener">${b.title}</a>${b.tier?` <span class="tier t-${b.tier}">${TIER_SHORT[b.tier]}</span>`:''}</li>`).join('')}</ul>`:''}`:''}
    ${e.deathsNote?`<h3>On the death toll</h3><p>${e.deathsNote}</p>`:''}
    ${(e.violenceForms||[]).length?`<h3>Documented forms of violence</h3>
      <div class="forms">${e.violenceForms.map(f=>`<span class="form-tag">${FORM_SHORT[f]||f}</span>`).join('')}</div>
      ${e.violenceNote?`<p style="font-size:12px">${e.violenceNote}</p>`:''}`:''}
    ${(e.atrocityFindings||[]).length?`<h3>Formal findings</h3><ul class="findings">${e.atrocityFindings.map(f=>
      `<li><b>${f.body}</b>${f.year?` (${f.year})`:''} — ${f.finding}${f.url?`<br><a href="${f.url}" target="_blank" rel="noopener">source</a>`:''}</li>`).join('')}</ul>`:''}
    ${e.contested?`<h3>Disputed</h3><div class="note">${e.contested}</div>`:''}
    ${(e.flows||[]).length?`<h3>Movements shown on the map</h3><ul class="flowlist">${e.flows.map(f=>`<li><span>${f.label||'—'}</span><span>${f.people?fmt(f.people):''}</span></li>`).join('')}</ul>`:''}
    ${(e.countries||[]).length?`<h3>Countries touched</h3><div>${e.countries.map(c=>`<button class="badge" data-country="${c}" style="cursor:pointer">${c}</button>`).join('')}</div>`:''}
    <h3>Sources</h3>
    ${e.weakSources?`<div class="note" style="border-left-color:var(--muted)">This entry rests only on reference, press or open-edited sources. Treat its figures as indicative and follow the links before relying on them.</div>`:''}
    <ul class="srcs">${(e.sources||[]).map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener">${s.title}</a>${s.tier?` <span class="tier t-${s.tier}">${TIER_SHORT[s.tier]}</span>`:''}</li>`).join('')}</ul>`;
  document.getElementById('backBtn').onclick=()=>selectEvent(null);
  document.getElementById('pinBtn').onclick=()=>{
    if(pinned) state.pins=state.pins.filter(x=>x!==e.id);
    else { state.pins.push(e.id); if(state.pins.length>2) state.pins.shift(); }
    renderPanel(); render();
  };
  document.getElementById('flyBtn').onclick=()=>focusEvent(e);
  document.getElementById('citeBtn').onclick=function(){
    navigator.clipboard.writeText(citationFor(e)).then(()=>{
      this.textContent='Copied'; setTimeout(()=>this.textContent='Copy citation',1600); }).catch(()=>{});
  };
  panel.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>pickCountry(b.dataset.country));
  wirePins(); panel.scrollTop=0;
}
function drawCountryPanel(){
  const list=(COUNTRY_INDEX.get(state.country)||[]).map(id=>BY_ID.get(id))
    .filter(e=>state.types.has(e.type))
    .sort((a,b)=>a.startYear-b.startYear);
  const ppl=d3.sum(list.filter(e=>e.type!=='confinement'),e=>e._people||0);
  const conf=d3.sum(list.filter(e=>e.type==='confinement'),e=>e._people||0);
  const wd=list.filter(e=>e._deaths!=null);
  const cdl=wd.length?d3.sum(wd,e=>e.deathsLow):0, cdh=wd.length?d3.sum(wd,e=>e.deathsHigh):0;
  panel.innerHTML=pinBar()+`
    <button class="back" id="backBtn">&larr; Back to the timeline</button>
    <h2>${state.country}</h2>
    <p class="meta">Every event on this map that touches ${state.country} — as a place people left, arrived in, were confined in, or whose territory changed hands.</p>
    <div class="stats">
      <div class="stat"><div class="k">Events</div><div class="v">${list.length}</div><div class="n">${list.length?list[0].startYear+' to '+Math.max(...list.map(e=>e.endYear)):''}</div></div>
      ${ppl?`<div class="stat"><div class="k">Displaced</div><div class="v">${fmt(ppl)}</div><div class="n">summed across events; people displaced more than once are counted more than once</div></div>`:''}
      ${conf?`<div class="stat"><div class="k">Confined</div><div class="v">${fmt(conf)}</div><div class="n">held in place by events linked to this country</div></div>`:''}
      ${cdl?`<div class="stat deathstat wide"><div class="k">Killed</div><div class="v">${fmtDeaths(cdl,cdh)}</div><div class="n">summed across these events; bases differ, so treat as an order of magnitude</div></div>`:''}
    </div>
    <h3>Timeline</h3><div class="ctimeline" id="ctl"></div>
    <h3>Events${list.length>state.listLimit?` — showing ${state.listLimit} of ${list.length}`:''}</h3>
    <ul class="evlist">${list.slice(0,state.listLimit).map(e=>{
      const roles=(e.countryRoles&&e.countryRoles[state.country])||[];
      return `<li><button data-id="${e.id}">
        <span class="dot ${shapeClass(e.type)}" style="${dotStyle(e.type)}"></span>
        <span style="flex:1">${e.title}<br><span style="color:var(--muted);font-size:11px">${roles.join(' · ')}</span></span>
        <span class="yr">${span(e)}</span></button></li>`;}).join('')||'<li class="empty">No events on the current type filters.</li>'}</ul>
    ${list.length>state.listLimit?`<button class="loadmore" id="loadMoreC">Load ${Math.min(LIST_PAGE,list.length-state.listLimit)} more &middot; ${list.length-state.listLimit} remaining</button>`:''}`;
  const lmc=document.getElementById('loadMoreC');
  if(lmc) lmc.onclick=()=>{ const t=panel.scrollTop; state.listLimit+=LIST_PAGE; drawCountryPanel(); panel.scrollTop=t; };
  document.getElementById('backBtn').onclick=()=>pickCountry(null);
  drawCountryTimeline(list);
  wirePins(); wireRows(); if(!lmc||state.listLimit===LIST_PAGE) panel.scrollTop=0;
}
function drawCountryTimeline(list){
  const host=d3.select('#ctl'); host.selectAll('*').remove();
  const w=Math.max(240,host.node().getBoundingClientRect().width||330), h=52;
  const s=host.append('svg').attr('viewBox',`0 0 ${w} ${h}`);
  const x=d3.scaleLinear().domain(T_BREAKS).range(T_POS.map(p=>p*w));
  ERAS.forEach((e,i)=>{ if(i%2===0) s.append('rect').attr('x',x(e.from)).attr('width',Math.max(1,x(e.to)-x(e.from)))
    .attr('y',0).attr('height',h-15).attr('fill','var(--chip)'); });
  s.append('line').attr('x1',1).attr('x2',w-1).attr('y1',h-12).attr('y2',h-12).attr('stroke','var(--axis)');
  [-1600,500,1450,1750,1900,1960,2026].forEach(y=>{
    s.append('line').attr('x1',x(y)).attr('x2',x(y)).attr('y1',h-15).attr('y2',h-9).attr('stroke','var(--axis)');
    s.append('text').attr('x',x(y)).attr('y',h-1)
      .attr('text-anchor',y===-1600?'start':y===2026?'end':'middle')
      .attr('fill','var(--muted)').style('font-size','8.5px').text(yr(y));
  });
  const lanes=5;
  list.forEach((e,i)=>{
    const yy=3+(i%lanes)*6.2;
    s.append('rect').attr('x',x(e.startYear)).attr('y',yy).attr('rx',2)
      .attr('width',Math.max(3,x(e.endYear)-x(e.startYear))).attr('height',4.8)
      .attr('fill',color(e.type)).attr('opacity',e.type==='confinement'?0.6:0.9)
      .style('cursor','pointer').on('click',()=>selectEvent(e.id))
      .append('title').text(`${e.title} (${span(e)})`);
  });
}
function drawCompare(){
  const [a,b]=state.pins.map(id=>BY_ID.get(id));
  const rowsOf=(e)=>[
    ['Years',span(e)],['Region',e.region],['Type',TYPE_SHORT[e.type]],
    [e.type==='confinement'?'Confined':'Displaced', e._people?fmt(e._people):'—'],
    ['Killed', e._deaths!=null?fmtDeaths(e.deathsLow,e.deathsHigh):'—'],
    ['Basis', e.deathsBasis||'—'],
    ['Forms documented', (e.violenceForms||[]).length||'—'],
    ['Formal findings', (e.atrocityFindings||[]).length||'—'],
    ['Territory', e.territoryKm2?d3.format(',')(e.territoryKm2)+' km²':'—'],
    ['Flows mapped', (e.flows||[]).length||'—'],
    ['Countries', (e.countries||[]).length||'—'],
    ['Sources', (e.sources||[]).length]
  ];
  panel.innerHTML=pinBar()+`
    <button class="back" id="backBtn">&larr; Back</button>
    <h2>Side by side</h2>
    <p class="meta">Figures are central estimates. Ranges and disputed points are in each event's own entry.</p>
    <div class="cmp">
      ${[a,b].map(e=>`<div class="col"><h4>${e.title}</h4><div class="yr">${span(e)}</div>
        ${rowsOf(e).map(r=>`<div class="cmprow"><span>${r[0]}</span><span>${r[1]}</span></div>`).join('')}
        <button class="btn" style="margin-top:9px;width:100%" data-id="${e.id}">Open</button></div>`).join('')}
    </div>
    <h3>What each says is disputed</h3>
    ${[a,b].map(e=>`<p><b style="color:var(--text-primary)">${e.title}.</b> ${e.contested||'Nothing flagged as disputed.'}</p>`).join('')}`;
  document.getElementById('backBtn').onclick=()=>{ state.panel=state.selected?'event':'year'; renderPanel(); };
  wirePins(); wireRows(); panel.scrollTop=0;
}
function drawAbout(){
  panel.innerHTML=`
    <button class="back" id="backBtn">&larr; Back to the map</button>
    <h2>About this atlas</h2>
    <p>Every mark is one episode in which a state, empire or armed force took territory, moved a population against its will, or held one in place. The record runs from the earliest documented deportations of the Late Bronze Age to the present. Two handles on the timeline set the window: drag the left one back for deep history, the right one forward for the present, or click an era band to frame it. Press play to sweep the right handle forward and watch the record accumulate.</p>
    <p>The timeline is not linear. Antiquity and the medieval world are compressed and the last century is expanded, because a true linear track across three and a half millennia would squeeze the whole postwar period into a slice too narrow to use. The era bands mark where the scale changes.</p>
    <h3>What counts</h3>
    <p>Four kinds of episode: <strong>territory seized</strong> (annexation, occupation, partition, or a border imposed by force), <strong>forced displacement</strong> (expulsion, population transfer, ethnic cleansing, or a mass exodus driven by violence), events that are <strong>both</strong>, and <strong>confinement</strong> — populations held in place through closed camps, internment systems, blockade, encampment law, or permit and closure regimes. Confinement is the mirror image of the rest: the same control over where a people may live, exercised by preventing movement rather than forcing it.</p>
    <p>Inclusion is by scale and significance, so this is a survey of the major cases rather than a complete register — ${EVENTS.length} events across ${REGIONS.length} regions and roughly 3,600 years. A few entries record something adjacent to a seizure and say so: a territory returned (Sinai), a secession the parent state contests (Kosovo), a standing claim where nothing changed hands (Essequibo).</p>
    <h3>About the numbers, and about ancient numbers in particular</h3>
    <p>Figures before about 1800 rest on a different kind of evidence from figures after it, and the atlas does not pretend otherwise. Assyrian deportation totals come from royal inscriptions written to impress; Roman and medieval chroniclers inflate as a matter of convention; the Mongol tolls that circulated for centuries have been cut by an order of magnitude by modern scholarship. Each pre-modern entry says in its own range field what the number actually rests on — a victor's monument, a chronicle, a tax register, archaeology, or a modern demographic reconstruction — and gives the reassessment where one exists. Compare a Bronze Age figure with a UNHCR one only with that difference in mind.</p>
    <p>The large figure on each event is a central estimate; the line beneath gives the range. For many events the count is genuinely unsettled, and the disagreement is part of the history — the <em>Disputed</em> note says what specifically is contested, whether a figure, a legal status, or how the event should be described at all.</p>
    <p>The same applies to the death totals: they add ranges built on different bases, so read them as an order of magnitude and go to the individual entries for anything load-bearing.</p>
    <p>Two cautions on the running totals at the top right. They sum each event's whole-span figure from the year it starts, so they are a cumulative tally of events begun, not a snapshot of how many people were displaced in that year; and people displaced repeatedly are counted more than once. Territory does not add up cleanly either — Crimea sits inside the Ukraine invasion figure, Sinai inside the 1967 figure — so treat the km² total as an order of magnitude.</p>
    <h3>On framing</h3>
    <p>Several events here are described in incompatible ways by the parties to them. The summaries set out the competing characterizations and attribute them rather than picking one, and note findings by courts and UN bodies as facts about the legal record. Where you see "described by X as", that attribution is deliberate.</p>
    <h3>Reading the map</h3>
    <p>Mark size scales with the magnitude of the event. Shape and colour carry the category: filled circle for displacement, square for territory, diamond for both, dashed ring around a dot for confinement. The confinement mark is neutral ink rather than a fourth colour, because no fourth hue in this palette stays reliably distinguishable from the other three for colourblind readers. Arcs show direction of movement between approximate endpoints — schematic, not traced routes. Points sit at a focal location, not a precise centroid.</p>
    <p>Two things are limited for legibility, and neither hides an event or changes a figure. On the map, flow arcs are drawn for the largest events in view — set by the flow-arc density control under <em>Display</em>, from none to all; every event still shows its marker, and selecting one always draws its own arcs. In the sidebar, the list loads sixty at a time with a button for the rest. The counts, totals, charts and table always cover everything in the window.</p>
    <p>Keyboard: <kbd>/</kbd> focuses search, <kbd>j</kbd> and <kbd>k</kbd> move through the event list, arrow keys move between rows and along the timeline handles, <kbd>space</kbd> plays and pauses, <kbd>Esc</kbd> closes.</p>
    <p>Clicking a country shows every event linked to it. Those links are derived from where each event's points and flows fall on <em>present-day</em> borders, so a 1945 event in East Prussia links to Poland and Russia — the countries whose territory it now is, not the ones that existed at the time.</p>
    <h3>Violence: what is recorded and why it is not a category</h3>
    <p>Almost every event here involved violence, so a "violence" category would tag most of the map and stop telling you anything. Violence is recorded instead as three measured attributes on every event. A <strong>death range</strong>, low to high, with the sources for each end and a note on what drives the disagreement — because for many of these events the count is the argument. A <strong>basis</strong>, because a war's conflict deaths and a genocide's direct killing are not the same measurement and should not be added together: some ranges here count direct killing, others count excess mortality including disease and starvation, and the difference can be an order of magnitude. And a set of <strong>documented forms</strong> — mass killing, summary execution, sexual violence, torture, starvation and siege, forced labour, enforced disappearance, abduction or transfer of children, arbitrary detention, destruction of property, cultural destruction, denationalization — recorded only where a named source documents that form for that specific event.</p>
    <p>That last rule matters both ways. A form missing from an event means no source consulted here documents it, not that it did not happen; and a form listed is one an investigation, court or commission actually found. Filter by form to see the pattern, but read the absence carefully.</p>
    <p>Separately, a small number of events carry the <span style="color:var(--crit)">mass atrocity</span> marker: those where killing was the defining act rather than an accompaniment to moving or holding a population. That marker is drawn in a reserved warning colour with its own legend entry, deliberately outside the four categories. Formal findings by courts, tribunals and commissions — and rejections of those findings by the states concerned — are listed in each event's entry.</p>
    <h3>Proportion, and why it matters</h3>
    <p>Three hundred thousand people displaced from a population of a million is a different event from three hundred thousand out of a hundred million, and an absolute figure hides that. Where a defensible denominator exists, each entry carries the population of the specific group or territory the event acted on — not a national or world figure unless the event genuinely acted on one — with the year it refers to and what it rests on. Under <em>Display</em> you can size the marks by that share instead of by absolute magnitude, which redraws the map substantially: small populations subjected to total events move to the front.</p>
    <p>The ratio is fragile, and the atlas says where. Some numerators count displacement incidents rather than people; some span generations while the denominator is a single-year snapshot; a registered-refugee population that grows by descent can exceed its own baseline several times over, which is why a few entries read as a multiple rather than a percentage. Every one of those carries a caveat naming the problem, and where no denominator was defensible the field is empty rather than guessed.</p>
    <h3>Currency, and how the sources stack up</h3>
    <p>Figures for ongoing situations carry the month or year they refer to, so a Sudan or Gaza number can be read as the snapshot it is rather than a settled fact. Sources are tiered by publisher — official and treaty bodies, NGO and investigative reporting, scholarly work, reference works, press, and open-edited encyclopedias — and each citation shows its tier. That exposes an honest weakness: a substantial minority of entries currently rest only on reference, press or open-edited sources, and those entries say so in a note above their source list. The <em>Evidence</em> menu filters to events with a primary or scholarly source, a population baseline, or a recorded death toll, so the thinly-evidenced parts of the record can be isolated and read sceptically — or improved.</p>
    <h3>Sharing, citing and exporting</h3>
    <p><strong>Copy link</strong> in the header produces a URL that restores exactly what you are looking at — the window, every filter, the selected event, the view and the projection — so a particular reading of the record can be sent to someone else and arrive intact. <strong>Copy citation</strong> on any event gives you its figures and full source list as text. The table view exports the current slice as <strong>CSV or JSON</strong>, with every field and every source, so the data can be checked, reused or argued with outside this page.</p>
    <h3>Sources</h3>
    <p>Each event carries its own sources: UNHCR, OCHA, IDMC and ICRC reporting, UN documents and commission findings, ICJ and ICTY rulings, academic histories, and standard reference works. Follow them; they carry detail this map cannot.</p>
    <p style="color:var(--muted);font-size:12px;margin-top:18px">Built August 2026. Figures reflect the best available estimates at that time and will drift as ongoing events continue.</p>`;
  document.getElementById('backBtn').onclick=()=>{ state.panel=state.selected?'event':(state.country?'country':'year'); renderPanel(); };
  panel.scrollTop=0;
}

/* ==================================================== selection & focus */
function focusEvent(e){
  const pts=[[e.lon,e.lat]];
  (e.flows||[]).forEach(f=>{ pts.push([f.fromLon,f.fromLat],[f.toLon,f.toLat]); });
  if(state.proj==='globe'){
    const c=d3.geoCentroid({type:'MultiPoint',coordinates:pts});
    const target=[-c[0],-c[1],0];
    d3.transition().duration(760).tween('rot',()=>{
      const i=d3.interpolate(rot,target);
      return t=>{ rot=i(t); projGlobe.rotate(rot); drawBase(); render(); };
    });
    state.autoZoomed=true; return;
  }
  const xy=pts.map(p=>projFlat(p)).filter(p=>p);
  if(!xy.length) return;
  const x0=d3.min(xy,p=>p[0]), x1=d3.max(xy,p=>p[0]), y0=d3.min(xy,p=>p[1]), y1=d3.max(xy,p=>p[1]);
  const pad=120;
  const k=Math.max(1,Math.min(6,0.92/Math.max((x1-x0+pad)/W,(y1-y0+pad)/H)));
  svg.transition().duration(680).call(zoom.transform,
    d3.zoomIdentity.translate(W/2,H/2).scale(k).translate(-(x0+x1)/2,-(y0+y1)/2));
  state.autoZoomed=true;
}
function resetView(){
  if(state.proj==='globe'){ zoomK=1; projGlobe.scale(baseScale); drawBase(); render(); }
  else svg.transition().duration(520).call(zoom.transform,d3.zoomIdentity);
  state.autoZoomed=false;
}
function selectEvent(id){
  state.selected=id;
  const e=id?BY_ID.get(id):null;
  if(e){
    if(e.endYear<state.from||e.startYear>state.to){
      state.from=Math.min(state.from,e.startYear); state.to=Math.max(state.to,e.endYear);
      state.era=null; drawTimelineSel();
    }
    stop(); state.panel='event'; focusEvent(e);
  } else {
    state.panel=state.country?'country':'year';
    if(state.autoZoomed) resetView();
  }
  render(); renderPanel(); pushURL();
}
function pickCountry(name){
  state.country=(name&&name!==state.country)?name:null;
  state.selected=null;
  if(state.country){
    const list=(COUNTRY_INDEX.get(state.country)||[]).map(id=>BY_ID.get(id)).filter(e=>state.types.has(e.type));
    if(list.length && !list.some(e=>e.endYear>=state.from&&e.startYear<=state.to)){
      state.from=Math.min(state.from,d3.min(list,e=>e.startYear));
      state.to=Math.max(state.to,d3.max(list,e=>e.endYear));
      state.era=null; drawTimelineSel();
    }
  }
  state.panel=state.country?'country':'year';
  gLand.selectAll('path').attr('class',d=>'country hoverable'+(state.country===d.properties.name?' pickedC':''));
  drawTimeline(); render(); renderPanel(); buildSheets(); syncControls(); pushURL();
}
svg.on('click',()=>{ if(state.selected) selectEvent(null); });

/* ==================================================== timeline */
const tl=d3.select('#tl');
let tScale=d3.scaleLinear().domain(T_BREAKS).range(T_POS), TW=600;
const TH={band:0,bandH:15,dens0:17,dens1:45,rail:51,lab:62};

function clampY(y){ return Math.max(TMIN,Math.min(TMAX,Math.round(y))); }
function setWindow(a,b,keepEra){
  a=clampY(a); b=clampY(b);
  if(b-a<1){ if(a>TMIN) a=b-1; else b=a+1; }
  state.from=clampY(a); state.to=clampY(b);
  state.listLimit=LIST_PAGE;
  if(!keepEra) state.era=null;
  state.selected=null;
  if(state.panel==='event'||state.panel==='compare') state.panel=state.country?'country':'year';
  drawTimelineSel(); render(); if(state.panel!=='year') renderPanel();
  if(state.view!=='map') buildSheets();
  syncControls(); pushURL();
}
function eventsInWindow(){ return EVENTS.filter(e=>passes(e)&&e.endYear>=state.from&&e.startYear<=state.to); }

function drawTimeline(){
  const r=tl.node().getBoundingClientRect(); TW=Math.max(240,r.width);
  tScale=d3.scaleLinear().domain(T_BREAKS).range(T_POS.map(p=>p*TW));
  tl.selectAll('*').remove();

  /* era bands */
  const bands=tl.append('g');
  ERAS.forEach(e=>{
    const x0=tScale(e.from), x1=tScale(e.to), w=x1-x0;
    const g=bands.append('g').attr('class','era-band'+(state.era===e.id?' on':''))
      .on('click',()=>{ state.era=e.id; setWindow(e.from,e.to,true); drawTimeline(); renderPanel(); })
      ;
    g.append('title').text(`${e.title.replace(/&amp;/g,'&')} — ${yrRange(e.from,e.to)}. Click to frame this era.`);
    g.append('rect').attr('class','bg').attr('x',x0+0.5).attr('y',TH.band).attr('width',Math.max(1,w-1)).attr('height',TH.bandH).attr('rx',3);
    if(w>52) g.append('text').attr('class','era-lab').attr('x',x0+w/2).attr('y',TH.band+10.5)
      .attr('text-anchor','middle').text(()=>{
        const t=e.title.replace(/&amp;/g,'&');
        const max=Math.floor(w/5.6);
        return t.length>max? t.slice(0,Math.max(3,max-1))+'…' : t;
      });
  });

  /* density */
  const N=Math.min(520,Math.max(160,Math.round(TW)));
  const pts=d3.range(N+1).map(k=>{
    const x=k*TW/N, y=tScale.invert(x);
    return [x, EVENTS.filter(e=>passes(e)&&e.startYear<=y&&e.endYear>=y).length];
  });
  const yS=d3.scaleLinear().domain([0,d3.max(pts,p=>p[1])||1]).range([TH.dens1,TH.dens0]);
  tl.append('path').attr('class','tl-dens')
    .attr('d',d3.area().x(p=>p[0]).y0(TH.dens1).y1(p=>yS(p[1])).curve(d3.curveMonotoneX)(pts));
  tl.append('path').attr('class','tl-densline')
    .attr('d',d3.line().x(p=>p[0]).y(p=>yS(p[1])).curve(d3.curveMonotoneX)(pts));

  /* era boundary ticks */
  const g2=tl.append('g');
  T_BREAKS.forEach((y,k)=>{
    const x=tScale(y);
    g2.append('line').attr('class','tl-tick').attr('x1',x).attr('x2',x).attr('y1',TH.dens0-2).attr('y2',TH.rail+6);
    if(k%1===0) g2.append('text').attr('class','tl-ticklab').attr('x',x)
      .attr('y',TH.lab).attr('text-anchor',k===0?'start':k===T_BREAKS.length-1?'end':'middle').text(yr(y));
  });

  /* rail + selection + handles */
  const sel=tl.append('g').attr('id','tlsel');
  sel.append('rect').attr('class','tl-rail').attr('x',0).attr('y',TH.rail).attr('width',TW).attr('height',3.5).attr('rx',2);
  sel.append('rect').attr('class','tl-mask').attr('id','maskL').attr('x',0).attr('y',TH.dens0-2).attr('height',TH.dens1-TH.dens0+4);
  sel.append('rect').attr('class','tl-mask').attr('id','maskR').attr('y',TH.dens0-2).attr('height',TH.dens1-TH.dens0+4);
  sel.append('rect').attr('class','tl-sel').attr('id','selbar').attr('y',TH.rail).attr('height',3.5).attr('rx',2)
    .call(d3.drag().on('drag',ev=>{
      const span=state.to-state.from;
      const cx=tScale(state.from)+ (tScale(state.to)-tScale(state.from))/2 + ev.dx;
      const c=tScale.invert(Math.max(0,Math.min(TW,cx)));
      let a=Math.round(c-span/2), b=a+span;
      if(a<TMIN){a=TMIN;b=a+span;} if(b>TMAX){b=TMAX;a=b-span;}
      setWindow(a,b,true);
    }));
  ['from','to'].forEach(key=>{
    sel.append('circle').attr('class','tl-handle').attr('id','h_'+key).attr('r',7).attr('cy',TH.rail+1.7)
      .attr('tabindex',0).attr('role','slider').attr('aria-label',key==='from'?'Earliest year':'Latest year')
      .call(d3.drag().on('drag',ev=>{
        const y=clampY(tScale.invert(Math.max(0,Math.min(TW,ev.x))));
        if(key==='from') setWindow(Math.min(y,state.to-1),state.to,true);
        else setWindow(state.from,Math.max(y,state.from+1),true);
      }))
      .on('keydown',ev=>{
        const step=ev.shiftKey?10:1; let d=0;
        if(ev.key==='ArrowLeft') d=-step; else if(ev.key==='ArrowRight') d=step; else return;
        ev.preventDefault();
        const px=tScale(state[key])+d*(TW/260);
        const y=clampY(tScale.invert(Math.max(0,Math.min(TW,px))));
        key==='from'?setWindow(Math.min(y,state.to-1),state.to,true):setWindow(state.from,Math.max(y,state.from+1),true);
      });
  });
  /* click the density area to move the nearer handle */
  tl.append('rect').attr('x',0).attr('y',TH.dens0-2).attr('width',TW).attr('height',TH.dens1-TH.dens0+4)
    .attr('fill','transparent').style('cursor','crosshair')
    .on('click',ev=>{
      const x=d3.pointer(ev,tl.node())[0], y=clampY(tScale.invert(x));
      Math.abs(x-tScale(state.from))<Math.abs(x-tScale(state.to))
        ? setWindow(Math.min(y,state.to-1),state.to) : setWindow(state.from,Math.max(y,state.from+1));
    });
  drawTimelineSel();
}
function drawTimelineSel(){
  const x0=tScale(state.from), x1=tScale(state.to);
  tl.select('#selbar').attr('x',x0).attr('width',Math.max(2,x1-x0));
  tl.select('#h_from').attr('cx',x0); tl.select('#h_to').attr('cx',x1);
  tl.select('#maskL').attr('x',0).attr('width',Math.max(0,x0));
  tl.select('#maskR').attr('x',x1).attr('width',Math.max(0,TW-x1));
  tl.selectAll('.era-band').classed('on',(d,i)=>ERAS[i].id===state.era);
  const n=eventsInWindow().length;
  document.getElementById('winLabel').textContent=yrRange(state.from,state.to);
  document.getElementById('winCount').textContent=
    (state.era?ERAS.find(e=>e.id===state.era).title.replace(/&amp;/g,'&')+' · ':'')+
    `${n} event${n===1?'':'s'} in view`;
}

/* play sweeps the right handle */
let timer=null;
function play(){
  state.playing=true; document.getElementById('play').innerHTML='&#10073;&#10073;';
  if(state.to>=TMAX) setWindow(state.from,state.from+1,true);
  if(timer) clearInterval(timer);
  timer=setInterval(()=>{
    const px=tScale(state.to)+TW*0.0055*(620/state.speed);
    let nt=clampY(tScale.invert(Math.min(TW,px)));
    if(nt<=state.to) nt=state.to+1;
    if(nt>=TMAX){ setWindow(state.from,TMAX,true); stop(); return; }
    setWindow(state.from,nt,true);
  },state.speed);
}
function stop(){
  state.playing=false; document.getElementById('play').innerHTML='&#9654;';
  if(timer) clearInterval(timer); timer=null;
}
document.getElementById('play').onclick=()=>state.playing?stop():play();
document.querySelectorAll('#speed button').forEach(b=>b.onclick=()=>{
  state.speed=+b.dataset.ms;
  document.querySelectorAll('#speed button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  if(state.playing) play();
});
document.getElementById('allTime').onclick=()=>{ stop(); state.era=null; setWindow(TMIN,TMAX); drawTimeline(); renderPanel(); };
function setEra(id){
  const e=ERAS.find(x=>x.id===id);
  state.era=id; if(e) setWindow(e.from,e.to,true);
  drawTimeline(); renderPanel();
}
function stepEra(d){
  const i=ERAS.findIndex(e=>e.id===state.era);
  const n=ERAS[Math.max(0,Math.min(ERAS.length-1,(i<0?0:i)+d))];
  setEra(n.id);
}

/* ==================================================== filters */
function refresh(){ state.selected=null; state.listLimit=LIST_PAGE; if(state.panel==='event') state.panel='year';
  syncControls(); drawTimeline(); render(); renderPanel(); buildSheets(); pushURL(); }

const SWATCH={
  displacement:'<span class="sw round" style="background:var(--s1)"></span>',
  territory:'<span class="sw" style="background:var(--s2)"></span>',
  both:'<span class="sw diam" style="background:var(--s3)"></span>',
  confinement:'<span class="sw round" style="background:transparent;border:1.5px dashed var(--s4)"></span>'
};
const CHECK='<span class="box"><svg viewBox="0 0 12 12" width="9" height="9"><path d="M1.5 6.2 L4.4 9 L10.5 2.6" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
const opt=(kind,val,label,checked,extra)=>
  `<div class="opt" role="menuitemcheckbox" tabindex="0" data-kind="${kind}" data-val="${val}" aria-checked="${!!checked}">${CHECK}${extra||''}<span class="ot">${label}</span></div>`;

function buildMenus(){
  const body=k=>document.querySelector(`.dd[data-dd="${k}"] .popbody`);
  body('type').innerHTML=TYPES.map(t=>opt('type',t,TYPE_LABEL[t],state.types.has(t),SWATCH[t])).join('');
  body('region').innerHTML=REGIONS.map(r=>opt('region',r,r,state.regions.has(r))).join('');
  body('violence').innerHTML=
    `<div class="pophead">Layers</div>`+
    opt('atro','1','Mass atrocity layer only',state.atro,'<span class="xmark">&#10006;</span>')+
    `<div class="popsep"></div><div class="pophead">Documented forms</div>`+
    FORMS.map(f=>opt('form',f,FORM_SHORT[f],state.forms.has(f))).join('');
  body('evidence').innerHTML=
    `<div class="pophead">Show only events that have</div>`+
    opt('ev','lethal','A recorded death toll',state.lethal)+
    opt('ev','base','A population baseline',state.hasBase)+
    opt('ev','strong','An official, NGO or scholarly source',state.strongSrc)+
    `<div class="pophead" style="padding-top:9px">Note</div>
     <div style="padding:0 9px 8px;font-size:10.5px;color:var(--muted);line-height:1.4">
       Sources are tiered by publisher. ${EVENTS.filter(e=>e.weakSources).length} of ${EVENTS.length} events currently rest only on reference, press or open-edited sources — a real weakness, surfaced rather than hidden.</div>`;
  body('display').innerHTML=
    `<div class="pophead">Map</div>`+
    opt('disp','trail','Keep earlier events on the map',state.trail)+
    opt('disp','animate','Animate population flows',state.animate)+
    opt('disp','share','Size marks by share of population affected',state.sizeByShare)+
    `<div class="optrange">
       <div class="rl"><span>Flow arc density</span><span class="rv" id="flowVal">${FLOW_LABEL[state.flowStep]}</span></div>
       <input type="range" id="flowRange" min="0" max="${FLOW_STEPS.length-1}" step="1" value="${state.flowStep}" aria-label="Flow arc density, fewer to more">
       <div class="ends"><span>Fewer</span><span>More</span></div>
       <div class="rn">Arcs go to the largest events in view. Markers are never hidden.</div>
     </div>`+
    opt('disp','globe','Show as a globe',state.proj==='globe')+
    `<div class="popsep"></div><div class="pophead">Overlays</div>`+
    opt('disp','legend','Legend',state.showLegend)+
    opt('disp','totals','Running totals',state.showTotals)+
    opt('disp','chapters','Era narration card',state.showChapters);
  const fr=document.getElementById('flowRange');
  if(fr){
    fr.oninput=()=>{ state.flowStep=+fr.value;
      document.getElementById('flowVal').textContent=FLOW_LABEL[state.flowStep]; render(); };
    fr.onclick=ev=>ev.stopPropagation();
  }
  document.querySelectorAll('.opt').forEach(o=>{
    o.onclick=()=>toggleOpt(o.dataset.kind,o.dataset.val);
    o.onkeydown=ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); toggleOpt(o.dataset.kind,o.dataset.val); } };
  });
}
function toggleOpt(kind,val){
  if(kind==='type'){ state.types.has(val)?state.types.delete(val):state.types.add(val); if(!state.types.size) state.types=new Set(TYPES); }
  else if(kind==='region'){ state.regions.has(val)?state.regions.delete(val):state.regions.add(val); if(!state.regions.size) state.regions=new Set(REGIONS); }
  else if(kind==='form'){ state.forms.has(val)?state.forms.delete(val):state.forms.add(val); }
  else if(kind==='atro'){ state.atro=!state.atro; }
  else if(kind==='lethal'){ state.lethal=!state.lethal; }
  else if(kind==='ev'){
    if(val==='lethal') state.lethal=!state.lethal;
    if(val==='base') state.hasBase=!state.hasBase;
    if(val==='strong') state.strongSrc=!state.strongSrc;
  }
  else if(kind==='disp'){
    if(val==='trail'){ state.trail=!state.trail; }
    if(val==='animate'){ state.animate=!state.animate; }
    if(val==='share'){ state.sizeByShare=!state.sizeByShare; }
    if(val==='globe'){ setProjection(state.proj==='globe'?'flat':'globe'); }
    if(val==='legend'){ state.showLegend=!state.showLegend; }
    if(val==='totals'){ state.showTotals=!state.showTotals; }
    if(val==='chapters'){ state.showChapters=!state.showChapters; if(!state.showChapters) state.era=null; }
    applyDisplay(); syncControls(); render(); return;
  }
  refresh();
}
function applyDisplay(){
  document.querySelector('.legend').toggleAttribute('hidden',!state.showLegend);
  document.querySelector('.hud-tr').toggleAttribute('hidden',!state.showTotals);
  if(!state.showChapters) state.era=null;
  if(state.view==='map') layout();
}
function syncControls(){
  document.querySelectorAll('.opt').forEach(o=>{
    const k=o.dataset.kind, v=o.dataset.val; let on=false;
    if(k==='type') on=state.types.has(v);
    else if(k==='region') on=state.regions.has(v);
    else if(k==='form') on=state.forms.has(v);
    else if(k==='atro') on=state.atro;
    else if(k==='lethal') on=state.lethal;
    else if(k==='ev') on = v==='lethal'?state.lethal : v==='base'?state.hasBase : state.strongSrc;
    else if(k==='disp') on = v==='trail'?state.trail : v==='animate'?state.animate : v==='share'?state.sizeByShare :
      v==='globe'?state.proj==='globe' : v==='legend'?state.showLegend :
      v==='totals'?state.showTotals : state.showChapters;
    o.setAttribute('aria-checked',on);
  });
  const set=(k,txt,active)=>{
    const dd=document.querySelector(`.dd[data-dd="${k}"]`);
    dd.querySelector('.cnt').textContent=txt||'';
    dd.classList.toggle('active',!!active);
  };
  set('type', state.types.size===TYPES.length?'All':`${state.types.size} of ${TYPES.length}`, state.types.size!==TYPES.length);
  set('region', state.regions.size===REGIONS.length?'All':`${state.regions.size} of ${REGIONS.length}`, state.regions.size!==REGIONS.length);
  const vn=state.forms.size+(state.atro?1:0);
  set('violence', vn?String(vn):'Off', vn>0);
  const en=(state.lethal?1:0)+(state.hasBase?1:0)+(state.strongSrc?1:0);
  set('evidence', en?String(en):'Any', en>0);
  const dn=[state.trail,state.animate,state.showLegend,state.showTotals,state.showChapters].filter(Boolean).length;
  set('display', state.proj==='globe'?'Globe':'Map', false);
  const dirty=state.types.size!==TYPES.length||state.regions.size!==REGIONS.length||vn>0||en>0||state.q||state.country;
  document.getElementById('resetBtn').toggleAttribute('hidden',!dirty);
  const n=eventsInWindow().length;
  document.getElementById('resultCount').textContent = `${n} of ${EVENTS.length} events in view`;
  const gb=document.getElementById('globeBtn');
  if(gb){ gb.setAttribute('aria-pressed',state.proj==='globe');
    gb.innerHTML=state.proj==='globe'?'&#9635;':'&#9673;';
    gb.title=state.proj==='globe'?'Switch to the flat map':'Switch to the globe'; }
}
/* popover behaviour */
document.querySelectorAll('.dd').forEach(dd=>{
  const btn=dd.querySelector('.ddbtn'), pop=dd.querySelector('.pop');
  btn.onclick=ev=>{
    ev.stopPropagation();
    const open=pop.hasAttribute('hidden');
    closeMenus();
    if(open){ pop.removeAttribute('hidden'); btn.setAttribute('aria-expanded','true'); dd.classList.add('open'); }
  };
  dd.querySelectorAll('.popfoot button').forEach(b=>b.onclick=ev=>{
    ev.stopPropagation();
    const k=dd.dataset.dd, act=b.dataset.act;
    if(k==='type') state.types = act==='all'?new Set(TYPES):new Set(TYPES);
    if(k==='region') state.regions = new Set(REGIONS);
    if(k==='violence'){ state.forms.clear(); state.atro=false; }
    if(k==='evidence'){ state.lethal=false; state.hasBase=false; state.strongSrc=false; }
    refresh();
  });
});
function closeMenus(){
  document.querySelectorAll('.dd').forEach(d=>{
    d.querySelector('.pop').setAttribute('hidden','');
    d.querySelector('.ddbtn').setAttribute('aria-expanded','false');
    d.classList.remove('open');
  });
}
document.addEventListener('click',e=>{ if(!e.target.closest('.dd')) closeMenus(); });
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeMenus(); if(state.selected) selectEvent(null); return; }
  const tag=(e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'||e.metaKey||e.ctrlKey||e.altKey) return;
  if(e.key==='/'){ e.preventDefault(); document.getElementById('q').focus(); return; }
  if(e.key.toLowerCase()==='j'||e.key.toLowerCase()==='k'){
    const rows=[...panel.querySelectorAll('button[data-id]')];
    if(!rows.length) return;
    e.preventDefault();
    const cur=rows.indexOf(document.activeElement);
    const nx=e.key.toLowerCase()==='j'?Math.min(rows.length-1,cur+1):Math.max(0,cur<0?0:cur-1);
    rows[nx].focus();
  }
  if(e.key===' '&&state.view==='map'){ e.preventDefault(); state.playing?stop():play(); }
});
document.getElementById('resetBtn').onclick=()=>{
  state.types=new Set(TYPES); state.regions=new Set(REGIONS); state.forms.clear();
  state.atro=false; state.lethal=false; state.hasBase=false; state.strongSrc=false; state.q=''; state.country=null;
  document.getElementById('q').value='';
  gLand.selectAll('path').attr('class','country hoverable');
  state.panel='year'; refresh();
};
const qBox=document.getElementById('q'), qRes=document.getElementById('qres');
let qSel=-1, qHits=[];
function scoreEvent(e,q){
  const t=e.title.toLowerCase();
  if(t===q) return 100;
  if(t.startsWith(q)) return 80;
  if(t.includes(q)) return 60;
  if((e.countries||[]).some(c=>c.toLowerCase().includes(q))) return 40;
  if((e.actors||'').toLowerCase().includes(q)) return 30;
  if((e.violenceForms||[]).some(f=>f.includes(q))) return 20;
  if(e._search.includes(q)) return 10;
  return 0;
}
function runSearch(){
  const q=qBox.value.trim().toLowerCase();
  if(q.length<2){ qRes.setAttribute('hidden',''); qBox.setAttribute('aria-expanded','false'); qHits=[]; return; }
  qHits=EVENTS.map(e=>({e,s:scoreEvent(e,q)})).filter(x=>x.s>0)
    .sort((a,b)=>b.s-a.s||(b.e._mag||0)-(a.e._mag||0)).slice(0,14).map(x=>x.e);
  qSel=-1;
  qRes.innerHTML = qHits.length
    ? `<div class="qh">${qHits.length} match${qHits.length===1?'':'es'} — the map is filtered to all matches</div>`+
      qHits.map((e,i)=>`<div class="qrow" role="option" data-i="${i}" data-id="${e.id}">
        <span class="dot ${shapeClass(e.type)}" style="${dotStyle(e.type)}"></span>
        <span class="qt">${e.title}<span class="qm">${e.region} · ${TYPE_SHORT[e.type]}</span></span>
        <span class="qy">${span(e)}</span></div>`).join('')
    : `<div class="qempty">Nothing matches &ldquo;${qBox.value.trim()}&rdquo;.</div>`;
  qRes.removeAttribute('hidden'); qBox.setAttribute('aria-expanded','true');
  qRes.querySelectorAll('.qrow').forEach(r=>r.onclick=()=>openHit(BY_ID.get(r.dataset.id)));
}
function openHit(e){
  if(!e) return;
  qRes.setAttribute('hidden',''); qBox.setAttribute('aria-expanded','false');
  if(!passes(e)){ state.types.add(e.type); state.regions.add(e.region);
    state.atro=false; state.lethal=false; state.forms.clear(); state.country=null; syncControls(); }
  selectEvent(e.id);
}
let qt; qBox.addEventListener('input',()=>{
  runSearch();
  clearTimeout(qt); qt=setTimeout(()=>{ state.q=qBox.value.trim().toLowerCase(); refresh(); },220);
});
qBox.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'){ qRes.setAttribute('hidden',''); qBox.blur(); return; }
  if(!qHits.length) return;
  if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){
    ev.preventDefault(); qSel=Math.max(0,Math.min(qHits.length-1,qSel+(ev.key==='ArrowDown'?1:-1)));
    qRes.querySelectorAll('.qrow').forEach((r,i)=>r.classList.toggle('sel',i===qSel));
    const el=qRes.querySelector('.qrow.sel'); if(el) el.scrollIntoView({block:'nearest'});
  } else if(ev.key==='Enter'){ ev.preventDefault(); openHit(qHits[qSel<0?0:qSel]); }
});
qBox.addEventListener('focus',()=>{ if(qBox.value.trim().length>1) runSearch(); });
document.addEventListener('click',e=>{ if(!e.target.closest('.searchwrap')) qRes.setAttribute('hidden',''); });
document.getElementById('aboutBtn').onclick=()=>{ state.panel='about'; stop(); renderPanel(); };
document.getElementById('themeBtn').onclick=function(){
  const light=document.documentElement.getAttribute('data-theme')==='light';
  document.documentElement.setAttribute('data-theme',light?'dark':'light');
  this.textContent=light?'Light':'Dark';
  layout(); render(); buildSheets();
};
function setProjection(mode){
  state.proj=mode; zoomK=1; gRoot.attr('transform',null);
  svg.call(zoom.transform,d3.zoomIdentity); projGlobe.rotate(rot);
  layout(); render();
}
document.getElementById('globeBtn').onclick=()=>{ setProjection(state.proj==='globe'?'flat':'globe'); syncControls(); };
d3.select('#zin').on('click',()=>svg.transition().duration(260).call(zoom.scaleBy,1.55));
d3.select('#zout').on('click',()=>svg.transition().duration(260).call(zoom.scaleBy,1/1.55));
d3.select('#zreset').on('click',resetView);

/* ==================================================== views */
document.querySelectorAll('#viewSeg button').forEach(b=>b.onclick=()=>{
  state.view=b.dataset.view;
  document.querySelectorAll('#viewSeg button').forEach(x=>x.setAttribute('aria-pressed',x===b));
  document.getElementById('mainStage').toggleAttribute('hidden',state.view!=='map');
  document.getElementById('timeline').toggleAttribute('hidden',state.view!=='map');
  document.getElementById('charts').toggleAttribute('hidden',state.view!=='charts');
  document.getElementById('table').toggleAttribute('hidden',state.view!=='table');
  if(state.view==='map'){ stop(); layout(); drawTimeline(); render(); } else { stop(); buildSheets(); }
  pushURL();
});

/* ---------- charts ---------- */
function buildSheets(){
  if(state.view==='charts') buildCharts();
  if(state.view==='table') buildTable();
}
function axisBottom(g,x,h,ticks,fmtFn){
  let a=d3.axisBottom(x).tickSizeOuter(0);
  if(ticks) a=a.ticks(ticks);
  if(fmtFn) a=a.tickFormat(fmtFn);
  const ax=g.append('g').attr('class','axis').attr('transform',`translate(0,${h})`).call(a);
  ax.select('.domain').attr('stroke','var(--axis)');
  return ax;
}
function buildCharts(){
  const rows=eventsInWindow();
  const host=d3.select('#charts');
  host.html(`<p class="lead">${rows.length} events in the window ${yrRange(state.from,state.to)}${state.country?', touching '+state.country:''} on the current filters. Bars sum each event's whole-span figure into the era it began, so a long crisis lands in the era it started; people displaced more than once are counted more than once.</p><div class="chartgrid" id="cg"></div>`);
  const cg=d3.select('#cg');

  /* 1 — people by era, stacked by type */
  const eraOf=e=>{ for(const x of ERAS) if(e.startYear>=x.from&&e.startYear<=x.to) return x.id; return ERAS[ERAS.length-1].id; };
  const stack=ERAS.map(x=>{
    const o={d0:x.id,lab:x.title.replace(/&amp;/g,'&')};
    TYPES.forEach(t=>o[t]=d3.sum(rows.filter(e=>e.type===t&&eraOf(e)===x.id),e=>e._people||0));
    return o;
  });
  card(cg,'People displaced or confined, by era the event began','Stacked by category. Hover any segment for the figure. Pre-modern figures rest on chronicles and reconstructions, so the early bars carry much wider error than the late ones.',(svg,w,h)=>{
    const m={l:50,r:12,t:8,b:74}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
    const x=d3.scaleBand().domain(ERAS.map(e=>e.id)).range([0,iw]).padding(0.26);
    const y=d3.scaleLinear().domain([0,d3.max(stack,s=>d3.sum(TYPES,t=>s[t]))||1]).nice().range([ih,0]);
    y.ticks(5).forEach(t=>g.append('line').attr('class','gridline').attr('x1',0).attr('x2',iw).attr('y1',y(t)).attr('y2',y(t)));
    const series=d3.stack().keys(TYPES)(stack);
    g.selectAll('g.s').data(series).join('g').attr('class','s')
      .selectAll('rect').data(d=>d.map(v=>({...v,key:d.key}))).join('rect')
      .attr('x',d=>x(d.data.d0)).attr('width',x.bandwidth())
      .attr('y',d=>y(d[1])).attr('height',d=>Math.max(0,y(d[0])-y(d[1])-2))
      .attr('rx',2).attr('fill',d=>`var(${HEX[d.key]})`)
      .attr('fill-opacity',d=>d.key==='confinement'?0.55:0.92)
      .append('title').text(d=>`${d.data.lab} — ${TYPE_SHORT[d.key]}: ${fmt(d[1]-d[0])}`);
    const ax=axisBottom(g,x,ih);
    ax.selectAll('text').attr('transform','rotate(-38)').attr('text-anchor','end').attr('dx','-4').attr('dy','6')
      .style('font-size','9px').text(id=>{const t=ERAS.find(e=>e.id===id).title.replace(/&amp;/g,'&'); return t.length>17?t.slice(0,16)+'…':t;});
    const ya=g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(5).tickFormat(v=>v>=1e6?(v/1e6)+'m':d3.format('.2s')(v)));
    ya.select('.domain').remove();
  },`<div class="chartlegend">${TYPES.map(t=>`<span class="i"><span class="sw" style="background:var(${HEX[t]});${t==='confinement'?'opacity:.6':''}"></span>${TYPE_SHORT[t]}</span>`).join('')}</div>`);

  /* 2 — events per region */
  const byRegion=d3.rollups(rows,v=>({n:v.length,p:d3.sum(v,e=>e._people||0)}),e=>e.region)
    .sort((a,b)=>b[1].p-a[1].p);
  card(cg,'People affected by region','One bar per region; the label gives the number of events.',(svg,w,h)=>{
    const m={l:158,r:62,t:4,b:24}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
    const y=d3.scaleBand().domain(byRegion.map(d=>d[0])).range([0,ih]).padding(0.3);
    const x=d3.scaleLinear().domain([0,d3.max(byRegion,d=>d[1].p)||1]).nice().range([0,iw]);
    x.ticks(4).forEach(t=>g.append('line').attr('class','gridline').attr('y1',0).attr('y2',ih).attr('x1',x(t)).attr('x2',x(t)));
    g.selectAll('rect').data(byRegion).join('rect')
      .attr('y',d=>y(d[0])).attr('height',y.bandwidth()).attr('x',0)
      .attr('width',d=>x(d[1].p)).attr('rx',3).attr('fill','var(--s1)').attr('fill-opacity',.9)
      .append('title').text(d=>`${d[0]}: ${fmt(d[1].p)} across ${d[1].n} events`);
    g.selectAll('text.v').data(byRegion).join('text').attr('class','v')
      .attr('x',d=>x(d[1].p)+7).attr('y',d=>y(d[0])+y.bandwidth()/2+3.5)
      .attr('fill','var(--text-secondary)').style('font-size','11px').text(d=>fmt(d[1].p));
    const ya=g.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0));
    ya.select('.domain').remove();
    ya.selectAll('text').text(d=>{const r=byRegion.find(z=>z[0]===d); return `${d} (${r[1].n})`;});
    axisBottom(g,x,ih,4,v=>fmt(v));
  });

  /* 3 — events under way per year */
  card(cg,'Events under way, by year','How many of these episodes were live in any given year — the shape of the century.',(svg,w,h)=>{
    const m={l:36,r:14,t:10,b:52}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
    const xs=d3.scaleLinear().domain(T_BREAKS).range(T_POS.map(p=>p*iw));
    const years=d3.range(0,241).map(k=>Math.round(xs.invert(k*iw/240)));
    const counts=years.map(y=>rows.filter(e=>e.startYear<=y&&e.endYear>=y).length);
    const x=y=>xs(y);
    const y=d3.scaleLinear().domain([0,d3.max(counts)||1]).nice().range([ih,0]);
    y.ticks(4).forEach(t=>g.append('line').attr('class','gridline').attr('x1',0).attr('x2',iw).attr('y1',y(t)).attr('y2',y(t)));
    const data=counts.map((c,i)=>[years[i],c]);
    g.append('path').datum(data).attr('fill','var(--s1)').attr('fill-opacity',.16)
      .attr('d',d3.area().x(d=>x(d[0])).y0(ih).y1(d=>y(d[1])).curve(d3.curveMonotoneX));
    g.append('path').datum(data).attr('fill','none').attr('stroke','var(--s1)').attr('stroke-width',2)
      .attr('d',d3.line().x(d=>x(d[0])).y(d=>y(d[1])).curve(d3.curveMonotoneX));
    const pk=data[d3.maxIndex(counts)];
    g.append('circle').attr('cx',x(pk[0])).attr('cy',y(pk[1])).attr('r',3.5).attr('fill','var(--s1)')
      .attr('stroke','var(--surface-1)').attr('stroke-width',2);
    g.append('text').attr('x',x(pk[0])).attr('y',y(pk[1])-9).attr('text-anchor','middle')
      .attr('fill','var(--text-secondary)').style('font-size','11px').text(`peak ${pk[1]} in ${yr(pk[0])}`);
    const ax3=g.append('g').attr('class','axis').attr('transform',`translate(0,${ih})`)
      .call(d3.axisBottom(xs).tickValues(T_BREAKS).tickFormat(yr).tickSizeOuter(0));
    ax3.select('.domain').attr('stroke','var(--axis)');
    ax3.selectAll('text').attr('transform','rotate(-38)').attr('text-anchor','end').attr('dx','-4').attr('dy','5').style('font-size','9px');
    const ya=g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(4)); ya.select('.domain').remove();
  });

  /* 4 — largest events */
  const top=rows.slice().sort((a,b)=>(b._people||0)-(a._people||0)).slice(0,12);
  card(cg,'The twelve largest by people affected','Click a bar to open the event.',(svg,w,h)=>{
    const m={l:186,r:64,t:4,b:24}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
    const y=d3.scaleBand().domain(top.map(d=>d.id)).range([0,ih]).padding(0.28);
    const x=d3.scaleLinear().domain([0,d3.max(top,d=>d._people)||1]).nice().range([0,iw]);
    x.ticks(4).forEach(t=>g.append('line').attr('class','gridline').attr('y1',0).attr('y2',ih).attr('x1',x(t)).attr('x2',x(t)));
    g.selectAll('rect').data(top).join('rect')
      .attr('y',d=>y(d.id)).attr('height',y.bandwidth()).attr('width',d=>x(d._people)).attr('rx',3)
      .attr('fill',d=>color(d.type)).attr('fill-opacity',d=>d.type==='confinement'?0.5:0.9)
      .style('cursor','pointer')
      .on('click',(ev,d)=>{ document.querySelector('#viewSeg button[data-view="map"]').click(); selectEvent(d.id); })
      .append('title').text(d=>`${d.title}: ${fmt(d._people)}`);
    g.selectAll('text.v').data(top).join('text').attr('class','v')
      .attr('x',d=>x(d._people)+7).attr('y',d=>y(d.id)+y.bandwidth()/2+3.5)
      .attr('fill','var(--text-secondary)').style('font-size','11px').text(d=>fmt(d._people));
    const ya=g.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0)
      .tickFormat(id=>{const t=BY_ID.get(id).title; return t.length>30?t.slice(0,29)+'…':t;}));
    ya.select('.domain').remove();
    axisBottom(g,x,ih,4,v=>fmt(v));
  });

  /* 5 — deadliest events */
  const lethal=rows.filter(e=>e._deaths!=null).sort((a,b)=>b._deaths-a._deaths).slice(0,12);
  if(lethal.length) card(cg,'The twelve deadliest, by recorded death toll',
    'Bars run from the low to the high end of the sourced range. Bases differ — some ranges count direct killing, others excess mortality — so these are not strictly comparable. Click to open.',(svg,w,h)=>{
    const m={l:186,r:78,t:4,b:24}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
    const y=d3.scaleBand().domain(lethal.map(d=>d.id)).range([0,ih]).padding(0.3);
    const x=d3.scaleLinear().domain([0,d3.max(lethal,d=>d.deathsHigh)||1]).nice().range([0,iw]);
    x.ticks(4).forEach(t=>g.append('line').attr('class','gridline').attr('y1',0).attr('y2',ih).attr('x1',x(t)).attr('x2',x(t)));
    const row=g.selectAll('g.r').data(lethal).join('g').attr('class','r').style('cursor','pointer')
      .on('click',(ev,d)=>{ document.querySelector('#viewSeg button[data-view=\"map\"]').click(); selectEvent(d.id); });
    row.append('rect').attr('x',d=>x(d.deathsLow)).attr('y',d=>y(d.id)+y.bandwidth()/2-3)
      .attr('width',d=>Math.max(2,x(d.deathsHigh)-x(d.deathsLow))).attr('height',6).attr('rx',3)
      .attr('fill','var(--crit)').attr('fill-opacity',.35);
    row.append('circle').attr('cx',d=>x(d.deathsLow)).attr('cy',d=>y(d.id)+y.bandwidth()/2).attr('r',3.4).attr('fill','var(--crit)');
    row.append('circle').attr('cx',d=>x(d.deathsHigh)).attr('cy',d=>y(d.id)+y.bandwidth()/2).attr('r',3.4).attr('fill','var(--crit)');
    row.append('title').text(d=>`${d.title}: ${fmtDeaths(d.deathsLow,d.deathsHigh)} (${d.deathsBasis||''})`);
    g.selectAll('text.v').data(lethal).join('text').attr('class','v')
      .attr('x',d=>x(d.deathsHigh)+8).attr('y',d=>y(d.id)+y.bandwidth()/2+3.5)
      .attr('fill','var(--text-secondary)').style('font-size','10.5px').text(d=>fmt(d.deathsHigh));
    const ya=g.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0)
      .tickFormat(id=>{const t=BY_ID.get(id).title; return t.length>30?t.slice(0,29)+'…':t;}));
    ya.select('.domain').remove();
    axisBottom(g,x,ih,4,v=>fmt(v));
  });

  /* 5b — largest share of the affected population */
  const shareTop=rows.filter(e=>e._share!=null).sort((a,b)=>b._share-a._share).slice(0,12);
  if(shareTop.length) card(cg,'Largest share of the population affected',
    'The displaced or confined figure over the population of the group or territory the event acted on. Bars above 100% mean the numerator outgrew its baseline — usually a count spanning generations, or repeat displacement. Click to open.',(svg,w,h)=>{
    const m={l:186,r:64,t:4,b:24}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
    const y=d3.scaleBand().domain(shareTop.map(d=>d.id)).range([0,ih]).padding(0.28);
    const x=d3.scaleLinear().domain([0,d3.max(shareTop,d=>d._share)||1]).nice().range([0,iw]);
    x.ticks(4).forEach(t=>g.append('line').attr('class','gridline').attr('y1',0).attr('y2',ih).attr('x1',x(t)).attr('x2',x(t)));
    if(x.domain()[1]>1) g.append('line').attr('x1',x(1)).attr('x2',x(1)).attr('y1',0).attr('y2',ih)
      .attr('stroke','var(--text-secondary)').attr('stroke-width',1).attr('stroke-dasharray','3 3');
    g.selectAll('rect').data(shareTop).join('rect')
      .attr('y',d=>y(d.id)).attr('height',y.bandwidth()).attr('width',d=>x(d._share)).attr('rx',3)
      .attr('fill',d=>color(d.type)).attr('fill-opacity',d=>d.type==='confinement'?0.5:0.9)
      .style('cursor','pointer')
      .on('click',(ev,d)=>{ document.querySelector('#viewSeg button[data-view=\"map\"]').click(); selectEvent(d.id); })
      .append('title').text(d=>`${d.title}: ${fmtShare(d)} of ${d.baselineWhat||'the affected population'}`);
    g.selectAll('text.v').data(shareTop).join('text').attr('class','v')
      .attr('x',d=>x(d._share)+7).attr('y',d=>y(d.id)+y.bandwidth()/2+3.5)
      .attr('fill','var(--text-secondary)').style('font-size','10.5px').text(d=>fmtShare(d));
    const ya=g.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0)
      .tickFormat(id=>{const t=BY_ID.get(id).title; return t.length>30?t.slice(0,29)+'…':t;}));
    ya.select('.domain').remove();
    axisBottom(g,x,ih,4,v=>v>1.2?`${v.toFixed(1)}\u00d7`:`${Math.round(v*100)}%`);
  });

  /* 6 — documented forms */
  const formCounts=FORMS.map(f=>({f,n:rows.filter(e=>(e.violenceForms||[]).includes(f)).length}))
    .filter(d=>d.n).sort((a,b)=>b.n-a.n);
  if(formCounts.length) card(cg,'Documented forms of violence','How many events on the current filters carry each form. A form is recorded only where a named source documents it for that event, so absence means undocumented here, not proof it did not occur.',(svg,w,h)=>{
    const m={l:158,r:44,t:4,b:24}, iw=w-m.l-m.r, ih=h-m.t-m.b;
    const g=svg.append('g').attr('transform',`translate(${m.l},${m.t})`);
    const y=d3.scaleBand().domain(formCounts.map(d=>d.f)).range([0,ih]).padding(0.26);
    const x=d3.scaleLinear().domain([0,d3.max(formCounts,d=>d.n)||1]).nice().range([0,iw]);
    x.ticks(4).forEach(t=>g.append('line').attr('class','gridline').attr('y1',0).attr('y2',ih).attr('x1',x(t)).attr('x2',x(t)));
    g.selectAll('rect').data(formCounts).join('rect')
      .attr('y',d=>y(d.f)).attr('height',y.bandwidth()).attr('width',d=>x(d.n)).attr('rx',3)
      .attr('fill','var(--crit)').attr('fill-opacity',.75).append('title').text(d=>`${FORM_SHORT[d.f]}: ${d.n} events`);
    g.selectAll('text.v').data(formCounts).join('text').attr('class','v')
      .attr('x',d=>x(d.n)+7).attr('y',d=>y(d.f)+y.bandwidth()/2+3.5)
      .attr('fill','var(--text-secondary)').style('font-size','10.5px').text(d=>d.n);
    const ya=g.append('g').attr('class','axis').call(d3.axisLeft(y).tickSize(0).tickFormat(f=>FORM_SHORT[f]));
    ya.select('.domain').remove();
    axisBottom(g,x,ih,4,v=>String(v));
  });
}
function card(host,title,cap,draw,legendHtml){
  const c=host.append('div').attr('class','chartcard');
  c.append('h3').text(title);
  c.append('p').attr('class','cap').text(cap);
  if(legendHtml) c.append('div').html(legendHtml);
  const w=620, h=300;
  const s=c.append('svg').attr('viewBox',`0 0 ${w} ${h}`).attr('preserveAspectRatio','xMidYMid meet');
  draw(s,w,h);
}

/* ---------- table ---------- */
const COLS=[
 {k:'startYear',t:'Years',cls:'num',v:e=>span(e)},
 {k:'title',t:'Event',cls:'t',v:e=>e.title},
 {k:'region',t:'Region',v:e=>e.region},
 {k:'type',t:'Type',v:e=>TYPE_SHORT[e.type]},
 {k:'_people',t:'People displaced / confined',cls:'num',v:e=>e._people?d3.format(',')(e._people):'—'},
 {k:'_deaths',t:'Killed (range)',cls:'num',v:e=>e._deaths!=null?fmtDeaths(e.deathsLow,e.deathsHigh):'—'},
 {k:'territoryKm2',t:'Territory',cls:'num',v:e=>e.territoryKm2?d3.format(',')(e.territoryKm2)+' km²':'—'},
 {k:'_share',t:'Share affected',cls:'num',v:e=>fmtShare(e)||'—'},
 {k:'violenceForms',t:'Documented forms',v:e=>(e.violenceForms||[]).map(f=>FORM_SHORT[f]).join(', ')||'—'},
 {k:'sources',t:'Sources',cls:'num',v:e=>{const n=(e.sources||[]).length;
   const st=(e.sources||[]).filter(s=>STRONG_TIERS.has(s.tier)).length;
   return `${n}${st?` (${st} strong)`:' (none strong)'}`;}},
 {k:'actors',t:'Parties',v:e=>e.actors}
];
function buildTable(){
  const rows=eventsInWindow().slice().sort((a,b)=>{
    const k=state.sortKey; let A=a[k],B=b[k];
    if(Array.isArray(A)) return state.sortDir*((A.length)-(B.length));
    if(typeof A==='string') return state.sortDir*A.localeCompare(B);
    return state.sortDir*(((A??-1))-((B??-1)));
  });
  document.getElementById('table').innerHTML=
    `<p class="lead">${rows.length} events in ${yrRange(state.from,state.to)} on the current filters. Click a heading to sort, or an event name to open it on the map. Figures are central estimates; ranges and disputed points live in each event's entry.</p>
     <div class="exportbar"><button class="btn" id="expCSV">Download CSV</button><button class="btn" id="expJSON">Download JSON</button>
       <span class="expnote">Exports exactly the ${rows.length} events above, with every field and source.</span></div>
     <table class="data"><thead><tr>${COLS.map(c=>`<th data-k="${c.k}">${c.t}${state.sortKey===c.k?(state.sortDir>0?' ▲':' ▼'):''}</th>`).join('')}</tr></thead>
     <tbody>${rows.map(e=>`<tr>${COLS.map(c=>`<td class="${c.cls||''}" ${c.cls==='t'?`data-id="${e.id}"`:''}>${c.v(e)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  document.getElementById('expCSV').onclick=exportCSV;
  document.getElementById('expJSON').onclick=exportJSON;
  document.querySelectorAll('#table th').forEach(th=>th.onclick=()=>{
    if(state.sortKey===th.dataset.k) state.sortDir*=-1; else { state.sortKey=th.dataset.k; state.sortDir=1; }
    buildTable();
  });
  document.querySelectorAll('#table td[data-id]').forEach(td=>td.onclick=()=>{
    document.querySelector('#viewSeg button[data-view="map"]').click(); selectEvent(td.dataset.id);
  });
}

/* ==================================================== shareable state */
const TCODE={displacement:'d',territory:'t',both:'b',confinement:'c'};
const TDEC=Object.fromEntries(Object.entries(TCODE).map(([k,v])=>[v,k]));
let urlLock=false;
function pushURL(){
  if(urlLock) return;
  const p=new URLSearchParams();
  p.set('w',`${state.from},${state.to}`);
  if(state.types.size!==TYPES.length) p.set('t',[...state.types].map(t=>TCODE[t]).join(''));
  if(state.regions.size!==REGIONS.length) p.set('r',[...state.regions].map(r=>REGIONS.indexOf(r)).join(''));
  if(state.forms.size) p.set('f',[...state.forms].map(f=>FORMS.indexOf(f)).join('.'));
  if(state.atro) p.set('a','1');
  if(state.lethal) p.set('l','1');
  if(state.hasBase) p.set('bp','1');
  if(state.strongSrc) p.set('ss','1');
  if(state.sizeByShare) p.set('sz','1');
  if(state.q) p.set('q',state.q);
  if(state.country) p.set('c',state.country);
  if(state.selected) p.set('e',state.selected);
  if(state.era) p.set('x',state.era);
  if(state.view!=='map') p.set('v',state.view);
  if(state.proj==='globe') p.set('g','1');
  if(state.flowStep!==3) p.set('fd',state.flowStep);
  if(state.trail) p.set('tr','1');
  history.replaceState(null,'','#'+p.toString());
}
function readURL(){
  const h=location.hash.replace(/^#/,''); if(!h) return false;
  const p=new URLSearchParams(h); urlLock=true;
  try{
    if(p.get('w')){ const [a,b]=p.get('w').split(',').map(Number);
      if(Number.isFinite(a)&&Number.isFinite(b)){ state.from=clampY(a); state.to=clampY(b); } }
    if(p.get('t')) state.types=new Set([...p.get('t')].map(c=>TDEC[c]).filter(Boolean));
    if(!state.types.size) state.types=new Set(TYPES);
    if(p.get('r')) state.regions=new Set([...p.get('r')].map(i=>REGIONS[+i]).filter(Boolean));
    if(!state.regions.size) state.regions=new Set(REGIONS);
    if(p.get('f')) state.forms=new Set(p.get('f').split('.').map(i=>FORMS[+i]).filter(Boolean));
    state.atro=p.get('a')==='1'; state.lethal=p.get('l')==='1'; state.trail=p.get('tr')==='1';
    state.hasBase=p.get('bp')==='1'; state.strongSrc=p.get('ss')==='1'; state.sizeByShare=p.get('sz')==='1';
    if(p.get('q')){ state.q=p.get('q'); document.getElementById('q').value=p.get('q'); }
    if(p.get('c')&&COUNTRY_INDEX.has(p.get('c'))) state.country=p.get('c');
    if(p.get('x')&&ERAS.some(e=>e.id===p.get('x'))) state.era=p.get('x');
    if(p.get('g')==='1') state.proj='globe';
    if(p.get('fd')) state.flowStep=Math.max(0,Math.min(FLOW_STEPS.length-1,+p.get('fd')));
    if(p.get('v')&&['charts','table'].includes(p.get('v'))) state.view=p.get('v');
    if(p.get('e')&&BY_ID.has(p.get('e'))) state.pendingSelect=p.get('e');
  }catch(err){}
  urlLock=false; return true;
}
function copyLink(btn){
  pushURL();
  navigator.clipboard.writeText(location.href).then(()=>{
    const t=btn.textContent; btn.textContent='Link copied'; setTimeout(()=>btn.textContent=t,1600);
  }).catch(()=>{});
}
document.getElementById('shareBtn').onclick=function(){ copyLink(this); };

/* ==================================================== export */
function download(name,text,mime){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:mime}));
  a.download=name; document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},400);
}
const CSVCOLS=['id','title','startYear','endYear','dateApprox','type','region','actors','peopleDisplaced','peopleRange',
 'baselinePop','baselineWhat','baselineYear','shareCaveat','asOf',
 'settlers','territoryKm2','territoryDesc','deathsLow','deathsHigh','deathsBasis','deathsNote','atrocityPrimary',
 'violenceForms','violenceNote','countries','summary','contested','sources'];
function sliceRows(){ return eventsInWindow(); }
function exportCSV(){
  const esc=v=>{
    if(v==null) return '';
    if(Array.isArray(v)) v=v.map(x=>typeof x==='object'?(x.title+' <'+x.url+'>'):x).join(' | ');
    v=String(v);
    return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v;
  };
  const rows=sliceRows();
  const csv=[CSVCOLS.join(',')].concat(rows.map(e=>CSVCOLS.map(c=>esc(e[c])).join(','))).join('\n');
  download(`redrawn-${state.from}-${state.to}-${rows.length}events.csv`,csv,'text/csv;charset=utf-8');
}
function exportJSON(){
  const rows=sliceRows().map(e=>{ const o={...e};
    delete o._mag; delete o._deaths; delete o._people; delete o._search; return o; });
  download(`redrawn-${state.from}-${state.to}-${rows.length}events.json`,
    JSON.stringify({generated:'Redrawn atlas',window:[state.from,state.to],count:rows.length,events:rows},null,1),
    'application/json');
}
function citationFor(e){
  return `${e.title}, ${span(e)}. ${e.region}. `+
    (e._people?`${fmt(e._people)} ${peopleWord(e)}. `:'')+
    (e._deaths!=null?`Deaths estimated at ${fmtDeaths(e.deathsLow,e.deathsHigh)} (${e.deathsBasis||'basis unstated'}). `:'')+
    `\n\nSources:\n`+(e.sources||[]).map(s=>`- ${s.title}. ${s.url}`).join('\n')+
    `\n\nVia Redrawn, an atlas of territory seized, populations displaced and confined. Retrieved ${new Date().toISOString().slice(0,10)}.`;
}

/* ==================================================== boot */
let rt; window.addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{
  layout(); drawTimeline(); render(); if(state.view!=='map') buildSheets();
},140); });
projGlobe.rotate(rot);
readURL();
if(state.view!=='map'){
  document.querySelectorAll('#viewSeg button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.view===state.view));
  document.getElementById('mainStage').toggleAttribute('hidden',true);
  document.getElementById('timeline').toggleAttribute('hidden',true);
  document.getElementById(state.view).toggleAttribute('hidden',false);
}
buildMenus(); applyDisplay(); syncControls();
layout(); drawTimeline(); render(); renderPanel(); buildSheets();
if(state.pendingSelect){ const id=state.pendingSelect; state.pendingSelect=null; setTimeout(()=>selectEvent(id),160); }
window.addEventListener('hashchange',()=>{ if(!urlLock) location.reload(); });

/* a small public handle, for debugging, embedding and console use */
window.Redrawn = {
  version: 1,
  events: EVENTS,
  state: state,
  select: id => selectEvent(id),
  setWindow: (a,b) => setWindow(a,b),
  era: id => setEra(id),
  country: name => pickCountry(name),
  exportCSV: () => exportCSV(),
  exportJSON: () => exportJSON()
};
