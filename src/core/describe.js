// Generates the Dutch coaching copy for a single solve move: what to observe,
// why it works, the concrete action, a hint, and how the board is marked.
// Pure: depends only on the move, the board/candidate state and the next move.
import { ROWS, COLS, BOXES, coord, coords, digitList, unitLabel, containingUnit } from './geometry.js';
import { moveDigits, postCandidates } from './solver.js';
import { TECH_LABELS } from '../data/techniques.js';

export function moveDescription(m, st, next) {
  const nextText = next
    ? `Daarna is de snelste volgende zet: ${TECH_LABELS[next.tech] || next.title}.`
    : 'Daarmee is de sudoku opgelost.';
  const place = m.placements?.[0];
  const targets = (m.eliminations || []).map((x) => x[0]);
  const digits = moveDigits(m);
  const pattern = m.pattern || [];
  let observe = '';
  let why = '';
  let action = '';
  let tip = '';
  let mark = '';

  if (m.tech === 'naked_single') {
    const [i, d] = place;
    observe = `${coord(i)} heeft nog maar één kandidaat: ${d}.`;
    why = `Alle andere cijfers worden al uitgesloten door de rij, kolom of het 3×3-blok van ${coord(i)}. Een directe enkele kandidaat levert meteen een zeker cijfer op.`;
    action = `Plaats ${d} in ${coord(i)}.`;
    tip = 'Zoek eerst naar een lege cel waarin nog maar één kleine kandidaatnotitie staat.';
    mark = `De groen gemarkeerde cel ${coord(i)} heeft kandidaat ${d} als enige mogelijkheid.`;
  } else if (m.tech === 'hidden_single') {
    const [i, d] = place;
    const u = containingUnit(pattern);
    observe = `Binnen ${u ? unitLabel(u) : 'de gemarkeerde eenheid'} is ${coord(i)} de enige plaats waar ${d} nog kan staan.`;
    why = `Elk cijfer moet precies één keer in een rij, kolom en blok voorkomen. Ook met meerdere notities in de cel is ${d} hier dus verplicht.`;
    action = `Plaats ${d} in ${coord(i)}.`;
    tip = `Scan een rij, kolom of blok cijfer voor cijfer en zoek een kandidaat die nog maar op één positie voorkomt.`;
    mark = `De gemarkeerde eenheid laat kandidaat ${d} alleen toe in ${coord(i)}.`;
  } else if (m.tech === 'locked') {
    const d = digits[0];
    const box = BOXES.find((u) => pattern.every((i) => u.includes(i)));
    const line = [...ROWS, ...COLS].find((u) => pattern.every((i) => u.includes(i)));
    observe = `In ${box ? unitLabel(box) : 'het gemarkeerde blok'} kan kandidaat ${d} alleen nog staan in ${coords(pattern)}. Die posities liggen allemaal op ${line ? unitLabel(line) : 'dezelfde lijn'}.`;
    why = `Eén van die posities moet ${d} bevatten. Daarom kan ${d} op dezelfde lijn buiten het blok niet waar zijn.`;
    action = `Schrap ${d} uit ${coords(targets)}.`;
    tip = `Scan kandidaat ${d} blok voor blok. Zoek een blok waarin alle mogelijke ${d}'s op één rij of kolom liggen.`;
    mark = `Geel toont de opgesloten posities; rood toont waar kandidaat ${d} mag verdwijnen.`;
  } else if (['naked_pair', 'naked_triple', 'naked_quad'].includes(m.tech)) {
    const n = { naked_pair: 2, naked_triple: 3, naked_quad: 4 }[m.tech];
    const u = containingUnit(pattern, targets);
    const union = [...new Set(pattern.flatMap((i) => [...st.cands[i]]))].sort((a, b) => a - b);
    observe = `In ${u ? unitLabel(u) : 'de gemarkeerde eenheid'} gebruiken ${n} cellen gezamenlijk alleen de kandidaten ${digitList(union)}.`;
    why = `Omdat er evenveel gereserveerde cijfers als cellen zijn, moeten die cijfers binnen het patroon vallen en kunnen ze niet elders in dezelfde eenheid staan.`;
    action = `Schrap ${digitList(digits)} uit ${coords(targets)}.`;
    tip = `Zoek in één rij, kolom of blok naar ${n} cellen waarvan de gezamenlijke kandidaatset precies ${n} cijfers bevat.`;
    mark = `De gele cellen vormen het ${TECH_LABELS[m.tech].toLowerCase()}; de rode cellen verliezen kandidaten.`;
  } else if (['hidden_pair', 'hidden_triple'].includes(m.tech)) {
    const n = m.tech === 'hidden_pair' ? 2 : 3;
    const u = containingUnit(pattern, targets);
    const remain = [...new Set(pattern.flatMap((i) => postCandidates(st, m, i)))].sort((a, b) => a - b);
    observe = `Binnen ${u ? unitLabel(u) : 'de gemarkeerde eenheid'} kunnen de verborgen cijfers ${digitList(remain)} alleen in ${coords(pattern)} staan.`;
    why = `Die ${n} cijfers zijn voor precies ${n} cellen gereserveerd. De andere notities in die cellen kunnen daarom niet waar zijn.`;
    action = `Schrap ${digitList(digits)} uit de gemarkeerde patrooncellen.`;
    tip = `Scan de posities van cijfers in één eenheid. Zoek ${n} cijfers die samen alleen dezelfde ${n} cellen gebruiken.`;
    mark = `Geel toont de verborgen subset; de doorgestreepte notities zijn de overbodige kandidaten.`;
  } else if (m.tech === 'xwing') {
    const d = digits[0];
    const rs = [...new Set(pattern.map((i) => Math.floor(i / 9) + 1))];
    const cs = [...new Set(pattern.map((i) => (i % 9) + 1))];
    observe = `Kandidaat ${d} vormt een rechthoek over rijen ${digitList(rs)} en kolommen ${digitList(cs)}.`;
    why = `In beide basislijnen moet één hoek ${d} zijn. Daardoor zijn de twee dwarslijnen voor ${d} bezet.`;
    action = `Schrap ${d} uit ${coords(targets)}.`;
    tip = `Scan één kandidaat en zoek twee rijen met exact dezelfde twee kandidaatkolommen, of omgekeerd.`;
    mark = 'De vier gele hoekcellen vormen de X-Wing; rood toont de eliminatie.';
  } else if (m.tech === 'swordfish') {
    const d = digits[0];
    const rs = [...new Set(pattern.map((i) => Math.floor(i / 9) + 1))];
    const cs = [...new Set(pattern.map((i) => (i % 9) + 1))];
    observe = `Kandidaat ${d} is in drie basislijnen beperkt tot rijen ${digitList(rs)} en kolommen ${digitList(cs)}.`;
    why = `De drie echte posities moeten binnen deze fish vallen. Buiten de fish kan ${d} niet meer in de gebruikte dwarslijnen staan.`;
    action = `Schrap ${d} uit ${coords(targets)}.`;
    tip = `Scan kandidaat ${d} over drie rijen of kolommen en zoek samen precies drie dwarslijnen.`;
    mark = 'Geel toont de Swordfish-posities; rood toont de kandidaten buiten de fish.';
  } else if (['xywing', 'xyzwing'].includes(m.tech)) {
    const d = digits[0];
    const pivot = Number(Object.keys(m.roles || {}).find((k) => m.roles[k] === 'pivot'));
    const wings = Object.keys(m.roles || {})
      .filter((k) => m.roles[k] === 'wing')
      .map(Number);
    observe = `Pivot ${coord(pivot)} heeft kandidaten {${[...st.cands[pivot]].join(',')}}. De vleugels ${wings.map((i) => `${coord(i)} {${[...st.cands[i]].join(',')}}`).join(' en ')}.`;
    why = `Welke waarde de pivot ook krijgt, kandidaat ${d} wordt in minstens één patrooncel waar. Daarom kan ${d} niet in een cel staan die de vereiste patroonposities tegelijk ziet.`;
    action = `Schrap ${d} uit ${coords(targets)}.`;
    tip = `Zoek eerst een pivot met ${m.tech === 'xywing' ? 2 : 3} kandidaten en daarna twee passende bivalue-vleugels.`;
    mark = 'Blauw is de pivot, paars zijn de vleugels en rood is de eliminatie.';
  } else if (m.tech === 'coloring') {
    const d = digits[0];
    observe = `Sterke koppelingen voor kandidaat ${d} vormen twee afwisselende kleuren.`;
    why = `Precies één kleur is waar. Een cel die zowel een A- als een B-positie ziet, kan daarom zelf geen ${d} bevatten.`;
    action = `Schrap ${d} uit ${coords(targets)}.`;
    tip = `Bouw een keten van eenheden waarin kandidaat ${d} exact twee mogelijke posities heeft.`;
    mark = `Blauw en oranje zijn de twee kleuren; rood ziet beide kleuren.`;
  } else if (m.tech === 'skyscraper') {
    const d = digits[0];
    observe = `Vier posities voor kandidaat ${d} vormen twee sterke links met één uitgelijnde basis.`;
    why = `Minstens één van de twee niet-uitgelijnde uiteinden moet ${d} zijn. Een cel die beide uiteinden ziet, kan geen ${d} bevatten.`;
    action = `Schrap ${d} uit ${coords(targets)}.`;
    tip = `Zoek twee rijen of kolommen met elk precies twee posities voor ${d}, waarbij één paar uitgelijnd is.`;
    mark = 'De gele cellen vormen de twee sterke links; rood ziet beide daken.';
  } else if (m.tech === 'unique_rectangle') {
    const target = targets[0];
    const pair = digits;
    observe = `Vier cellen vormen een rechthoek met kandidatenpaar {${pair.join(',')}}; één hoek heeft een extra uitweg.`;
    why = `Wanneer alle vier hoeken alleen het paar konden bevatten, konden de twee cijfers worden omgewisseld en ontstonden twee oplossingen.`;
    action = `Schrap ${digitList(pair)} uit ${coord(target)}.`;
    tip = `Zoek een rechthoek over twee rijen, twee kolommen en precies twee blokken met hetzelfde kandidatenpaar in drie hoeken.`;
    mark = 'Geel toont de rechthoek; de groene/rode hoek moet het patroon doorbreken.';
  } else {
    observe = `Het patroon ${m.title} levert een zekere volgende zet.`;
    why = 'De gemarkeerde kandidaatverdeling laat geen geldige alternatieve plaatsing toe.';
    action = m.placements?.length
      ? `Plaats ${m.placements.map(([i, d]) => `${d} in ${coord(i)}`).join(', ')}.`
      : `Schrap ${digitList(digits)} uit ${coords(targets)}.`;
    tip = `Zoek naar ${m.title}.`;
    mark = 'De relevante cellen zijn gemarkeerd.';
  }
  return { title: TECH_LABELS[m.tech] || m.title, observe, why, action, after: nextText, tip, mark };
}

export function fastestWhy(m) {
  if (m.tech === 'naked_single')
    return 'Een cel met één kandidaat geeft direct een cijfer. Daarom controleer je dit vóór iedere patroonzoektocht.';
  if (m.tech === 'hidden_single')
    return 'Er is geen zichtbare enkele kandidaat; een verborgen enkele geeft nog steeds direct een cijfer en is daarom de volgende snelle controle.';
  return `De directe enkelen zijn in deze oefenroute uitgeput. ${TECH_LABELS[m.tech] || m.title} is nu de eerste productieve techniek in de vaste snelheidsvolgorde en levert een zekere eliminatie.`;
}
