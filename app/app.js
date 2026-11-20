'use strict';

const { trophies, sources, officialSource } = ledgerCatalog;
const $ = id => document.getElementById(id);
const catalog = new Map(trophies.map(t => [t.id, t]));
const featured = [28, 1, 14, 17];
const ledgerOrder = [...featured.map(id => catalog.get(id)), ...trophies.filter(t => !featured.includes(t.id))];
const filters = [['all', 'All trophies', '▤'], ['story', 'Story', '▣'], ['missable', 'Missable', '△'], ['collectibles', 'Collectibles', '◇'], ['activities', 'Activities', '⊕'], ['online', 'Online', '◎']];
const labels = { safe: 'Safe', 'chapter-locked': 'Chapter-locked', questline: 'Questline', unknown: 'Unknown', missable: 'Missable' };
const definitions = { safe: 'Automatic or available without a known permanent lockout.', 'chapter-locked': 'Opens after story progress; no permanent lockout reported.', questline: 'Follow the contact’s chain; no permanent lockout reported.', unknown: 'A trophy requirement or lockout is not yet confirmed.', missable: 'A required opportunity can disappear permanently.' };
const grades = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
const KEY = 'leonida-ledger.v1';
const version = 1;
let type = 'all';
let selected = 28;
let view = 'ledger';
let statusTimer;
let saveAvailable = true;
let state = { version, earned: [], notes: {}, shield: false };

function validateBackup(value) {
  if (!value || value.version !== version || typeof value.shield !== 'boolean' || !Array.isArray(value.earned) ||
      !value.notes || typeof value.notes !== 'object' || Array.isArray(value.notes) ||
      !value.earned.every(id => catalog.has(id))) throw Error('Invalid ledger backup');
  const notes = {};
  for (const [key, text] of Object.entries(value.notes)) {
    if (!catalog.has(Number(key)) || String(Number(key)) !== key || typeof text !== 'string' || text.length > 2000) throw Error('Invalid note');
    if (text) notes[key] = text;
  }
  return { version, earned: [...new Set(value.earned)].sort((a, b) => a - b), notes, shield: value.shield };
}

function announce(text, persistent = false) {
  clearTimeout(statusTimer);
  $('status').textContent = text;
  $('status').hidden = false;
  if (!persistent) statusTimer = setTimeout(() => { $('status').hidden = true; }, 4500);
}

function loadLedger() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) state = validateBackup(JSON.parse(saved));
  } catch {
    announce('Saved progress is unavailable. You can restore it from a backup.', true);
  }
}

function saveLedger() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    saveAvailable = true;
  } catch {
    saveAvailable = false;
    announce('Browser storage is unavailable. Export to keep this session’s progress.', true);
  }
}

function el(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  return node;
}

