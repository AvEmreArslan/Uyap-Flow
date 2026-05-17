/* ============================================================================
 *  UYAP Toplu Evrak İndirici  -  main.js  (v2.0.0)
 *  https://avukat.uyap.gov.tr
 * ============================================================================ */

(function () {
  'use strict';

  if (window.__uyapBulkInitialized) return;
  window.__uyapBulkInitialized = true;

  const ORIG = {
    fetch: window.fetch.bind(window),
    xhrOpen: XMLHttpRequest.prototype.open,
    xhrSend: XMLHttpRequest.prototype.send,
    title: document.title,
  };

  const C = {
    primary: '#0b3d91', primaryHover: '#0a3380', accent: '#1e88e5',
    ok: '#1e8e3e', warn: '#e37400', err: '#c5221f',
    bg: '#ffffff', panel: '#f8f9fb', border: '#dadce0',
    text: '#202124', muted: '#5f6368',
    logBg: '#0d1117', logText: '#d0d7de',
  };

  const STORAGE_KEY = 'uyapBulk:lastDownload';

  /* ============================== STYLES ============================== */
  const CSS = `
  #uyap-bulk-root, #uyap-bulk-root *,
  #uyap-bulk-root *::before, #uyap-bulk-root *::after { box-sizing: border-box; }

  .uyap-bulk-fab {
    position: fixed; left: 20px; bottom: 20px; z-index: 2147483646;
    display: inline-flex; align-items: center; gap: 9px;
    background: linear-gradient(135deg, #0b3d91 0%, #1e88e5 55%, #42a5f5 100%);
    background-size: 200% 200%; background-position: 0% 0%;
    color: #fff; border: 0; border-radius: 14px;
    padding: 10px 16px 10px 12px;
    font: 700 14px/1 -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
    letter-spacing: .3px;
    box-shadow:
      0 4px 14px rgba(11, 61, 145, 0.30),
      0 2px 4px rgba(11, 61, 145, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
    cursor: pointer; user-select: none; opacity: 0.5;
    transition: opacity .22s ease, transform .22s cubic-bezier(.34, 1.56, .64, 1),
                box-shadow .22s ease, background-position .35s ease;
    backdrop-filter: saturate(140%);
  }
  .uyap-bulk-fab:hover {
    opacity: 1; transform: translateY(-3px) scale(1.03);
    background-position: 100% 100%;
    box-shadow:
      0 10px 28px rgba(11, 61, 145, 0.42),
      0 4px 10px rgba(11, 61, 145, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.30);
  }
  .uyap-bulk-fab:active { transform: translateY(-1px) scale(0.98); }
  .uyap-bulk-fab.open { opacity: 1; }
  .uyap-bulk-fab .uyap-bulk-fab-icon {
    width: 26px; height: 26px; border-radius: 8px;
    background: rgba(255, 255, 255, 0.16);
    display: inline-flex; align-items: center; justify-content: center;
    flex: none; transition: background .2s ease, transform .25s ease;
  }
  .uyap-bulk-fab:hover .uyap-bulk-fab-icon {
    background: rgba(255, 255, 255, 0.26); transform: rotate(-6deg);
  }
  .uyap-bulk-fab svg { width: 16px; height: 16px; fill: currentColor; }
  .uyap-bulk-fab .uyap-bulk-fab-plus {
    color: #ffd54f; font-weight: 800; font-size: 16px;
    margin-left: -2px; text-shadow: 0 0 8px rgba(255, 213, 79, 0.4);
  }
  @keyframes uyap-bulk-pulse {
    0%, 100% { box-shadow: 0 4px 14px rgba(11,61,145,0.30), 0 0 0 0 rgba(30,136,229,0.55); }
    50%      { box-shadow: 0 4px 14px rgba(11,61,145,0.30), 0 0 0 10px rgba(30,136,229,0); }
  }
  .uyap-bulk-fab.attention { animation: uyap-bulk-pulse 1.8s ease-in-out infinite; }

  .uyap-bulk-panel {
    position: fixed; left: 18px; bottom: 76px; z-index: 2147483647;
    width: 480px; max-width: calc(100vw - 36px);
    max-height: 82vh;
    background: ${C.bg}; color: ${C.text};
    border: 1px solid ${C.border}; border-radius: 14px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
    display: flex; flex-direction: column; overflow: hidden;
    font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .uyap-bulk-panel[hidden] { display: none; }

  .uyap-bulk-header {
    padding: 12px 16px;
    background: linear-gradient(135deg, ${C.primary}, ${C.accent}); color: #fff;
    display: flex; align-items: center; justify-content: space-between;
  }
  .uyap-bulk-header h3 { margin: 0; font-size: 14px; font-weight: 700; letter-spacing: .2px; }
  .uyap-bulk-header .brand { font-weight: 800; }
  .uyap-bulk-header .brand-plus {
    color: #ffd54f; font-weight: 800;
    text-shadow: 0 0 8px rgba(255, 213, 79, 0.45); margin-right: 2px;
  }
  .uyap-bulk-header .brand-sub { font-weight: 500; opacity: .85; }
  .uyap-bulk-header .sub { display: block; font-size: 11px; font-weight: 500; opacity: .85; margin-top: 2px; }
  .uyap-bulk-close {
    background: rgba(255, 255, 255, .15); border: 0; color: #fff; cursor: pointer;
    width: 26px; height: 26px; border-radius: 50%; font-size: 16px; line-height: 1;
    display: flex; align-items: center; justify-content: center; transition: background .15s ease;
  }
  .uyap-bulk-close:hover { background: rgba(255, 255, 255, .28); }

  .uyap-bulk-body { padding: 10px 14px; overflow: auto; flex: 1; background: ${C.panel}; }
  .uyap-bulk-footer {
    padding: 10px 14px; background: ${C.bg};
    border-top: 1px solid ${C.border};
    display: flex; gap: 6px;
  }

  .uyap-bulk-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 0; gap: 8px;
  }
  .uyap-bulk-row + .uyap-bulk-row { border-top: 1px solid #ecedee; }
  .uyap-bulk-row label { color: ${C.muted}; flex: 1; min-width: 0; }
  .uyap-bulk-row strong { color: ${C.text}; font-size: 14px; }

  .uyap-bulk-row input[type=number] {
    width: 78px; padding: 5px 8px;
    border: 1px solid ${C.border}; border-radius: 5px;
    font: inherit; color: ${C.text}; background: #fff;
  }
  .uyap-bulk-row input[type=text],
  .uyap-bulk-row input[type=date] {
    padding: 5px 8px; border: 1px solid ${C.border}; border-radius: 5px;
    font: inherit; color: ${C.text}; background: #fff; width: 150px;
  }
  .uyap-bulk-row input[type=checkbox] { transform: scale(1.1); cursor: pointer; flex: none; }
  .uyap-bulk-row select {
    padding: 5px 8px; border: 1px solid ${C.border}; border-radius: 5px;
    font: inherit; color: ${C.text}; background: #fff; cursor: pointer; min-width: 160px;
  }

  .uyap-bulk-section {
    border: 1px solid ${C.border}; border-radius: 8px;
    background: #fff; margin: 6px 0; overflow: hidden;
  }
  .uyap-bulk-section-head {
    padding: 8px 12px; cursor: pointer; user-select: none;
    background: #f1f3f4; border-bottom: 1px solid ${C.border};
    display: flex; justify-content: space-between; align-items: center;
    font-weight: 600; font-size: 12.5px; color: ${C.text};
  }
  .uyap-bulk-section-head:hover { background: #e8ebee; }
  .uyap-bulk-section-head .chev { transition: transform .2s ease; }
  .uyap-bulk-section.open .uyap-bulk-section-head .chev { transform: rotate(90deg); }
  .uyap-bulk-section-body { padding: 6px 12px 8px; display: none; }
  .uyap-bulk-section.open .uyap-bulk-section-body { display: block; }
  .uyap-bulk-section-head .badge {
    background: ${C.accent}; color: #fff; font-size: 10.5px; font-weight: 600;
    padding: 2px 7px; border-radius: 999px; margin-left: 6px;
  }

  .uyap-bulk-hint {
    font-size: 11px; color: ${C.muted}; padding: 4px 0 6px; line-height: 1.45;
  }
  .uyap-bulk-hint b { color: ${C.warn}; }

  .uyap-bulk-btn {
    padding: 8px 12px; border: 0; border-radius: 7px;
    background: ${C.accent}; color: #fff;
    font: 600 12.5px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    cursor: pointer; transition: background .15s ease, opacity .15s ease;
    white-space: nowrap;
  }
  .uyap-bulk-btn:hover:not([disabled]) { background: ${C.primary}; }
  .uyap-bulk-btn[disabled] { opacity: .55; cursor: not-allowed; }
  .uyap-bulk-btn.ghost { background: #fff; color: ${C.text}; border: 1px solid ${C.border}; }
  .uyap-bulk-btn.ghost:hover:not([disabled]) { background: #f1f3f4; border-color: ${C.muted}; }
  .uyap-bulk-btn.primary { background: ${C.primary}; }
  .uyap-bulk-btn.primary:hover:not([disabled]) { background: ${C.primaryHover}; }
  .uyap-bulk-btn.flex { flex: 1; }
  .uyap-bulk-btn.small { padding: 4px 10px; font-size: 11.5px; }

  .uyap-bulk-progress {
    height: 7px; background: #e8eaed; border-radius: 4px; overflow: hidden; margin-top: 10px;
  }
  .uyap-bulk-progress > div {
    height: 100%; background: linear-gradient(90deg, ${C.accent}, ${C.ok});
    width: 0%; transition: width .3s ease;
  }
  .uyap-bulk-progress-label {
    font-size: 11px; color: ${C.muted}; padding-top: 4px; text-align: center;
  }

  .uyap-bulk-log {
    margin-top: 10px; padding: 8px 10px;
    background: ${C.logBg}; color: ${C.logText};
    border-radius: 7px; max-height: 200px; overflow: auto;
    font: 11.5px/1.5 ui-monospace, "Cascadia Mono", Consolas, "SF Mono", monospace;
  }
  .uyap-bulk-log .line { margin: 1px 0; word-break: break-word; }
  .uyap-bulk-log .ok   { color: #4ec97a; }
  .uyap-bulk-log .warn { color: #f0b04e; }
  .uyap-bulk-log .err  { color: #f87a72; }
  .uyap-bulk-log .info { color: #79c0ff; }
  .uyap-bulk-log:empty::before {
    content: "Henüz log yok. Önce 'Tara' butonuna basın.";
    color: #6e7681; font-style: italic;
  }

  /* Önizleme listesi */
  .uyap-bulk-list {
    margin-top: 8px; max-height: 320px; overflow: auto;
    border: 1px solid ${C.border}; border-radius: 6px; background: #fff;
  }
  .uyap-bulk-list-item {
    padding: 8px 10px; border-bottom: 1px solid #ecedee;
    display: grid; grid-template-columns: 22px 1fr auto;
    gap: 8px; align-items: center; font-size: 12px;
  }
  .uyap-bulk-list-item:last-child { border-bottom: 0; }
  .uyap-bulk-list-item:hover { background: #f8f9fa; }
  .uyap-bulk-list-item .meta {
    display: flex; flex-direction: column; gap: 2px; min-width: 0;
  }
  .uyap-bulk-list-item .title {
    font-weight: 600; color: ${C.text}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .uyap-bulk-list-item .sub {
    color: ${C.muted}; font-size: 11px;
    display: flex; gap: 8px; flex-wrap: wrap;
  }
  .uyap-bulk-list-item .sub span { white-space: nowrap; }
  .uyap-bulk-list-item button.peek {
    background: #f1f3f4; border: 1px solid ${C.border}; color: ${C.text};
    cursor: pointer; padding: 3px 8px; border-radius: 4px; font-size: 11px;
  }
  .uyap-bulk-list-item button.peek:hover { background: #e0e3e5; }
  .uyap-bulk-list-item.excluded { opacity: 0.4; background: #fbfbfb; }

  .uyap-bulk-list-toolbar {
    padding: 6px 10px; background: #f1f3f4;
    border-bottom: 1px solid ${C.border};
    display: flex; gap: 6px; align-items: center; font-size: 11.5px;
  }
  .uyap-bulk-list-toolbar .count { color: ${C.muted}; margin-left: auto; }

  .uyap-bulk-list-empty {
    padding: 16px; text-align: center; color: ${C.muted}; font-style: italic;
  }

  /* Queue list */
  .uyap-bulk-queue {
    margin: 6px 0; max-height: 180px; overflow: auto;
    border: 1px solid ${C.border}; border-radius: 6px; background: #fff;
  }
  .uyap-bulk-queue-item {
    padding: 6px 10px; border-bottom: 1px solid #ecedee;
    display: flex; gap: 8px; align-items: center; font-size: 12px;
  }
  .uyap-bulk-queue-item:last-child { border-bottom: 0; }
  .uyap-bulk-queue-item button {
    background: #fee; border: 1px solid #fcc; color: #c00;
    cursor: pointer; padding: 2px 7px; border-radius: 4px; font-size: 11px;
  }

  /* Type filter chips */
  .uyap-bulk-chips {
    display: flex; flex-wrap: wrap; gap: 4px; padding-top: 4px;
    max-height: 110px; overflow: auto;
  }
  .uyap-bulk-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 8px; border-radius: 999px;
    background: #fff; border: 1px solid ${C.border};
    font-size: 11px; cursor: pointer; user-select: none;
  }
  .uyap-bulk-chip:hover { background: #f1f3f4; }
  .uyap-bulk-chip.active { background: ${C.accent}; color: #fff; border-color: ${C.accent}; }

  .uyap-bulk-divider {
    height: 1px; background: ${C.border}; margin: 6px 0;
  }
  `;

  /* ============================== HELPERS ============================== */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, '');
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function sanitize(s) {
    return String(s || '').replace(/[\\/:*?"<>|\r\n\t]/g, '_').trim();
  }

  function injectCSS() {
    if (document.getElementById('uyap-bulk-style')) return;
    const style = el('style', { id: 'uyap-bulk-style' });
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function parseTitleAttr(str) {
    const meta = {};
    String(str || '').split('\n').forEach((line) => {
      const m = line.match(/^\s*([^:]+?)\s*:\s*(.*)\s*$/);
      if (m) meta[m[1].trim()] = m[2].trim();
    });
    return meta;
  }

  function parseDateDDMMYYYY(s) {
    if (!s) return null;
    const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) return null;
    return new Date(+m[3], +m[2] - 1, +m[1]);
  }

  function makeFilename(meta, index, ext) {
    const tarih = (meta['Onaylandığı Tarih'] || meta['Sisteme Gönderildiği Tarih'] || '')
      .replace(/\//g, '-');
    const tur = sanitize(meta['Tür'] || 'Evrak').slice(0, 50);
    const aciklama = sanitize(meta['Açıklama'] || '').slice(0, 40);
    const birim = sanitize(meta['Birim Evrak No'] || String(index));
    return [tarih, tur, aciklama, birim].filter(Boolean).join('_').replace(/_+/g, '_') + ext;
  }

  function getOpenDosyaInfo() {
    // Modal title: "2025/849 İstanbul Anadolu 37. Asliye Ceza Mahkemesi - Ceza Dava Dosyası"
    const titleEl = document.querySelector('.dx-popup-title [title]');
    const txt = (titleEl?.getAttribute('title') || titleEl?.textContent || '').trim();
    const m = txt.match(/^(\d{4})\/(\d+)\s+(.+?)\s+-\s+(.+)$/);
    if (m) {
      return {
        yil: m[1], no: m[2],
        esas: `${m[1]}-${m[2]}`,
        mahkeme: sanitize(m[3]).slice(0, 80),
        dosyaTuru: sanitize(m[4]).slice(0, 40),
        raw: txt,
      };
    }
    return { yil: '', no: '', esas: 'Dosya', mahkeme: '', dosyaTuru: '', raw: txt };
  }

  function getOpenDosyaFolderName() {
    const d = getOpenDosyaInfo();
    return sanitize([d.esas, d.mahkeme].filter(Boolean).join('_')).slice(0, 100) || 'UYAP_Dosya';
  }

  /* ============================== STATE ============================== */
  const state = {
    scanned: [],      // {row, treeNode, treeItem, meta, aria, date, type}
    filtered: [],     // after filters
    selected: new Set(), // indices in filtered
    queue: [],        // multi-case mode: [{row, ariaInfo}]
    isRunning: false,
    isQueueRunning: false,
  };

  let UI = {}; // DOM refs

  /* ============================== UI BUILD ============================== */
  function buildUI() {
    if (document.getElementById('uyap-bulk-root')) return;

    /* ---- FAB ---- */
    const fab = el('button', { class: 'uyap-bulk-fab', title: 'Uyap+ — Toplu Evrak İndirici',
      html:
        `<span class="uyap-bulk-fab-icon"><svg viewBox="0 0 24 24" aria-hidden="true">
           <path d="M12 3v10.55l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4 3.6 3.6V3h2zm-7 16h14v2H5v-2z"/>
         </svg></span>
         <span>Uyap<span class="uyap-bulk-fab-plus">+</span></span>` });

    const panel = el('div', { class: 'uyap-bulk-panel', hidden: true });

    /* ---- Header ---- */
    const header = el('div', { class: 'uyap-bulk-header' },
      el('div', {},
        el('h3', {}, el('span', { class: 'brand' }, 'Uyap'), el('span', { class: 'brand-plus' }, '+'),
          el('span', { class: 'brand-sub' }, ' Toplu Evrak İndirici')),
        el('span', { class: 'sub' }, 'v2.0 — filtreler, ZIP, çoklu dosya')),
      el('button', { class: 'uyap-bulk-close', title: 'Kapat' }, '×')
    );

    /* ---- BODY ---- */
    const body = el('div', { class: 'uyap-bulk-body' });

    /* --- Section: Genel --- */
    UI.countEl = el('strong', {}, '—');
    UI.formatSelect = el('select');
    UI.formatSelect.appendChild(el('option', { value: 'udf' }, 'UDF (orijinal format)'));
    UI.formatSelect.appendChild(el('option', { value: 'pdf' }, 'PDF (otomatik dönüşüm)'));

    UI.delayInput = el('input', { type: 'number', min: '0', max: '20000', step: '100', value: '800' });
    UI.expandInput = el('input', { type: 'checkbox' }); UI.expandInput.checked = true;

    const formatHint = el('div', { class: 'uyap-bulk-hint' });
    const updateHint = () => {
      formatHint.innerHTML = UI.formatSelect.value === 'pdf'
        ? 'PDF modu: Her evrak önizleyiciye yüklenir, UYAP\'ın hazırladığı PDF doğrudan yakalanır. <b>Birebir PDF kalitesi.</b>'
        : 'UDF modu: UYAP\'ın orijinal evrak formatı. Açmak için UYAP Editör gerekir.';
    };
    UI.formatSelect.addEventListener('change', updateHint);
    updateHint();

    body.appendChild(
      makeSection('genel', '⚙ Genel Ayarlar', true,
        el('div', { class: 'uyap-bulk-row' }, el('label', {}, 'Bulunan evrak:'), UI.countEl),
        el('div', { class: 'uyap-bulk-row' }, el('label', {}, 'İndirme formatı:'), UI.formatSelect),
        formatHint,
        el('div', { class: 'uyap-bulk-row' }, el('label', {}, 'İndirme arası bekleme (ms):'), UI.delayInput),
        el('div', { class: 'uyap-bulk-row' }, el('label', {}, 'Ek-evrakları otomatik aç:'), UI.expandInput),
      )
    );

    /* --- Section: Filtreler --- */
    UI.useDateFilter   = makeToggle();
    UI.dateFrom        = el('input', { type: 'date' });
    UI.dateTo          = el('input', { type: 'date' });

    UI.useTypeFilter   = makeToggle();
    UI.typeChips       = el('div', { class: 'uyap-bulk-chips' });

    UI.useKeyword      = makeToggle();
    UI.keywordInput    = el('input', { type: 'text', placeholder: 'Örn. bilirkişi, tebligat' });

    UI.useOnlyNew      = makeToggle();
    UI.onlyNewInfo     = el('span', { class: 'uyap-bulk-hint' }, '');

    UI.useSelection    = makeToggle();

    UI.filterBadge = el('span', { class: 'badge', style: 'display:none' }, '0');

    const filterSection = makeSection('filtre', '⚲ Filtreler (opsiyonel)', false,
      el('div', { class: 'uyap-bulk-hint' },
        'Bu seçenekleri açtığınızda sadece kriterlere uyan evraklar indirilir. ',
        'Hiçbirini açmazsanız tüm evraklar indirilir.'),
      makeOpt('Evrak seçim modu (checkbox\'lı liste göster)', UI.useSelection),
      makeOpt('Tarih aralığı', UI.useDateFilter,
        el('div', { class: 'uyap-bulk-row' }, el('label', {}, 'Başlangıç:'), UI.dateFrom),
        el('div', { class: 'uyap-bulk-row' }, el('label', {}, 'Bitiş:'), UI.dateTo)),
      makeOpt('Tür filtresi', UI.useTypeFilter,
        el('div', { class: 'uyap-bulk-hint' }, 'Tara butonuna bastıktan sonra evrak türleri burada listelenir. İstediklerini seç.'),
        UI.typeChips),
      makeOpt('Anahtar kelime', UI.useKeyword,
        el('div', { class: 'uyap-bulk-row' }, el('label', {}, 'İçeren:'), UI.keywordInput)),
      makeOpt('Sadece yeni evraklar (önceki indirmeden sonrakileri)', UI.useOnlyNew,
        UI.onlyNewInfo),
      el('div', { style: 'display:flex; gap:6px; padding-top:6px;' },
        el('button', { class: 'uyap-bulk-btn ghost small', onclick: applyFiltersAndRefresh }, 'Filtreleri Uygula'),
        el('button', { class: 'uyap-bulk-btn ghost small', onclick: resetFilters }, 'Sıfırla')),
    );

    const filterHead = filterSection.querySelector('.uyap-bulk-section-head > span');
    if (filterHead) filterHead.appendChild(UI.filterBadge);

    body.appendChild(filterSection);

    /* --- Section: Çıktı seçenekleri --- */
    UI.useAutoFolder = makeToggle(); UI.useAutoFolder.checked = true;
    UI.useZip        = makeToggle();
    UI.exportCsvBtn  = el('button', { class: 'uyap-bulk-btn ghost small', onclick: exportCSV }, 'CSV / Excel Listesi İndir');

    body.appendChild(
      makeSection('cikti', '↓ Çıktı Seçenekleri', true,
        makeOpt('Otomatik alt klasör yapısı (Dosya_2025-849/...)', UI.useAutoFolder),
        makeOpt('Tek ZIP arşivi olarak indir', UI.useZip,
          el('div', { class: 'uyap-bulk-hint' }, 'Tüm evraklar tek bir .zip dosyasında paketlenir. Büyük arşivler için RAM kullanımı artar.')),
        el('div', { class: 'uyap-bulk-divider' }),
        el('div', { class: 'uyap-bulk-hint' }, 'Evrak listesini Excel\'de açabileceğin CSV (UTF-8) dosyası olarak çıkar:'),
        UI.exportCsvBtn,
      )
    );

    /* --- Section: Gelişmiş --- */
    UI.useMultiCase = makeToggle();
    UI.useNotify    = makeToggle(); UI.useNotify.checked = true;
    UI.useTitleProg = makeToggle(); UI.useTitleProg.checked = true;

    UI.queueList = el('div', { class: 'uyap-bulk-queue uyap-bulk-list-empty' }, 'Henüz kuyrukta dosya yok.');
    UI.addQueueBtn = el('button', { class: 'uyap-bulk-btn ghost small', onclick: addCurrentToQueue }, '+ Açık Dosyayı Kuyruğa Ekle');
    UI.scanGridBtn = el('button', { class: 'uyap-bulk-btn ghost small', onclick: addGridResultsToQueue }, '+ Listedeki Tüm Dosyaları Ekle');
    UI.clearQueueBtn = el('button', { class: 'uyap-bulk-btn ghost small', onclick: clearQueue }, 'Kuyruğu Temizle');

    body.appendChild(
      makeSection('gelismis', '⚙ Gelişmiş', false,
        makeOpt('Çoklu dosya kuyruğu (birden fazla dosyayı sırayla işle)', UI.useMultiCase,
          el('div', { class: 'uyap-bulk-hint' },
            'Kuyruğa eklediğin her dosya teker teker otomatik açılır, evrakları indirilir ve sonraki dosyaya geçilir. ',
            'Dosya Sorgula sayfasındaki tablodan veya açık olan dosyayı kuyruğa ekleyebilirsin.'),
          el('div', { style: 'display:flex; gap:6px; flex-wrap:wrap; padding-top:4px;' },
            UI.addQueueBtn, UI.scanGridBtn, UI.clearQueueBtn),
          UI.queueList,
        ),
        makeOpt('Tarayıcı bildirimi göster (işlem bittiğinde)', UI.useNotify),
        makeOpt('Tarayıcı başlığında ilerleme göster ([25/50])', UI.useTitleProg),
      )
    );

    /* --- Section: Önizleme --- */
    UI.previewList = el('div', { class: 'uyap-bulk-list uyap-bulk-list-empty' }, 'Henüz evrak taranmadı.');
    UI.previewToolbar = el('div', { class: 'uyap-bulk-list-toolbar' });
    UI.previewSelectAll = el('button', { class: 'uyap-bulk-btn ghost small', onclick: () => setAllSelection(true) }, 'Tümünü Seç');
    UI.previewClearAll = el('button', { class: 'uyap-bulk-btn ghost small', onclick: () => setAllSelection(false) }, 'Hiçbirini Seçme');
    UI.previewCount = el('span', { class: 'count' }, '');
    UI.previewToolbar.appendChild(UI.previewSelectAll);
    UI.previewToolbar.appendChild(UI.previewClearAll);
    UI.previewToolbar.appendChild(UI.previewCount);

    body.appendChild(
      makeSection('onizleme', '📑 Önizleme — Evrak Listesi', false,
        el('div', { class: 'uyap-bulk-hint' }, 'Tarama sonrası tüm evraklar burada listelenir. Üzerine tıklayarak UYAP\'ta önizleyebilirsin. Filtreler uygulandığında sönükleştirilir.'),
        UI.previewToolbar,
        UI.previewList,
      )
    );

    /* --- Progress + Log --- */
    UI.progressBar = el('div');
    UI.progressLabel = el('div', { class: 'uyap-bulk-progress-label' }, '');
    UI.logBox = el('div', { class: 'uyap-bulk-log' });

    body.appendChild(el('div', { class: 'uyap-bulk-progress' }, UI.progressBar));
    body.appendChild(UI.progressLabel);
    body.appendChild(UI.logBox);

    /* --- Footer buttons --- */
    UI.scanBtn = el('button', { class: 'uyap-bulk-btn ghost flex', onclick: onScan }, 'Tara');
    UI.saveLogBtn = el('button', { class: 'uyap-bulk-btn ghost small', onclick: saveLog }, 'Log Kaydet');
    UI.startBtn = el('button', { class: 'uyap-bulk-btn flex', disabled: true, onclick: onStart }, 'İndirmeyi Başlat');

    const footer = el('div', { class: 'uyap-bulk-footer' }, UI.scanBtn, UI.saveLogBtn, UI.startBtn);

    panel.appendChild(header);
    panel.appendChild(body);
    panel.appendChild(footer);

    const root = el('div', { id: 'uyap-bulk-root' }, fab, panel);
    document.body.appendChild(root);

    UI.panel = panel; UI.fab = fab;

    const syncFabState = () => {
      fab.classList.toggle('open', !panel.hidden);
    };
    fab.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      syncFabState();
      if (!panel.hidden && !state.scanned.length) onScan();
    });
    header.querySelector('.uyap-bulk-close')
      .addEventListener('click', () => { panel.hidden = true; syncFabState(); });

    // Filtre değişikliklerini canlı yansıt
    [UI.useDateFilter, UI.dateFrom, UI.dateTo,
     UI.useTypeFilter,
     UI.useKeyword,
     UI.useOnlyNew,
     UI.useSelection].forEach((inp) => {
      inp.addEventListener('change', applyFiltersAndRefresh);
    });
    UI.keywordInput.addEventListener('input', () => {
      if (UI.useKeyword.checked) applyFiltersAndRefresh();
    });

    // Bildirim izni: kullanıcı ilk açtığında iste
    UI.useNotify.addEventListener('change', () => {
      if (UI.useNotify.checked) ensureNotificationPermission();
    });

    refreshOnlyNewInfo();
  }

  function makeSection(id, title, openByDefault, ...children) {
    const head = el('div', { class: 'uyap-bulk-section-head' },
      el('span', {}, el('span', { class: 'chev' }, '▶ '), title),
      el('span', {}, ' ')
    );
    const body = el('div', { class: 'uyap-bulk-section-body' }, ...children);
    const section = el('div', { class: 'uyap-bulk-section' + (openByDefault ? ' open' : '') }, head, body);
    head.addEventListener('click', () => section.classList.toggle('open'));
    section.dataset.section = id;
    return section;
  }

  function makeToggle() {
    return el('input', { type: 'checkbox' });
  }

  function makeOpt(labelText, toggle, ...sub) {
    const wrap = el('div', { class: 'uyap-bulk-opt' });
    const row = el('div', { class: 'uyap-bulk-row' }, el('label', {}, labelText), toggle);
    wrap.appendChild(row);
    if (sub.length) {
      const sec = el('div', { style: 'padding: 4px 0 6px 0;' }, ...sub);
      sec.style.display = toggle.checked ? 'block' : 'none';
      toggle.addEventListener('change', () => {
        sec.style.display = toggle.checked ? 'block' : 'none';
      });
      wrap.appendChild(sec);
    }
    return wrap;
  }

  /* ============================== LOG / PROGRESS ============================== */
  const logLines = [];
  function log(msg, kind = '') {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    const line = el('div', { class: 'line' + (kind ? ' ' + kind : '') }, msg);
    UI.logBox.appendChild(line);
    UI.logBox.scrollTop = UI.logBox.scrollHeight;
    logLines.push(`[${timestamp}] ${kind.toUpperCase() ? `(${kind.toUpperCase()}) ` : ''}${msg}`);
  }
  function clearLog() {
    UI.logBox.innerHTML = '';
    logLines.length = 0;
  }
  function setProgress(p, label) {
    p = Math.max(0, Math.min(100, p));
    UI.progressBar.style.width = p + '%';
    if (label !== undefined) UI.progressLabel.textContent = label;
    if (UI.useTitleProg?.checked && label) {
      document.title = `[${Math.round(p)}%] ${label} — UYAP`;
    }
  }
  function resetTitle() {
    document.title = ORIG.title;
  }

  /* ============================== SCAN ============================== */
  async function expandAll() {
    for (let i = 0; i < 14; i++) {
      let acted = 0;
      document.querySelectorAll(
        '.evrak-treeview .dx-treeview-toggle-item-visibility:not(.dx-treeview-toggle-item-visibility-opened)'
      ).forEach((n) => { n.click(); acted++; });
      document.querySelectorAll('.ek-evrak-panel-trigger-wrapper button')
        .forEach((b) => { b.click(); acted++; });
      if (!acted) break;
      await sleep(600);
    }
    await sleep(800);
  }

  async function onScan() {
    if (state.isRunning) return;
    clearLog();
    setProgress(0, '');
    UI.startBtn.disabled = true;
    UI.countEl.textContent = '—';
    state.scanned = [];
    state.filtered = [];
    state.selected = new Set();

    log('Evrak listesi taranıyor…', 'info');

    if (UI.expandInput.checked) {
      log('Gizli ek-evraklar açılıyor…');
      await expandAll();
    }

    const rows = Array.from(document.querySelectorAll('.evrak-list--item'))
      .filter((r) => r.querySelector('button[aria-label="download"]'));

    state.scanned = rows.map((row, i) => {
      const treeNode = row.closest('li.dx-treeview-node');
      const treeItem = treeNode?.querySelector('.dx-item.dx-treeview-item');
      const tdiv = row.querySelector('div[title]');
      const meta = parseTitleAttr(tdiv?.getAttribute('title'));
      const aria = treeNode?.getAttribute('aria-label') || `#${i + 1}`;
      const dateStr = meta['Onaylandığı Tarih'] || meta['Sisteme Gönderildiği Tarih'];
      const date = parseDateDDMMYYYY(dateStr);
      const type = (meta['Tür'] || '').trim();
      return { row, treeNode, treeItem, meta, aria, date, type, index: i };
    });

    log(`Toplam ${state.scanned.length} evrak bulundu.`, state.scanned.length ? 'ok' : 'warn');

    refreshTypeChips();
    refreshOnlyNewInfo();
    applyFiltersAndRefresh();

    if (state.scanned.length === 0) {
      log('Hiç evrak bulunamadı. "Tüm Evrak" veya "Son 20 Evrak" klasörü açık mı?', 'warn');
    }
  }

  /* ============================== FILTERS ============================== */
  function refreshTypeChips() {
    const types = new Set(state.scanned.map((s) => s.type).filter(Boolean));
    UI.typeChips.innerHTML = '';
    [...types].sort().forEach((t) => {
      const chip = el('div', { class: 'uyap-bulk-chip', 'data-type': t }, t);
      chip.addEventListener('click', () => {
        chip.classList.toggle('active');
        applyFiltersAndRefresh();
      });
      UI.typeChips.appendChild(chip);
    });
  }

  function getSelectedTypes() {
    return Array.from(UI.typeChips.querySelectorAll('.uyap-bulk-chip.active'))
      .map((c) => c.dataset.type);
  }

  function refreshOnlyNewInfo() {
    if (!UI.onlyNewInfo) return;
    const info = getLastDownloadInfo();
    if (info) {
      UI.onlyNewInfo.textContent = `Son indirme: ${new Date(info.ts).toLocaleString('tr-TR')} (${info.count} evrak).`;
    } else {
      UI.onlyNewInfo.textContent = 'Bu dosya için henüz indirme kaydı yok. İlk indirmede tüm evraklar alınacak.';
    }
  }

  function getLastDownloadInfo() {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const dosya = getOpenDosyaInfo().esas;
      return all[dosya] || null;
    } catch { return null; }
  }

  function setLastDownloadInfo(count) {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const dosya = getOpenDosyaInfo().esas;
      all[dosya] = { ts: Date.now(), count };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { /* ignore */ }
  }

  function resetFilters() {
    UI.useDateFilter.checked = false;
    UI.useTypeFilter.checked = false;
    UI.useKeyword.checked = false;
    UI.useOnlyNew.checked = false;
    UI.useSelection.checked = false;
    UI.dateFrom.value = ''; UI.dateTo.value = '';
    UI.keywordInput.value = '';
    UI.typeChips.querySelectorAll('.uyap-bulk-chip.active').forEach((c) => c.classList.remove('active'));
    // Trigger change events to hide sub-sections
    [UI.useDateFilter, UI.useTypeFilter, UI.useKeyword, UI.useOnlyNew, UI.useSelection].forEach(t => {
      t.dispatchEvent(new Event('change'));
    });
    applyFiltersAndRefresh();
  }

  function applyFiltersAndRefresh() {
    if (!state.scanned.length) {
      state.filtered = [];
      refreshPreview();
      updateActionButtonCount();
      return;
    }

    let filtered = state.scanned.slice();
    let activeCount = 0;

    if (UI.useDateFilter.checked && (UI.dateFrom.value || UI.dateTo.value)) {
      activeCount++;
      const from = UI.dateFrom.value ? new Date(UI.dateFrom.value) : null;
      const to = UI.dateTo.value ? new Date(UI.dateTo.value + 'T23:59:59') : null;
      filtered = filtered.filter((s) => {
        if (!s.date) return false;
        if (from && s.date < from) return false;
        if (to && s.date > to) return false;
        return true;
      });
    }

    if (UI.useTypeFilter.checked) {
      const types = getSelectedTypes();
      if (types.length > 0) {
        activeCount++;
        filtered = filtered.filter((s) => types.includes(s.type));
      }
    }

    if (UI.useKeyword.checked && UI.keywordInput.value.trim()) {
      activeCount++;
      const kw = UI.keywordInput.value.trim().toLocaleLowerCase('tr');
      filtered = filtered.filter((s) => {
        const blob = [s.aria, s.type, s.meta['Açıklama'] || '', s.meta['Tür'] || '']
          .join(' ').toLocaleLowerCase('tr');
        return blob.includes(kw);
      });
    }

    if (UI.useOnlyNew.checked) {
      activeCount++;
      const info = getLastDownloadInfo();
      if (info) {
        const lastTs = info.ts;
        filtered = filtered.filter((s) => !s.date || s.date.getTime() > lastTs);
      }
    }

    state.filtered = filtered;
    if (UI.useSelection.checked) {
      // keep previously selected if still in filtered
      state.selected = new Set(filtered.map((s) => s.index).filter((i) => state.selected.has(i)));
    } else {
      state.selected = new Set(filtered.map((s) => s.index));
    }

    UI.countEl.textContent = `${filtered.length} / ${state.scanned.length}`;
    UI.filterBadge.textContent = String(activeCount);
    UI.filterBadge.style.display = activeCount ? 'inline-flex' : 'none';

    refreshPreview();
    updateActionButtonCount();
  }

  function updateActionButtonCount() {
    let toDownload;
    if (UI.useSelection.checked) {
      toDownload = state.selected.size;
    } else {
      toDownload = state.filtered.length;
    }
    UI.startBtn.disabled = toDownload === 0;
    UI.startBtn.textContent = toDownload > 0 ? `İndirmeyi Başlat (${toDownload})` : 'İndirmeyi Başlat';
  }

  /* ============================== PREVIEW ============================== */
  function setAllSelection(value) {
    if (!UI.useSelection.checked) return;
    if (value) state.filtered.forEach((s) => state.selected.add(s.index));
    else state.filtered.forEach((s) => state.selected.delete(s.index));
    refreshPreview();
    updateActionButtonCount();
  }

  function refreshPreview() {
    UI.previewList.innerHTML = '';
    UI.previewList.classList.remove('uyap-bulk-list-empty');

    const selMode = UI.useSelection.checked;
    UI.previewSelectAll.style.display = selMode ? 'inline-flex' : 'none';
    UI.previewClearAll.style.display = selMode ? 'inline-flex' : 'none';
    UI.previewCount.textContent =
      `${selMode ? state.selected.size + ' seçili / ' : ''}${state.filtered.length} listede / ${state.scanned.length} toplam`;

    if (state.scanned.length === 0) {
      UI.previewList.classList.add('uyap-bulk-list-empty');
      UI.previewList.textContent = 'Henüz evrak taranmadı. "Tara" butonuna basın.';
      return;
    }

    const filteredIdxSet = new Set(state.filtered.map((s) => s.index));

    state.scanned.forEach((s) => {
      const inFilter = filteredIdxSet.has(s.index);
      const item = el('div', { class: 'uyap-bulk-list-item' + (inFilter ? '' : ' excluded') });

      let cb = null;
      if (selMode && inFilter) {
        cb = el('input', { type: 'checkbox' });
        cb.checked = state.selected.has(s.index);
        cb.addEventListener('change', () => {
          if (cb.checked) state.selected.add(s.index);
          else state.selected.delete(s.index);
          UI.previewCount.textContent = `${state.selected.size} seçili / ${state.filtered.length} listede / ${state.scanned.length} toplam`;
          updateActionButtonCount();
        });
        item.appendChild(cb);
      } else {
        item.appendChild(el('span'));
      }

      const meta = s.meta;
      const tarihStr = meta['Onaylandığı Tarih'] || '—';
      const turStr = meta['Tür'] || '—';
      const aciklamaStr = meta['Açıklama'] || '';
      const birim = meta['Birim Evrak No'] || '';

      const metaEl = el('div', { class: 'meta' },
        el('div', { class: 'title', title: s.aria }, `${turStr}${aciklamaStr ? ' — ' + aciklamaStr : ''}`),
        el('div', { class: 'sub' },
          el('span', {}, tarihStr),
          birim ? el('span', {}, '№ ' + birim) : null,
          meta['Gönderen Yer Kişi'] ? el('span', { title: 'Gönderen' }, '↳ ' + meta['Gönderen Yer Kişi'].slice(0, 40)) : null,
        )
      );
      item.appendChild(metaEl);

      const peekBtn = el('button', { class: 'peek', title: 'UYAP önizleyicide aç' }, '👁 Önizle');
      peekBtn.addEventListener('click', () => {
        try { s.treeItem?.click(); } catch (_) {}
      });
      item.appendChild(peekBtn);

      UI.previewList.appendChild(item);
    });
  }

  /* ============================== CSV / LOG EXPORT ============================== */
  function exportCSV() {
    if (!state.scanned.length) {
      log('Önce "Tara" butonuyla evrakları listele.', 'warn');
      return;
    }
    const rows = (UI.useSelection.checked
      ? state.scanned.filter((s) => state.selected.has(s.index))
      : state.filtered.length ? state.filtered : state.scanned);

    const headers = ['Sıra', 'Tarih', 'Tür', 'Açıklama', 'Birim Evrak No', 'Gönderen', 'Gönderen Dosya No', 'Tip', 'Sisteme Gönderildiği'];
    const csvRows = [headers.join(';')];

    rows.forEach((s, i) => {
      const m = s.meta;
      const fields = [
        i + 1,
        m['Onaylandığı Tarih'] || '',
        m['Tür'] || '',
        m['Açıklama'] || '',
        m['Birim Evrak No'] || '',
        m['Gönderen Yer Kişi'] || '',
        m['Gönderen Dosya No'] || '',
        m['Tip'] || '',
        m['Sisteme Gönderildiği Tarih'] || '',
      ];
      csvRows.push(fields.map(csvCell).join(';'));
    });

    const csv = '\uFEFF' + csvRows.join('\r\n'); // UTF-8 BOM for Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const dosyaAd = getOpenDosyaFolderName();
    saveBlobAs(blob, `${dosyaAd}_evrak_listesi.csv`);
    log(`CSV listesi indirildi: ${rows.length} kayıt.`, 'ok');
  }

  function csvCell(v) {
    const s = String(v == null ? '' : v).replace(/"/g, '""');
    return /[;"\r\n]/.test(s) ? `"${s}"` : s;
  }

  function saveLog() {
    if (!logLines.length) {
      log('Kaydedilecek log yok.', 'warn');
      return;
    }
    const blob = new Blob([logLines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    saveBlobAs(blob, `uyap-toplu-indir-log_${ts}.txt`);
    log('Log dosyası indirildi.', 'ok');
  }

  /* ============================== QUEUE ============================== */
  function refreshQueue() {
    if (!UI.queueList) return;
    UI.queueList.innerHTML = '';
    if (!state.queue.length) {
      UI.queueList.classList.add('uyap-bulk-list-empty');
      UI.queueList.textContent = 'Henüz kuyrukta dosya yok.';
      return;
    }
    UI.queueList.classList.remove('uyap-bulk-list-empty');
    state.queue.forEach((q, i) => {
      const removeBtn = el('button', {}, 'Çıkar');
      removeBtn.addEventListener('click', () => {
        state.queue.splice(i, 1);
        refreshQueue();
      });
      const item = el('div', { class: 'uyap-bulk-queue-item' },
        el('span', {}, `${i + 1}.`),
        el('span', { style: 'flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;', title: q.label }, q.label),
        removeBtn);
      UI.queueList.appendChild(item);
    });
  }

  function addCurrentToQueue() {
    const info = getOpenDosyaInfo();
    if (!info.esas || info.esas === 'Dosya') {
      log('Açık dosya bulunamadı. Önce bir dosyayı aç.', 'warn');
      return;
    }
    if (state.queue.find((q) => q.esas === info.esas)) {
      log(`Dosya zaten kuyrukta: ${info.esas}`, 'warn');
      return;
    }
    state.queue.push({ esas: info.esas, label: info.raw || info.esas, source: 'modal' });
    log(`Kuyruğa eklendi: ${info.raw || info.esas}`, 'ok');
    refreshQueue();
  }

  function addGridResultsToQueue() {
    // Find rows in dosya-sorgulama grid
    const rows = Array.from(document.querySelectorAll('.dx-data-row'));
    if (!rows.length) {
      log('Dosya Sorgula sayfasında bir liste görünmüyor. Önce sorgulama yap.', 'warn');
      return;
    }
    let added = 0;
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      const mahkeme = cells[0]?.textContent.trim() || '';
      const dosyaNo = cells[1]?.textContent.trim() || '';
      const goruntuleBtn = row.querySelector('[id="dosya-goruntule"], [aria-label="Pencere Görünümü"]');
      if (!goruntuleBtn || !dosyaNo) return;
      const esas = dosyaNo.replace(/\//g, '-');
      if (state.queue.find((q) => q.esas === esas)) return;
      state.queue.push({
        esas, label: `${dosyaNo} ${mahkeme}`,
        source: 'grid', viewBtn: goruntuleBtn,
      });
      added++;
    });
    log(`${added} dosya kuyruğa eklendi.`, added ? 'ok' : 'warn');
    refreshQueue();
  }

  function clearQueue() {
    state.queue = [];
    refreshQueue();
    log('Kuyruk temizlendi.');
  }

  async function waitForModalClose(timeout = 6000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const overlay = document.querySelector('.dx-overlay-wrapper.dx-popup-wrapper:not(.dx-state-invisible) .dx-overlay-content');
      if (!overlay || overlay.offsetParent === null) return true;
      await sleep(200);
    }
    return false;
  }

  async function waitForModalOpenAndTree(timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const tree = document.querySelector('.evrak-treeview');
      if (tree) return true;
      await sleep(250);
    }
    return false;
  }

  async function closeOpenModal() {
    const visiblePopups = Array.from(document.querySelectorAll('.dx-overlay-wrapper.dx-popup-wrapper'))
      .filter((p) => p.offsetParent !== null);
    for (const p of visiblePopups) {
      const closeBtn = p.querySelector('.dx-popup-title [aria-label="Kapat"]');
      if (closeBtn) {
        try { closeBtn.click(); } catch (_) {}
      }
    }
    await waitForModalClose();
  }

  /* ============================== START / DISPATCH ============================== */
  async function onStart() {
    if (state.isRunning) return;

    if (UI.useMultiCase.checked && state.queue.length > 0) {
      await runMultiCaseQueue();
      return;
    }

    const rowsToProcess = UI.useSelection.checked
      ? state.scanned.filter((s) => state.selected.has(s.index))
      : state.filtered;

    if (!rowsToProcess.length) {
      log('İndirilecek evrak yok. Önce "Tara" butonuna basın veya filtreleri kontrol edin.', 'warn');
      return;
    }

    await runSingleCaseDownload(rowsToProcess);
  }

  async function runSingleCaseDownload(rows) {
    state.isRunning = true;
    UI.scanBtn.disabled = true;
    UI.startBtn.disabled = true;
    setProgress(0, 'Başlatılıyor…');

    const delay = Math.max(0, parseInt(UI.delayInput.value, 10) || 800);
    const format = UI.formatSelect.value;

    log(`İndirme başlıyor: ${rows.length} evrak, format=${format.toUpperCase()}, ${delay}ms bekleme.`, 'info');

    let result;
    try {
      if (format === 'pdf') {
        result = await runPdfMode(rows, delay);
      } else {
        result = await runUdfMode(rows, delay);
      }
      setLastDownloadInfo(result?.ok || 0);
      refreshOnlyNewInfo();
      notifyComplete(result);
    } catch (e) {
      log(`Beklenmedik hata: ${e?.message || e}`, 'err');
      console.error('[UYAP Toplu İndirici]', e);
    } finally {
      restoreNetworkHooks();
      setProgress(100, 'Tamamlandı');
      resetTitle();
      state.isRunning = false;
      UI.scanBtn.disabled = false;
      updateActionButtonCount();
    }
  }

  async function runMultiCaseQueue() {
    state.isRunning = true; state.isQueueRunning = true;
    UI.scanBtn.disabled = true;
    UI.startBtn.disabled = true;

    log(`Çoklu dosya kuyruğu başlıyor: ${state.queue.length} dosya.`, 'info');

    let totalOk = 0, totalBad = 0;

    for (let qi = 0; qi < state.queue.length; qi++) {
      const q = state.queue[qi];
      log(`──── Dosya ${qi + 1}/${state.queue.length}: ${q.label} ────`, 'info');

      try {
        if (q.source === 'grid' && q.viewBtn) {
          // Close any open modal first
          await closeOpenModal();
          q.viewBtn.click();
          const opened = await waitForModalOpenAndTree(12000);
          if (!opened) {
            log('Modal açılamadı, atlandı.', 'err');
            continue;
          }
          await sleep(1500);
        }

        await onScan();
        await sleep(600);

        // Use current filters
        const rowsToProcess = UI.useSelection.checked
          ? state.scanned.filter((s) => state.selected.has(s.index))
          : state.filtered;

        if (!rowsToProcess.length) {
          log('Bu dosyada indirilecek evrak yok, atlanıyor.', 'warn');
          continue;
        }

        const format = UI.formatSelect.value;
        const delay = Math.max(0, parseInt(UI.delayInput.value, 10) || 800);

        let res;
        if (format === 'pdf') res = await runPdfMode(rowsToProcess, delay);
        else res = await runUdfMode(rowsToProcess, delay);

        totalOk += res?.ok || 0;
        totalBad += res?.bad || 0;
        setLastDownloadInfo(res?.ok || 0);

        if (q.source === 'grid') await closeOpenModal();
      } catch (e) {
        log(`Hata (dosya ${q.label}): ${e.message}`, 'err');
        totalBad++;
      }
    }

    log(`KUYRUK BİTTİ. Toplam başarılı: ${totalOk}, hatalı: ${totalBad}.`, 'ok');
    notifyComplete({ ok: totalOk, bad: totalBad });

    state.isRunning = false; state.isQueueRunning = false;
    restoreNetworkHooks();
    resetTitle();
    UI.scanBtn.disabled = false;
    updateActionButtonCount();
  }

  /* ============================== DOWNLOAD HELPERS ============================== */
  function restoreNetworkHooks() {
    window.fetch = ORIG.fetch;
    XMLHttpRequest.prototype.open = ORIG.xhrOpen;
    XMLHttpRequest.prototype.send = ORIG.xhrSend;
  }

  function saveBlobAs(blob, filename) {
    const blobUrl = URL.createObjectURL(blob);
    const a = el('a', { href: blobUrl, download: filename, style: 'display:none' });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(blobUrl); a.remove(); }, 1500);
  }

  function getFilenameWithFolder(meta, index, ext) {
    const base = makeFilename(meta, index, ext);
    if (UI.useAutoFolder?.checked) {
      const folder = getOpenDosyaFolderName();
      return `${folder}/${base}`;
    }
    return base;
  }

  async function packageAsZip(items, zipName) {
    if (typeof JSZip === 'undefined') {
      log('JSZip kütüphanesi yüklenemedi.', 'err');
      return false;
    }
    log(`ZIP arşivi oluşturuluyor: ${items.length} dosya…`, 'info');
    const zip = new JSZip();
    for (const item of items) {
      zip.file(item.filename, item.blob);
    }
    setProgress(95, 'ZIP yazılıyor…');
    const content = await zip.generateAsync({ type: 'blob' }, (m) => {
      setProgress(95 + m.percent * 0.05, `ZIP: ${m.percent.toFixed(0)}%`);
    });
    saveBlobAs(content, zipName);
    return true;
  }

  /* ============================== UDF MODE ============================== */
  async function runUdfMode(rows, delay) {
    const captured = [];
    let captureMode = true;

    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : input?.url;
      if (captureMode && url && url.includes('download_document_brd.uyap')) {
        captured.push(url);
        return Promise.reject(new DOMException('Toplu İndirici tarafından yakalandı', 'AbortError'));
      }
      return ORIG.fetch(input, init);
    };
    XMLHttpRequest.prototype.open = function (method, url) {
      this._uyapBulkUrl = url;
      return ORIG.xhrOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (captureMode && this._uyapBulkUrl && String(this._uyapBulkUrl).includes('download_document_brd.uyap')) {
        captured.push(this._uyapBulkUrl);
        try { this.abort(); } catch (_) {}
        return;
      }
      return ORIG.xhrSend.apply(this, arguments);
    };

    log('URL\'ler yakalanıyor…');
    const tasks = [];
    for (let i = 0; i < rows.length; i++) {
      const s = rows[i];
      const btn = s.row.querySelector('button[aria-label="download"]');
      if (!btn) { log(`#${i + 1} indir butonu yok, atlandı.`, 'warn'); continue; }
      const before = captured.length;
      try { btn.scrollIntoView({ block: 'center' }); } catch (_) {}
      btn.click();
      for (let w = 0; w < 50; w++) {
        if (captured.length > before) break;
        await sleep(80);
      }
      if (captured.length > before) {
        tasks.push({ url: captured[captured.length - 1], meta: s.meta, index: i + 1 });
      } else {
        log(`#${i + 1} URL yakalanamadı.`, 'warn');
      }
      setProgress(((i + 1) / rows.length) * 30, `URL yakalanıyor [${i + 1}/${rows.length}]`);
      await sleep(180);
    }

    captureMode = false;

    log(`${tasks.length} dosya indiriliyor…`, 'info');
    const zipMode = UI.useZip.checked;
    const zipItems = [];
    let ok = 0, bad = 0;

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      try {
        const r = await ORIG.fetch(t.url, { credentials: 'include' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const cd = r.headers.get('content-disposition') || '';
        const m = cd.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
        const origName = m ? decodeURIComponent(m[1].replace(/['"]/g, '').trim()) : null;
        let ext = '.udf';
        if (origName) {
          const mExt = origName.match(/\.([a-z0-9]{1,5})$/i);
          if (mExt) ext = '.' + mExt[1].toLowerCase();
        }
        const filename = getFilenameWithFolder(t.meta, t.index, ext);
        const blob = await r.blob();

        if (zipMode) {
          zipItems.push({ filename, blob });
          log(`+ ${filename} (${(blob.size / 1024).toFixed(1)} KB)`, 'ok');
        } else {
          saveBlobAs(blob, filename);
          log(`OK ${filename}`, 'ok');
        }
        ok++;
      } catch (e) {
        bad++;
        log(`HATA #${t.index}: ${e?.message || e}`, 'err');
      }
      setProgress(30 + ((i + 1) / Math.max(tasks.length, 1)) * (zipMode ? 60 : 70),
        `İndiriliyor [${i + 1}/${tasks.length}]`);
      await sleep(delay);
    }

    if (zipMode && zipItems.length > 0) {
      const zipName = `${getOpenDosyaFolderName()}_UDF_Arsivi.zip`;
      await packageAsZip(zipItems, zipName);
    }

    log(`BİTTİ. Başarılı: ${ok}, Hatalı: ${bad}.`, ok > 0 ? 'ok' : 'err');
    return { ok, bad };
  }

  /* ============================== PDF MODE ============================== */
  async function runPdfMode(rows, delay) {
    log('PDF modu: Her evrak önizleyiciye yüklenip arka planda dönen PDF verisi yakalanacak.', 'info');

    const capturedPdfs = [];
    let captureMode = true;

    const tryCapturePdf = async (blob, url) => {
      try {
        if (!blob || blob.size < 5) return false;
        const head = await blob.slice(0, 5).text();
        if (head.startsWith('%PDF-')) {
          capturedPdfs.push({ blob, url, ts: Date.now() });
          return true;
        }
      } catch (_) {}
      return false;
    };

    window.fetch = async function (input, init) {
      const reqUrl = typeof input === 'string' ? input : input?.url;
      const resp = await ORIG.fetch(input, init);
      if (captureMode && resp && resp.ok) {
        try {
          const ct = (resp.headers.get('content-type') || '').toLowerCase();
          const cd = resp.headers.get('content-disposition') || '';
          const interesting = ct.includes('pdf') || /\.pdf/i.test(cd) ||
            ct.includes('octet-stream') || ct.includes('binary') || ct === '';
          if (interesting) {
            try {
              const clone = resp.clone();
              clone.blob().then((b) => tryCapturePdf(b, reqUrl)).catch(() => {});
            } catch (_) {}
          }
        } catch (_) {}
      }
      return resp;
    };

    XMLHttpRequest.prototype.open = function (method, url) {
      this._uyapBulkUrl = url;
      return ORIG.xhrOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (captureMode && this._uyapBulkUrl) {
        const xhr = this;
        const onLoad = () => {
          xhr.removeEventListener('load', onLoad);
          try {
            const ct = (xhr.getResponseHeader('Content-Type') || '').toLowerCase();
            let blob = null;
            if (xhr.response instanceof Blob) blob = xhr.response;
            else if (xhr.response instanceof ArrayBuffer) blob = new Blob([xhr.response], { type: ct });
            if (blob) tryCapturePdf(blob, xhr._uyapBulkUrl);
          } catch (_) {}
        };
        xhr.addEventListener('load', onLoad);
      }
      return ORIG.xhrSend.apply(this, arguments);
    };

    const zipMode = UI.useZip.checked;
    const zipItems = [];
    let ok = 0, bad = 0;

    for (let i = 0; i < rows.length; i++) {
      const s = rows[i];
      if (!s.treeItem) { log(`#${i + 1}: tree öğesi yok, atlandı.`, 'warn'); bad++; continue; }

      const before = capturedPdfs.length;
      try { s.treeItem.scrollIntoView({ block: 'center' }); } catch (_) {}
      s.treeItem.click();

      const startWait = Date.now();
      while (Date.now() - startWait < 9000) {
        if (capturedPdfs.length > before) { await sleep(180); break; }
        await sleep(140);
      }

      if (capturedPdfs.length > before) {
        const pdf = capturedPdfs[capturedPdfs.length - 1];
        const filename = getFilenameWithFolder(s.meta, i + 1, '.pdf');
        try {
          if (zipMode) {
            zipItems.push({ filename, blob: pdf.blob });
            log(`+ ${filename} (${(pdf.blob.size / 1024).toFixed(1)} KB)`, 'ok');
          } else {
            saveBlobAs(pdf.blob, filename);
            log(`OK ${filename} (${(pdf.blob.size / 1024).toFixed(1)} KB)`, 'ok');
          }
          ok++;
        } catch (e) {
          bad++;
          log(`KAYIT HATASI ${filename}: ${e.message}`, 'err');
        }
      } else {
        bad++;
        log(`PDF yakalanamadı: ${s.aria}`, 'warn');
      }

      setProgress(((i + 1) / rows.length) * (zipMode ? 90 : 100),
        `PDF yakalanıyor [${i + 1}/${rows.length}]`);
      await sleep(delay);
    }

    captureMode = false;

    if (zipMode && zipItems.length > 0) {
      const zipName = `${getOpenDosyaFolderName()}_PDF_Arsivi.zip`;
      await packageAsZip(zipItems, zipName);
    }

    if (ok === 0 && bad > 0) {
      log('Hiç PDF yakalanamadı. UDF moduna geçmeyi dene.', 'err');
    } else {
      log(`BİTTİ. Başarılı: ${ok}, Başarısız: ${bad}.`, ok > 0 ? 'ok' : 'err');
    }
    return { ok, bad };
  }

  /* ============================== NOTIFICATION ============================== */
  async function ensureNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
      const r = await Notification.requestPermission();
      return r === 'granted';
    } catch { return false; }
  }

  async function notifyComplete(result) {
    if (!UI.useNotify?.checked) return;
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    try {
      const ok = result?.ok || 0, bad = result?.bad || 0;
      const dosya = getOpenDosyaInfo().raw || 'UYAP';
      new Notification('UYAP Toplu İndirici', {
        body: `${dosya}\nBaşarılı: ${ok}, Hatalı: ${bad}`,
        icon: 'https://avukat.uyap.gov.tr/favicon.ico',
        tag: 'uyap-bulk-done',
      });
    } catch (_) {}
  }

  /* ============================== INIT ============================== */
  function init() {
    try {
      injectCSS();
      buildUI();
    } catch (e) {
      console.error('[UYAP Toplu İndirici] başlatma hatası:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById('uyap-bulk-root') && document.body) init();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