function button(className, text, action) {
  const node = el('button', className, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function sourceLink(key) {
  const [label, url] = sources[key];
  const link = el('a', 'citation', `${label} ↗`);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
}

const earned = t => state.earned.includes(t.id);
const concealed = t => state.shield && t.kind === 'story' && !earned(t);
const kindName = kind => ({ story: 'Story', activities: 'Activities', collectibles: 'Collectibles', completion: 'Completion' })[kind];
const matchesType = (t, key) => key === 'all' || (key === 'missable' ? t.risk || t.verdict === 'missable' : t.kind === key);
const pad = n => String(n).padStart(2, '0');
const normalize = s => s.toLowerCase().replace(/[’‘]/g, "'").replace(/…/g, '...');

function verdict(t) {
  const badge = el('span', `badge ${t.risk ? 'risk' : t.verdict}`, t.risk ? '△ Potentially missable' : labels[t.verdict]);
  badge.title = t.risk ? 'The Chapter 1 window closes; trophy impact is unknown.' : definitions[t.verdict];
  return badge;
}

function gradeBadge(t) {
  return el('span', `grade ${t.grade}`, t.grade);
}

function mark(t, checked) {
  state.earned = trophies.filter(item => item.id === t.id ? checked : earned(item)).map(item => item.id);
  saveLedger();
  render();
}

function selectTrophy(id, reset = false) {
  if (reset) {
    type = 'all';
    $('search').value = '';
    $('earned-filter').value = 'all';
    view = 'ledger';
  }
  selected = id;
  render();
  if (reset) {
    const row = $(`trophy-${id}`);
    row?.scrollIntoView({ block: 'nearest' });
    row?.querySelector('button')?.focus({ preventScroll: true });
  }
  if (window.matchMedia('(max-width: 760px)').matches) $('detail').scrollIntoView({ block: 'start' });
}

function renderProgress() {
  $('earned-total').textContent = pad(state.earned.length);
  $('meter').value = state.earned.length;
  $('percent').textContent = `${Math.round(state.earned.length * 100 / trophies.length)}%`;
  $('grade-summary').replaceChildren(...Object.entries(grades).map(([grade, total]) => {
    const n = trophies.filter(t => t.grade === grade && earned(t)).length;
    const cell = el('span', `grade-stat ${grade}`);
    cell.append(el('i', 'diamond'), el('span', '', grade), el('b', '', `${n}/${total}`));
    return cell;
  }));
}

function renderFilters() {
  $('filters').replaceChildren(...filters.map(([key, name, icon]) => {
    const control = button('filter', '', () => {
      type = key;
      $('search').value = '';
      render();
      $(`filter-${key}`).focus({ preventScroll: true });
    });
    control.id = `filter-${key}`;
    control.setAttribute('aria-pressed', String(key === type));
    const glyph = el('span', 'filter-icon', icon);
    glyph.setAttribute('aria-hidden', 'true');
    control.append(glyph, el('span', '', name), el('span', 'filter-count', pad(trophies.filter(t => matchesType(t, key)).length)));
    return control;
  }));
  $('spoilers').checked = state.shield;
  $('spoiler-note').textContent = state.shield ? 'Shield on · unearned story hidden' : 'Shield off · story details visible';
}

function renderNext() {
  const order = [28, ...routeStages[1].ids, 14, 17, 18, 30, 31, 25, ...trophies.filter(t => t.id !== 1).map(t => t.id), 1];
  const next = order.map(id => catalog.get(id)).find(t => !earned(t));
  $('next-link').disabled = !next;
  $('next-link').textContent = next ? (concealed(next) ? 'Next story milestone' : next.name) : 'Ledger complete';
  $('next-note').textContent = !next ? 'All 55 trophies recorded.' : next.risk ? 'Check the Chapter 1 window first.' : concealed(next) ? 'Continue the main story.' : next.target;
  $('next-link').onclick = next ? () => selectTrophy(next.id, true) : null;
}

function trophyRow(t) {
  const locked = concealed(t);
  const title = locked ? 'Hidden story trophy' : t.name;
  const row = el('div', `row${selected === t.id ? ' active' : ''}${locked ? ' concealed' : ''}`);
  row.id = `trophy-${t.id}`;
  row.dataset.trophy = t.id;
  const check = el('input', 'check');
  check.type = 'checkbox';
  check.checked = earned(t);
  check.setAttribute('aria-label', `Mark ${title} ${pad(t.id)} earned`);
  check.addEventListener('change', () => {
    mark(t, check.checked);
    $(`trophy-${t.id}`)?.querySelector('.check')?.focus({ preventScroll: true });
  });
  const open = button('row-open', '', () => {
    selectTrophy(t.id);
    $(`trophy-${t.id}`)?.querySelector('button')?.focus({ preventScroll: true });
  });
  open.setAttribute('aria-pressed', String(selected === t.id));
  const copy = el('span', 'row-copy');
  copy.append(el('strong', '', title), el('span', 'description', locked ? 'Details unlock when marked earned.' : t.description));
  const meta = el('span', 'row-meta');
  meta.append(gradeBadge(t));
  if (!locked && (t.risk || t.verdict === 'missable')) meta.append(el('span', 'row-risk', '△ At risk'));
  open.append(copy, meta);
  row.append(check, open);
  return row;
}

function renderList() {
  const search = normalize($('search').value.trim());
  const filter = $('earned-filter').value;
  const visible = (type === 'all' ? ledgerOrder : trophies).filter(t => matchesType(t, type) &&
    (filter === 'all' || earned(t) === (filter === 'earned')) &&
    (!search || normalize(concealed(t) ? 'hidden story trophy' : `${t.name} ${t.description} ${t.target}`).includes(search)));
  if (!visible.some(t => t.id === selected)) selected = visible[0]?.id ?? null;
  $('list-title').textContent = filters.find(([key]) => key === type)[1];
  $('list-count').textContent = `${visible.length} / ${trophies.length}`;
  const rows = $('rows');
  const previous = rows.scrollTop;
  rows.replaceChildren(...visible.map(trophyRow));
  if (!visible.length) rows.append(el('p', 'empty', type === 'online' ? 'No online trophies in this PS5 list.' : 'No trophies match these filters.'));
  rows.scrollTop = previous;
}

function renderGuide() {
  const panel = $('detail');
  panel.replaceChildren();
  const t = catalog.get(selected);
  const locked = t && concealed(t);
  panel.append(el('p', 'kicker section-label', `02 / FIELD GUIDE${t ? ` · FILE ${pad(t.id)}` : ''}`));
  if (!t) {
    panel.append(el('h2', '', 'No guide selected'));
    return;
  }
  const tags = el('div', 'tags');
  tags.append(gradeBadge(t), el('span', 'badge kind', kindName(t.kind)));
  if (!locked) tags.append(verdict(t));
  panel.append(tags, el('h2', '', locked ? 'Hidden story trophy' : t.name));
  if (locked) {
    panel.append(el('p', 'locked-message', 'Story shield is on. The name, description and guide appear only after you mark the trophy earned.'));
  } else {
    panel.append(el('p', 'official', t.description), el('p', 'target', t.target), el('h3', '', 'How to unlock'), el('p', 'guide-copy', t.guide));
    if (t.warning) panel.append(el('p', 'warning', t.warning));
    const citations = el('div', 'citations');
    citations.append(el('span', 'kicker', 'SOURCES'), ...t.sources.map(sourceLink));
    citations.title = officialSource;
    panel.append(citations);
  }
  const controls = el('div', 'guide-actions');
  controls.append(button(earned(t) ? 'record recorded' : 'record', earned(t) ? '✓ Earned · Undo' : '+ Mark earned', () => {
    mark(t, !earned(t));
    $('detail').querySelector('.record')?.focus({ preventScroll: true });
  }));
  panel.append(controls);
  if (!locked) {
    const label = el('label', 'notes', 'Personal notes');
    const area = el('textarea');
    area.rows = 2;
    area.maxLength = 2000;
    area.placeholder = 'Add a location, reminder or progress count…';
    area.value = state.notes[t.id] || '';
    area.addEventListener('input', () => {
      if (area.value) state.notes[t.id] = area.value;
      else delete state.notes[t.id];
      saveLedger();
    });
    label.append(area);
    panel.append(label);
  }
}

function renderRoadmap() {
  const route = $('roadmap');
  route.replaceChildren();
  const intro = el('div', 'route-intro');
  const title = el('h2', '', 'Road to platinum');
  title.id = 'route-title';
  const head = el('div');
  head.append(el('p', 'kicker section-label', '03 / PLANNING DESK'), title);
  intro.append(head, el('p', 'route-summary', '1 playthrough · 0 online trophies'));
  const stages = el('ol', 'route-stages');
  routeStages.forEach((step, index) => {
    const li = el('li', index === 0 ? 'route-risk' : '');
    const copy = el('div', 'stage-copy');
    const hide = state.shield && (index < 2) && step.ids.some(id => index === 0 || !earned(catalog.get(id)));
    copy.append(el('p', 'kicker', step.label), el('h3', '', step.title), el('p', '', step.text));
    if (!hide) {
      const extra = el('details', 'stage-detail');
      extra.append(el('summary', '', index === 1 ? 'Mission checkpoints' : 'Route notes'), el('p', '', step.detail));
      copy.append(extra);
    }
    const pins = el('div', 'pins');
    const ids = index === 0 ? [28] : index === 1 ? [2, 8, 9, 13] : index === 2 ? [14, 17, 30] : [25, 1];
    for (const id of ids) {
      const t = catalog.get(id);
      if (!concealed(t)) pins.append(button('pin', `${earned(t) ? '✓ ' : ''}${t.name} ↗`, () => selectTrophy(id, true)));
    }
    copy.append(pins);
    li.append(el('span', 'stage-number', pad(index + 1)), copy);
    stages.append(li);
  });
  const checklist = el('details', 'completion');
  const quotas = el('div', 'quotas');
  for (const [heading, entries] of completionGroups) {
    const column = el('section');
    const items = el('ul');
    items.append(...entries.map(text => el('li', '', text)));
    column.append(el('h3', '', heading), items);
    quotas.append(column);
  }
  checklist.append(el('summary', '', 'Full 100% completion targets'), quotas);
  const refs = el('div', 'citations route-refs');
  refs.append(el('span', 'kicker', 'SOURCES'), sourceLink('guide'), sourceLink('completion'), sourceLink('meditation'));
  route.append(intro, stages, checklist, refs);
}

function render() {
  renderProgress();
  $('ledger').hidden = view !== 'ledger';
  $('roadmap').hidden = view !== 'roadmap';
  for (const name of ['ledger', 'roadmap']) $(`tab-${name}`).setAttribute('aria-pressed', String(name === view));
  if (view === 'roadmap') renderRoadmap();
  else {
    renderFilters();
    renderNext();
    renderList();
    renderGuide();
  }
}

function exportLedger() {
  const link = el('a');
  link.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  link.download = 'leonida-ledger-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  announce('Progress and notes exported.');
}

async function importLedger(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 750000) throw Error('Backup too large');
    state = validateBackup(JSON.parse(await file.text()));
  } catch {
    announce('Import failed. Choose a valid Leonida Ledger backup.');
    return;
  }
  saveLedger();
  render();
  if (saveAvailable) announce(`Restored ${state.earned.length} earned trophies, notes and spoiler setting.`);
}

loadLedger();
for (const name of ['ledger', 'roadmap']) $(`tab-${name}`).addEventListener('click', () => {
  view = name;
  render();
});
for (const [id, event] of [['search', 'input'], ['earned-filter', 'change']]) $(id).addEventListener(event, render);
$('spoilers').addEventListener('change', event => {
  state.shield = event.target.checked;
  saveLedger();
  render();
});
$('export').addEventListener('click', exportLedger);
$('import-button').addEventListener('click', () => $('import').click());
$('import').addEventListener('change', importLedger);
render();
