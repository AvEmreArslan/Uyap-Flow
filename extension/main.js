/* ============================================================================
 *  Uyap Flow — Toplu Evrak İndirici — main.js
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
    primary: '#1e40af', primaryHover: '#1d4ed8', accent: '#2563eb',
    accentSoft: '#3b82f6', accent2: '#93c5fd',
    ok: '#059669', warn: '#d97706', err: '#dc2626',
    bg: '#ffffff', panel: '#f4f5f7', surface: '#ffffff',
    border: '#e8eaef', borderStrong: '#d1d5db',
    text: '#0f172a', textSoft: '#475569', muted: '#64748b',
    logBg: '#1e293b', logText: '#e2e8f0',
    yellow: '#f59e0b',
    shadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
    shadowStrong: '0 18px 50px rgba(15, 23, 42, 0.14)',
  };

  const STORAGE_KEY     = 'uyapBulk:lastDownload';
  const STORAGE_PIN     = 'uyapBulk:pinned';
  const STORAGE_FAB_POS = 'uyapBulk:fabPos';
  const STORAGE_NOTES   = 'uyapBulk:notes';
  const STORAGE_TEMPL   = 'uyapBulk:filenameTemplate';
  const STORAGE_OPTS    = 'uyapBulk:opts';
  const DEFAULT_TEMPLATE = '{tarih}_{tur}_{aciklama}_{birim}';

  /* ============================== STYLES ============================== */
  const CSS = `
  #uyap-bulk-root, #uyap-bulk-root *,
  #uyap-bulk-root *::before, #uyap-bulk-root *::after { box-sizing: border-box; }
  #uyap-bulk-root {
    position: relative;
    z-index: 2147483000;
    isolation: isolate;
  }

  .uyap-bulk-fab {
    position: fixed; left: 20px; bottom: 20px; z-index: 2147483010;
    display: inline-flex; align-items: center; gap: 8px;
    background: ${C.primary}; color: #fff; border: 0; border-radius: 12px;
    padding: 10px 14px;
    font: 600 13px/1 -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
    box-shadow: 0 4px 14px rgba(30, 64, 175, 0.28);
    cursor: pointer; user-select: none; opacity: 0.52;
    transition: opacity .18s ease, transform .18s ease, box-shadow .18s ease;
  }
  .uyap-bulk-fab:hover {
    opacity: 1; transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(30, 64, 175, 0.35);
  }
  .uyap-bulk-fab:active { transform: translateY(0); }
  .uyap-bulk-fab.open { opacity: 1; }
  .uyap-bulk-fab .uyap-bulk-fab-icon {
    width: 24px; height: 24px; border-radius: 8px;
    background: rgba(255, 255, 255, 0.18);
    display: inline-flex; align-items: center; justify-content: center;
    flex: none;
  }
  .uyap-bulk-fab .uyap-bulk-fab-plus { color: ${C.accent2}; font-weight: 800; }
  .uyap-bulk-fab svg { width: 14px; height: 14px; fill: currentColor; }
  .uyap-bulk-fab.uyap-bulk-fab--dock {
    left: 20px !important; bottom: 20px !important; top: auto !important; right: auto !important;
  }
  .uyap-bulk-panel {
    position: fixed; z-index: 2147483020;
    width: 440px; max-width: calc(100vw - 32px);
    max-height: min(82vh, calc(100vh - 104px));
    background: ${C.bg}; color: ${C.text};
    border: 1px solid ${C.border}; border-radius: 16px;
    box-shadow: ${C.shadowStrong};
    display: flex; flex-direction: column; overflow: hidden;
    font: 13px/1.5 -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
    animation: uyap-bulk-fadeup .22s cubic-bezier(.2,.8,.2,1);
  }
  .uyap-bulk-panel.uyap-bulk-panel--dock {
    left: 16px !important; bottom: 84px !important;
    top: auto !important; right: auto !important;
  }
  .uyap-bulk-panel[hidden] { display: none; }

  @keyframes uyap-bulk-fadeup {
    from { opacity: 0; transform: translateY(8px) scale(.985); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .uyap-bulk-header {
    padding: 12px 14px 11px;
    background: ${C.bg}; color: ${C.text};
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 10px; flex-shrink: 0;
    border-bottom: 1px solid ${C.border};
  }
  .uyap-bulk-header-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
  .uyap-bulk-pin {
    background: ${C.panel}; border: 1px solid ${C.border}; color: ${C.textSoft}; cursor: pointer;
    width: 34px; height: 34px; border-radius: 9px; font-size: 14px;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s ease, border-color .15s ease, color .15s ease;
  }
  .uyap-bulk-pin:hover { background: #e8ecf1; border-color: ${C.borderStrong}; color: ${C.text}; }
  .uyap-bulk-pin.active { background: #fef3c7; border-color: #f59e0b; color: #92400e; }

  .uyap-bulk-header h3 { margin: 0; font-size: 15px; font-weight: 650; line-height: 1.25; letter-spacing: -0.02em; }
  .uyap-bulk-header .brand { font-weight: 650; color: ${C.text}; }
  .uyap-bulk-header .brand-plus { color: ${C.accent}; font-weight: 800; }
  .uyap-bulk-header .brand-sub { font-weight: 450; color: ${C.muted}; }
  .uyap-bulk-header .sub { display: block; font-size: 11px; font-weight: 450; color: ${C.muted}; margin-top: 3px; }

  .uyap-bulk-close {
    background: ${C.panel}; border: 1px solid ${C.border}; color: ${C.textSoft}; cursor: pointer;
    width: 34px; height: 34px; border-radius: 9px; font-size: 18px; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s ease, border-color .15s ease, color .15s ease;
  }
  .uyap-bulk-close:hover { background: #fee2e2; border-color: #fecaca; color: ${C.err}; }

  .uyap-bulk-statusbar {
    padding: 8px 14px;
    background: ${C.panel};
    border-bottom: 1px solid ${C.border};
    font-size: 11.5px; color: ${C.textSoft}; flex-shrink: 0;
  }
  .uyap-bulk-statusbar-main {
    display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
    row-gap: 6px;
  }
  .uyap-bulk-statusbar .pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 9px; border-radius: 999px;
    background: ${C.bg}; border: 1px solid ${C.border};
    max-width: 100%;
    font-size: 11.5px; line-height: 1.3;
  }
  .uyap-bulk-statusbar .pill.active { background: ${C.accent}; color: #fff; border-color: ${C.accent}; }
  .uyap-bulk-statusbar .pill.warn   { background: #fffbeb; color: #b45309; border-color: #fde68a; }
  .uyap-bulk-statusbar .pill .dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: .9; }
  .uyap-bulk-statusbar kbd {
    background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 4px;
    padding: 1px 5px; font: 10px ui-monospace, monospace; color: ${C.textSoft};
    box-shadow: 0 1px 0 rgba(15,23,42,.06);
  }

  .uyap-bulk-body {
    padding: 12px 14px 14px; overflow: auto; flex: 1; min-height: 0;
    background: ${C.panel};
    display: flex; flex-direction: column; gap: 0;
    align-items: stretch;
  }
  .uyap-bulk-body > * {
    flex-shrink: 0;
  }

  .uyap-bulk-footer {
    padding: 10px 12px 12px; background: ${C.bg};
    border-top: 1px solid ${C.border};
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
    justify-content: space-between; flex-shrink: 0;
  }
  .uyap-bulk-footer-trailing {
    display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
    justify-content: flex-end; flex: 1; min-width: 0;
  }

  .uyap-bulk-row {
    display: grid; grid-template-columns: 1fr auto; align-items: center;
    padding: 8px 0; gap: 10px 14px;
    min-height: unset;
  }
  .uyap-bulk-row + .uyap-bulk-row { border-top: 1px solid ${C.border}; }
  .uyap-bulk-row label { color: ${C.textSoft}; font-weight: 500; font-size: 12.5px; }
  .uyap-bulk-row strong { color: ${C.text}; font-size: 13px; font-weight: 600; justify-self: end; text-align: right; }

  .uyap-bulk-row input[type=number] {
    width: 88px; padding: 7px 10px;
    border: 1px solid ${C.border}; border-radius: 8px;
    font: inherit; color: ${C.text}; background: ${C.bg};
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .uyap-bulk-row input[type=text],
  .uyap-bulk-row input[type=date] {
    padding: 7px 10px; border: 1px solid ${C.border}; border-radius: 8px;
    font: inherit; color: ${C.text}; background: ${C.bg}; width: min(100%, 190px);
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .uyap-bulk-row input[type=number]:focus,
  .uyap-bulk-row input[type=text]:focus,
  .uyap-bulk-row input[type=date]:focus,
  .uyap-bulk-row select:focus {
    outline: none; border-color: ${C.accent};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }
  .uyap-bulk-row input[type=checkbox] {
    appearance: none; -webkit-appearance: none;
    width: 36px; height: 20px; border-radius: 999px;
    background: ${C.borderStrong}; cursor: pointer; flex: none;
    position: relative; transition: background .2s ease;
  }
  .uyap-bulk-row input[type=checkbox]::after {
    content: ''; position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px; border-radius: 50%; background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform .2s ease;
  }
  .uyap-bulk-row input[type=checkbox]:checked { background: ${C.accent}; }
  .uyap-bulk-row input[type=checkbox]:checked::after { transform: translateX(16px); }
  .uyap-bulk-row select {
    padding: 7px 10px; border: 1px solid ${C.border}; border-radius: 8px;
    font: inherit; color: ${C.text}; background: ${C.bg}; cursor: pointer; min-width: 188px;
    transition: border-color .15s ease, box-shadow .15s ease;
  }

  .uyap-bulk-block {
    display: block; width: 100%;
    margin: 0 0 12px; padding: 0;
    box-sizing: border-box;
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 12px;
    position: relative;
    z-index: 0;
    overflow: visible;
    contain: layout style;
  }
  .uyap-bulk-block:last-child { margin-bottom: 0; }
  .uyap-bulk-block-title {
    padding: 10px 14px;
    background: #f1f5f9;
    border-bottom: 1px solid ${C.border};
    border-radius: 12px 12px 0 0;
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px;
    font-weight: 600; font-size: 12.5px; color: ${C.text};
    letter-spacing: -0.01em;
  }
  .uyap-bulk-block-title .head-left {
    display: inline-flex; align-items: center; gap: 8px;
    min-width: 0; flex: 1;
  }
  .uyap-bulk-block-title .head-title {
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    min-width: 0;
  }
  .uyap-bulk-block-title .head-icon {
    width: 30px; height: 30px; border-radius: 9px;
    background: ${C.bg}; color: ${C.accent};
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 13px; flex: none;
  }
  .uyap-bulk-block-body {
    padding: 10px 14px 14px;
    display: block;
    overflow: visible;
    border-radius: 0 0 12px 12px;
  }
  .uyap-bulk-block-title .badge {
    background: ${C.accent}; color: #fff; font-size: 10.5px; font-weight: 700;
    padding: 2px 7px; border-radius: 999px; margin-left: 6px;
    min-width: 18px; text-align: center; flex-shrink: 0;
  }

  .uyap-bulk-opt { margin: 2px 0 8px; }
  .uyap-bulk-opt:last-child { margin-bottom: 0; }
  .uyap-bulk-opt-sub {
    padding: 10px 12px; margin-top: 8px;
    background: #f8fafc; border-radius: 10px; border: 1px solid ${C.border};
  }

  .uyap-bulk-hint {
    font-size: 12px; color: ${C.muted}; padding: 6px 0 8px; line-height: 1.45;
  }

  .uyap-bulk-monitor {
    padding: 10px 12px;
    background: ${C.surface};
    border: 1px solid ${C.border}; border-radius: 12px;
    box-shadow: none;
  }
  .uyap-bulk-hint b { color: ${C.warn}; font-weight: 600; }

  .uyap-bulk-btn {
    padding: 9px 14px; border: 0; border-radius: 8px;
    background: ${C.accent}; color: #fff;
    font: 600 13px -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
    cursor: pointer; transition: background .12s ease, opacity .12s ease;
    white-space: nowrap;
  }
  .uyap-bulk-btn:hover:not([disabled]) { background: ${C.primary}; }
  .uyap-bulk-btn:active:not([disabled]) { opacity: .92; }
  .uyap-bulk-btn[disabled] { opacity: .5; cursor: not-allowed; box-shadow: none; }
  .uyap-bulk-btn.ghost {
    background: ${C.bg}; color: ${C.text}; border: 1px solid ${C.border};
    box-shadow: none;
  }
  .uyap-bulk-btn.ghost:hover:not([disabled]) {
    background: ${C.panel}; border-color: #9ca3af;
  }
  .uyap-bulk-btn.primary { background: ${C.primary}; }
  .uyap-bulk-btn.primary:hover:not([disabled]) { background: ${C.primaryHover}; }
  .uyap-bulk-btn.success { background: ${C.ok}; }
  .uyap-bulk-btn.success:hover:not([disabled]) { background: #059669; }
  .uyap-bulk-btn.flex { flex: 1; }
  .uyap-bulk-btn.small { padding: 6px 11px; font-size: 12px; border-radius: 8px; }
  .uyap-bulk-btn .kbd-hint {
    margin-left: 6px; padding: 1px 5px; border-radius: 4px;
    background: rgba(255,255,255,.22); font: 10px ui-monospace, monospace;
  }

  .uyap-bulk-progress {
    height: 4px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: 0;
  }
  .uyap-bulk-progress > div {
    height: 100%; background: ${C.accent};
    width: 0%; transition: width .28s ease;
  }
  .uyap-bulk-progress-label {
    font-size: 10.5px; color: ${C.muted}; padding: 8px 0 0; text-align: left;
  }

  .uyap-bulk-log {
    margin-top: 8px; padding: 9px 11px;
    background: ${C.logBg}; color: ${C.logText};
    border-radius: 10px; max-height: 132px; min-height: 48px; overflow: auto;
    font: 11px/1.5 ui-monospace, Consolas, monospace;
    border: 1px solid #334155;
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
    margin-top: 6px; max-height: min(34vh, 300px); overflow: auto;
    border: 1px solid ${C.border}; border-radius: 10px; background: ${C.bg};
  }
  .uyap-bulk-list-item {
    padding: 10px 12px; border-bottom: 1px solid ${C.border};
    display: grid; grid-template-columns: 26px 1fr auto auto;
    gap: 10px; align-items: center; font-size: 12px;
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
    background: ${C.bg}; border: 1px solid ${C.border}; color: ${C.textSoft};
    cursor: pointer; padding: 7px 11px; border-radius: 10px; font-size: 12px; font-weight: 600;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    transition: background .12s ease, border-color .12s ease, color .12s ease;
  }
  .uyap-bulk-list-item button.peek:hover {
    background: ${C.panel}; border-color: ${C.accent}; color: ${C.accent};
  }
  .uyap-bulk-list-item.excluded { opacity: 0.4; background: #fbfbfb; }

  .uyap-bulk-list-toolbar {
    padding: 8px 10px; background: rgba(255,255,255,.96);
    border-bottom: 1px solid ${C.border};
    display: flex; gap: 6px; align-items: center; flex-wrap: wrap; font-size: 11.5px;
    position: sticky; top: 0; z-index: 1;
    backdrop-filter: blur(6px);
  }
  .uyap-bulk-list-toolbar .count { color: ${C.muted}; margin-left: auto; }

  .uyap-bulk-list-empty {
    padding: 16px; text-align: center; color: ${C.muted}; font-style: italic;
  }

  /* Queue list */
  .uyap-bulk-queue {
    margin: 8px 0 0; max-height: 200px; overflow: auto;
    border: 1px solid ${C.border}; border-radius: 12px; background: #fff;
    box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
  }
  .uyap-bulk-queue-item {
    padding: 10px 14px; border-bottom: 1px solid #ecedee;
    display: flex; gap: 8px; align-items: center; font-size: 12px;
  }
  .uyap-bulk-queue-item:last-child { border-bottom: 0; }
  .uyap-bulk-queue-item button {
    background: #fee; border: 1px solid #fcc; color: #c00;
    cursor: pointer; padding: 2px 7px; border-radius: 4px; font-size: 11px;
  }

  /* Type filter chips */
  .uyap-bulk-chips {
    display: flex; flex-wrap: wrap; gap: 8px; padding-top: 6px;
    max-height: 132px; overflow: auto;
  }
  .uyap-bulk-chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 5px 11px; border-radius: 999px;
    background: ${C.bg}; border: 1px solid ${C.border};
    font-size: 11.5px; cursor: pointer; user-select: none;
  }
  .uyap-bulk-chip:hover { background: #f1f5f9; }
  .uyap-bulk-chip.active { background: ${C.accent}; color: #fff; border-color: ${C.accent}; }

  .uyap-bulk-divider {
    height: 1px; background: ${C.border}; margin: 8px 0;
  }

  /* ====== Komut Paleti ====== */
  .uyap-bulk-palette-backdrop {
    position: fixed; inset: 0; z-index: 2147483100;
    background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(6px);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 14vh; animation: uyap-bulk-fadein .15s ease;
  }
  @keyframes uyap-bulk-fadein { from { opacity: 0; } to { opacity: 1; } }
  .uyap-bulk-palette {
    width: 620px; max-width: calc(100vw - 40px);
    background: ${C.bg}; border-radius: 18px;
    box-shadow: 0 24px 64px -8px rgba(0,0,0,0.45);
    overflow: hidden; display: flex; flex-direction: column;
    animation: uyap-bulk-fadeup .2s ease;
  }
  .uyap-bulk-palette-input {
    width: 100%; padding: 18px 20px; border: 0; border-bottom: 1px solid ${C.border};
    font: 500 16px -apple-system, "Segoe UI", system-ui, sans-serif;
    color: ${C.text}; background: ${C.bg}; outline: none;
  }
  .uyap-bulk-palette-input::placeholder { color: ${C.muted}; }
  .uyap-bulk-palette-list {
    max-height: 50vh; overflow-y: auto; padding: 6px;
  }
  .uyap-bulk-palette-item {
    padding: 9px 12px; border-radius: 8px; cursor: pointer;
    display: flex; gap: 10px; align-items: center;
    color: ${C.text}; transition: background .1s;
  }
  .uyap-bulk-palette-item:hover, .uyap-bulk-palette-item.active {
    background: ${C.panel};
  }
  .uyap-bulk-palette-item.active { background: ${C.accent}; color: #fff; }
  .uyap-bulk-palette-item .pal-icon {
    width: 30px; height: 30px; border-radius: 7px;
    background: ${C.panel}; display: inline-flex; align-items: center; justify-content: center;
    flex: none; font-size: 14px; color: ${C.accent};
  }
  .uyap-bulk-palette-item.active .pal-icon { background: rgba(255,255,255,.2); color: #fff; }
  .uyap-bulk-palette-item .pal-content { flex: 1; min-width: 0; }
  .uyap-bulk-palette-item .pal-title {
    font-weight: 600; font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .uyap-bulk-palette-item .pal-sub {
    font-size: 11.5px; opacity: .75; margin-top: 1px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .uyap-bulk-palette-item .pal-kbd {
    font: 10.5px ui-monospace, monospace;
    border: 1px solid ${C.border}; border-bottom-width: 2px;
    background: ${C.bg}; color: ${C.textSoft};
    border-radius: 4px; padding: 1px 5px; flex: none;
  }
  .uyap-bulk-palette-item.active .pal-kbd { background: rgba(255,255,255,.18); color: #fff; border-color: rgba(255,255,255,.3); }
  .uyap-bulk-palette-footer {
    padding: 8px 14px; border-top: 1px solid ${C.border};
    background: ${C.panel}; font-size: 11px; color: ${C.muted};
    display: flex; gap: 12px; justify-content: space-between; align-items: center;
  }
  .uyap-bulk-palette-footer kbd {
    background: ${C.bg}; border: 1px solid ${C.border}; border-bottom-width: 2px;
    border-radius: 4px; padding: 1px 5px; font: 10.5px ui-monospace, monospace;
    color: ${C.textSoft}; margin: 0 2px;
  }
  .uyap-bulk-palette-empty {
    padding: 24px; text-align: center; color: ${C.muted}; font-size: 13px;
  }

  /* ====== Tooltip ====== */
  .uyap-bulk-tooltip {
    position: fixed; z-index: 2147483035;
    background: ${C.text}; color: #fff;
    padding: 8px 11px; border-radius: 8px;
    font-size: 11.5px; line-height: 1.5;
    max-width: 320px; pointer-events: none;
    box-shadow: 0 8px 24px -4px rgba(0,0,0,0.4);
    opacity: 0; transform: translateY(-2px);
    transition: opacity .15s ease, transform .15s ease;
  }
  .uyap-bulk-tooltip.show { opacity: 1; transform: translateY(0); }
  .uyap-bulk-tooltip .tt-row { display: flex; gap: 6px; margin: 2px 0; }
  .uyap-bulk-tooltip .tt-label { color: #94a3b8; font-weight: 500; min-width: 70px; }
  .uyap-bulk-tooltip .tt-val { color: #f1f5f9; }
  .uyap-bulk-tooltip .tt-tags { margin-top: 4px; display: flex; gap: 4px; flex-wrap: wrap; }
  .uyap-bulk-tooltip .tt-tag {
    background: ${C.accent}; padding: 1px 6px; border-radius: 4px; font-size: 10.5px;
  }
  .uyap-bulk-tooltip .tt-note {
    margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.15);
    color: ${C.yellow}; font-style: italic;
  }

  /* ====== Notes Popup ====== */
  .uyap-bulk-note-pop {
    position: fixed; z-index: 2147483040;
    background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 12px;
    box-shadow: 0 16px 40px -8px rgba(0,0,0,0.3);
    width: 320px; padding: 12px;
    animation: uyap-bulk-fadeup .15s ease;
  }
  .uyap-bulk-note-pop h4 {
    margin: 0 0 8px; font-size: 12.5px; color: ${C.text}; font-weight: 700;
    display: flex; justify-content: space-between; align-items: center;
  }
  .uyap-bulk-note-pop textarea {
    width: 100%; padding: 8px 10px;
    border: 1px solid ${C.border}; border-radius: 7px;
    font: 12px -apple-system, "Segoe UI", system-ui;
    resize: vertical; min-height: 60px; box-sizing: border-box;
    outline: none; transition: border-color .15s ease, box-shadow .15s ease;
  }
  .uyap-bulk-note-pop textarea:focus {
    border-color: ${C.accent}; box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  }
  .uyap-bulk-note-pop .tag-input {
    margin-top: 6px; width: 100%; padding: 6px 9px;
    border: 1px solid ${C.border}; border-radius: 7px;
    font: 12px -apple-system, "Segoe UI", system-ui;
    box-sizing: border-box; outline: none;
  }
  .uyap-bulk-note-pop .tag-input:focus { border-color: ${C.accent}; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .uyap-bulk-note-pop .tag-row {
    display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px;
  }
  .uyap-bulk-note-pop .tag-pill {
    background: #e0e7ff; color: #3730a3; font-size: 10.5px;
    padding: 2px 7px; border-radius: 999px; display: inline-flex; align-items: center; gap: 4px;
  }
  .uyap-bulk-note-pop .tag-pill button {
    background: none; border: 0; cursor: pointer; padding: 0;
    color: #6366f1; font-size: 13px; line-height: 1;
  }
  .uyap-bulk-note-pop .note-actions {
    margin-top: 10px; display: flex; gap: 6px; justify-content: flex-end;
  }

  /* ====== Selection Toolbar (PTT sorgulama) ====== */
  .uyap-bulk-seltool {
    position: fixed; z-index: 2147483045;
    background: ${C.text}; color: #fff;
    border-radius: 10px; padding: 4px;
    display: inline-flex; align-items: center; gap: 2px;
    box-shadow: 0 8px 24px -6px rgba(0,0,0,0.45),
                0 2px 8px -2px rgba(0,0,0,0.3);
    font-family: -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
    opacity: 0; transform: translateY(4px) scale(.96);
    transition: opacity .15s ease, transform .15s ease;
    pointer-events: none; user-select: none;
  }
  .uyap-bulk-seltool.show {
    opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;
  }
  .uyap-bulk-seltool button {
    background: transparent; border: 0; color: #fff;
    padding: 6px 10px; border-radius: 7px;
    font: 600 12px -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
    cursor: pointer;
    display: inline-flex; align-items: center; gap: 5px;
    transition: background .12s ease;
  }
  .uyap-bulk-seltool button:hover { background: rgba(255, 255, 255, 0.18); }
  .uyap-bulk-seltool button.primary { background: ${C.accent}; }
  .uyap-bulk-seltool button.primary:hover { background: ${C.accentSoft}; }
  .uyap-bulk-seltool .sep { width: 1px; height: 18px; background: rgba(255,255,255,0.15); margin: 0 2px; }
  .uyap-bulk-seltool .barcode {
    background: rgba(255, 213, 79, 0.18); color: ${C.yellow};
    padding: 2px 7px; border-radius: 5px; font: 11px ui-monospace, Consolas, monospace;
    max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ====== Önizleme listesi: notlar göstergesi ====== */
  .uyap-bulk-list-item .note-mark {
    width: 26px; height: 26px; border-radius: 6px;
    background: transparent; border: 1px solid transparent; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    color: ${C.muted}; font-size: 12px;
    transition: all .15s ease;
  }
  .uyap-bulk-list-item .note-mark:hover { background: ${C.panel}; border-color: ${C.border}; color: ${C.text}; }
  .uyap-bulk-list-item .note-mark.has-note {
    background: #fef9c3; color: #854d0e; border-color: #fef08a;
  }
  .uyap-bulk-list-item .tag-mini {
    background: #e0e7ff; color: #3730a3; font-size: 9.5px;
    padding: 1px 5px; border-radius: 999px; margin-right: 3px;
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

  function makeEvrakKey(meta) {
    const dosya = getOpenDosyaInfo().esas;
    const birim = sanitize(meta['Birim Evrak No'] || '');
    const aciklama = sanitize(meta['Açıklama'] || '').slice(0, 40);
    const tarih = (meta['Onaylandığı Tarih'] || '').replace(/\//g, '-');
    return `${dosya}::${birim}::${tarih}::${aciklama}`;
  }

  /**
   * Aynı evrak UYAP ağacında birden fazla .evrak-list--item olarak görünebiliyor.
   * Tarama listesini tekilleştirmek için anahtar (tercihen Birim Evrak No + tarih).
   */
  function getEvrakScanDedupKey(meta) {
    const esas = getOpenDosyaInfo().esas;
    const birim = sanitize(String(meta['Birim Evrak No'] || '').trim());
    const tarihRaw = meta['Onaylandığı Tarih'] || meta['Sisteme Gönderildiği Tarih'] || '';
    const tarih = String(tarihRaw).replace(/\s/g, '');
    if (birim) return `${esas}::${birim}::${tarih}`;
    return makeEvrakKey(meta);
  }

  function getAllNotes() {
    try { return JSON.parse(localStorage.getItem(STORAGE_NOTES) || '{}'); }
    catch { return {}; }
  }
  function getNote(meta) {
    return getAllNotes()[makeEvrakKey(meta)] || null;
  }
  function setNote(meta, note) {
    const all = getAllNotes();
    const key = makeEvrakKey(meta);
    if (!note || (!note.text && (!note.tags || !note.tags.length))) {
      delete all[key];
    } else {
      all[key] = note;
    }
    try { localStorage.setItem(STORAGE_NOTES, JSON.stringify(all)); } catch { /* ignore */ }
  }

  function getCategoryFolder(meta) {
    const tur = sanitize(meta['Tür'] || '').toLowerCase();
    if (!tur) return 'Diger';
    if (/duruşma|durusma|celse|zapt/.test(tur)) return '01_Durusma_Zaptlari';
    if (/karar|hüküm|hukum|gerekçeli/.test(tur)) return '02_Kararlar';
    if (/bilirkişi|bilirkisi/.test(tur)) return '03_Bilirkisi_Raporlari';
    if (/tebliğ|teblig|tebligat/.test(tur)) return '04_Tebligatlar';
    if (/dilekçe|dilekce/.test(tur)) return '05_Dilekceler';
    if (/müzekkere|muzekkere/.test(tur)) return '06_Muzekkereler';
    if (/cevap|yanıt|yanit/.test(tur)) return '07_Cevap_Yazilari';
    if (/iddianame|esas hakkında|esas hakkinda/.test(tur)) return '08_Iddianame_Esas';
    if (/sorgu|ifade|beyan/.test(tur)) return '09_Sorgu_Ifadeler';
    if (/rapor|inceleme/.test(tur)) return '10_Raporlar';
    return '99_Diger';
  }

  /** Klasör adı — Windows uyumlu, kısa */
  function sanitizePathSegment(name) {
    const s = sanitize(String(name || '').replace(/\s+/g, ' ').trim()).slice(0, 120);
    return s || 'Klasor';
  }

  /** li.dx-treeview-node satırındaki görünen klasör/evrak başlığı (iç içe metin değil) */
  function extractDxTreeItemLabel(liNode) {
    if (!liNode || !liNode.classList.contains('dx-treeview-node')) return '';
    const kids = liNode.children;
    for (let i = 0; i < kids.length; i++) {
      const c = kids[i];
      if (c.tagName === 'UL') continue;
      const inner = c.querySelector?.('.dx-item-content') || c;
      const t = (inner.textContent || '').replace(/\s+/g, ' ').trim();
      if (t) return t.slice(0, 200);
    }
    return '';
  }

  /**
   * UYAP sol ağacında bu evrakın üzerindeki klasör zinciri [üst, ..., en iç].
   * Örn. Tebligatlar > Genel Müzekkere → ['Tebligatlar', 'Genel_Muzekkere']
   */
  function getEvrakTreeFolderSegments(leafTreeNode) {
    const segments = [];
    if (!leafTreeNode) return segments;
    let ul = leafTreeNode.parentElement;
    while (ul && !ul.classList.contains('dx-treeview-node-container')) {
      ul = ul.parentElement;
    }
    while (ul && ul.classList.contains('dx-treeview-node-container')) {
      const parentLi = ul.parentElement;
      if (!parentLi || !parentLi.classList.contains('dx-treeview-node')) break;
      const raw = extractDxTreeItemLabel(parentLi);
      if (raw) segments.unshift(sanitizePathSegment(raw));
      let next = parentLi.parentElement;
      while (next && !next.classList.contains('dx-treeview-node-container')) {
        next = next.parentElement;
      }
      ul = next;
    }
    return segments;
  }

  function renderTemplate(tmpl, meta, index, ext) {
    const tarih = (meta['Onaylandığı Tarih'] || meta['Sisteme Gönderildiği Tarih'] || '')
      .replace(/\//g, '-');
    const vars = {
      tarih,
      tur: sanitize(meta['Tür'] || 'Evrak').slice(0, 50),
      aciklama: sanitize(meta['Açıklama'] || '').slice(0, 40),
      birim: sanitize(meta['Birim Evrak No'] || ''),
      sira: String(index).padStart(3, '0'),
      gonderen: sanitize(meta['Gönderen Yer Kişi'] || '').slice(0, 30),
      tip: sanitize(meta['Tip'] || ''),
    };
    let out = tmpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
    out = out.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    return (out || 'Evrak') + ext;
  }

  /* ============================== STATE ============================== */
  const state = {
    scanned: [],      // {row, treeNode, treeItem, meta, aria, date, type, folderSegments, index}
    filtered: [],     // after filters
    selected: new Set(), // indices in filtered
    queue: [],        // multi-case mode: [{row, ariaInfo}]
    isRunning: false,
    isQueueRunning: false,
    fabPos: null,     // {left, top} - drag-bırak konumu
    pinned: false,    // panel her zaman açık başlasın mı
  };

  let UI = {}; // DOM refs
  let tooltipEl = null;
  let notePopEl = null;
  let paletteEl = null;
  let selToolEl = null;
  let selToolTimer = null;

  /* --- Persistent state ---- */
  function loadPersistedState() {
    try {
      state.pinned = localStorage.getItem(STORAGE_PIN) === '1';
      const pos = localStorage.getItem(STORAGE_FAB_POS);
      if (pos) state.fabPos = JSON.parse(pos);
    } catch { /* ignore */ }
  }
  function savePersistedFabPos() {
    try { localStorage.setItem(STORAGE_FAB_POS, JSON.stringify(state.fabPos)); } catch {}
  }
  function savePinned() {
    try { localStorage.setItem(STORAGE_PIN, state.pinned ? '1' : '0'); } catch {}
  }

  /* ============================== UI BUILD ============================== */
  function buildUI() {
    if (document.getElementById('uyap-bulk-root')) return;

    /* ---- FAB ---- */
    const fab = el('button', { class: 'uyap-bulk-fab uyap-bulk-fab--dock', title: 'Uyap Flow — Toplu Evrak İndirici',
      html:
        `<span class="uyap-bulk-fab-icon"><svg viewBox="0 0 24 24" aria-hidden="true">
           <path d="M12 3v10.55l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4 3.6 3.6V3h2zm-7 16h14v2H5v-2z"/>
         </svg></span>
         <span>Uyap<span class="uyap-bulk-fab-plus"> Flow</span></span>` });

    const panel = el('div', { class: 'uyap-bulk-panel uyap-bulk-panel--dock', hidden: true });

    /* ---- Header ---- */
    UI.pinBtn = el('button', { class: 'uyap-bulk-pin' + (state.pinned ? ' active' : ''),
      title: 'Paneli sabitle (sayfa yenilense de açık kalır)' }, '📌');
    UI.pinBtn.addEventListener('click', () => {
      state.pinned = !state.pinned;
      UI.pinBtn.classList.toggle('active', state.pinned);
      savePinned();
      log(state.pinned ? 'Panel sabitlendi. Sayfayı yenilersen otomatik açılır.' : 'Panel sabit değil.', 'info');
    });

    const header = el('div', { class: 'uyap-bulk-header' },
      el('div', { style: 'min-width: 0; flex: 1;' },
        el('h3', {}, el('span', { class: 'brand' }, 'Uyap'), el('span', { class: 'brand-plus' }, ' Flow'),
          el('span', { class: 'brand-sub' }, ' — Toplu Evrak İndirici')),
        el('span', { class: 'sub' }, 'v2.3.7 · Ctrl+K komut paleti')),
      el('div', { class: 'uyap-bulk-header-actions' },
        UI.pinBtn,
        el('button', { class: 'uyap-bulk-close', title: 'Kapat (Esc)' }, '×')
      )
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
      makeSection('genel', 'Genel Ayarlar', '⚙',
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

    const filterSection = makeSection('filtre', 'Filtreler (opsiyonel)', '⚲',
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

    const filterHead = filterSection.querySelector('.uyap-bulk-block-title .head-left');
    if (filterHead) filterHead.appendChild(UI.filterBadge);

    body.appendChild(filterSection);

    /* --- Section: Çıktı seçenekleri --- */
    UI.useAutoFolder  = makeToggle(); UI.useAutoFolder.checked = true;
    UI.useCategorize  = makeToggle();
    UI.useZip         = makeToggle();
    UI.useMergePdf    = makeToggle();
    UI.useTemplate    = makeToggle();
    UI.templateInput  = el('input', { type: 'text',
      placeholder: DEFAULT_TEMPLATE,
      style: 'width: 100%; font: 11.5px ui-monospace, Consolas, monospace;'
    });
    try {
      const savedTmpl = localStorage.getItem(STORAGE_TEMPL);
      if (savedTmpl) { UI.templateInput.value = savedTmpl; UI.useTemplate.checked = true; }
    } catch {}
    UI.templateInput.addEventListener('input', () => {
      try { localStorage.setItem(STORAGE_TEMPL, UI.templateInput.value); } catch {}
    });

    UI.exportCsvBtn  = el('button', { class: 'uyap-bulk-btn ghost small', onclick: exportCSV }, 'CSV / Excel Listesi İndir');

    body.appendChild(
      makeSection('cikti', 'Çıktı Seçenekleri', '↓',
        makeOpt('Otomatik alt klasör yapısı (Dosya_2025-849/...)', UI.useAutoFolder),
        makeOpt('Türe göre kategorize et (UYAP ağacındaki alt klasörler)', UI.useCategorize,
          el('div', { class: 'uyap-bulk-hint' },
            'Açıksa indirme yolu UYAP\'taki klasör yapısını taklit eder (örn. Tebligatlar / Genel Müzekkere). ',
            'Ağaçtan okunamazsa eski tür-tablosu (01_Durusma_Zaptları vb.) kullanılır. «Otomatik alt klasör» ile birlikte önce dosya klasörü, sonra bu alt yol oluşur.')),
        makeOpt('Tek ZIP arşivi olarak indir', UI.useZip,
          el('div', { class: 'uyap-bulk-hint' }, 'Tüm evraklar tek bir .zip dosyasında paketlenir. Büyük arşivler için RAM kullanımı artar.')),
        makeOpt('Tek birleşik PDF olarak indir', UI.useMergePdf,
          el('div', { class: 'uyap-bulk-hint' },
            '🛈 Sadece <b>PDF modu</b>nda çalışır. ',
            'Seçili/filtrelenmiş tüm evraklar tek bir PDF dosyasında birleştirilir, sayfaları orijinal sırasıyla eklenir. ',
            'ZIP modu da açıksa hem ZIP hem birleşik PDF üretilir.')),
        makeOpt('Özel dosya adı şablonu kullan', UI.useTemplate,
          el('div', { class: 'uyap-bulk-hint' },
            'Placeholderlar: ',
            el('code', {}, '{tarih}'), ' ', el('code', {}, '{tur}'), ' ',
            el('code', {}, '{aciklama}'), ' ', el('code', {}, '{birim}'), ' ',
            el('code', {}, '{sira}'), ' ', el('code', {}, '{gonderen}'), ' ',
            el('code', {}, '{tip}')),
          UI.templateInput),
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
      makeSection('gelismis', 'Gelişmiş', '⚡',
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
      makeSection('onizleme', 'Önizleme — Evrak Listesi', '📑',
        el('div', { class: 'uyap-bulk-hint' }, 'Tarama sonrası tüm evraklar burada listelenir. Üzerine tıklayarak UYAP\'ta önizleyebilirsin. Filtreler uygulandığında sönükleştirilir.'),
        UI.previewToolbar,
        UI.previewList,
      )
    );

    /* --- Progress + Log --- */
    UI.progressBar = el('div');
    UI.progressLabel = el('div', { class: 'uyap-bulk-progress-label' }, '');
    UI.logBox = el('div', { class: 'uyap-bulk-log' });

    body.appendChild(el('div', { class: 'uyap-bulk-monitor' },
      el('div', { class: 'uyap-bulk-progress' }, UI.progressBar),
      UI.progressLabel,
      UI.logBox,
    ));

    /* --- Footer buttons --- */
    UI.scanBtn = el('button', { class: 'uyap-bulk-btn ghost flex', onclick: onScan }, 'Tara');
    UI.saveLogBtn = el('button', { class: 'uyap-bulk-btn ghost small', onclick: saveLog }, 'Log Kaydet');
    UI.startBtn = el('button', { class: 'uyap-bulk-btn primary flex', disabled: true, onclick: onStart }, 'İndirmeyi Başlat');

    /* ---- Status bar ---- */
    UI.statusBar = el('div', { class: 'uyap-bulk-statusbar' });

    UI.paletteBtn = el('button', { class: 'uyap-bulk-btn ghost small', onclick: openPalette,
      title: 'Komut paleti (Ctrl+K)' }, 'Komutlar');
    const footer = el('div', { class: 'uyap-bulk-footer' },
      UI.paletteBtn,
      el('div', { class: 'uyap-bulk-footer-trailing' },
        UI.scanBtn, UI.saveLogBtn, UI.startBtn));

    panel.appendChild(header);
    panel.appendChild(UI.statusBar);
    panel.appendChild(body);
    panel.appendChild(footer);

    const root = el('div', { id: 'uyap-bulk-root' }, fab, panel);
    document.body.appendChild(root);

    UI.panel = panel; UI.fab = fab;

    // Sürükle-bırak FAB konumu
    setupDraggableFab(fab);
    applyFabPos();

    // Pin aktifse panel açık başlasın
    if (state.pinned) {
      panel.hidden = false;
      fab.classList.add('open');
    }

    refreshStatusBar();

    const syncFabState = () => {
      fab.classList.toggle('open', !panel.hidden);
    };
    fab.addEventListener('click', (e) => {
      if (fab._uyapWasDragging) { fab._uyapWasDragging = false; return; }
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

  function makeSection(id, title, icon, ...children) {
    const titleRow = el('div', { class: 'uyap-bulk-block-title' },
      el('span', { class: 'head-left' },
        el('span', { class: 'head-icon' }, icon || '•'),
        el('span', { class: 'head-title' }, title)
      )
    );
    const blockBody = el('div', { class: 'uyap-bulk-block-body' }, ...children);
    const section = el('div', { class: 'uyap-bulk-block' }, titleRow, blockBody);
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
      const sec = el('div', { class: 'uyap-bulk-opt-sub' }, ...sub);
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
      document.title = `[${Math.round(p)}%] ${label} — Uyap Flow`;
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

    const seenKeys = new Set();
    let skippedDup = 0;
    state.scanned = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const treeNode = row.closest('li.dx-treeview-node');
      const treeItem = treeNode?.querySelector('.dx-item.dx-treeview-item');
      const tdiv = row.querySelector('div[title]');
      const meta = parseTitleAttr(tdiv?.getAttribute('title'));
      const dedupKey = getEvrakScanDedupKey(meta);
      if (seenKeys.has(dedupKey)) {
        skippedDup++;
        continue;
      }
      seenKeys.add(dedupKey);
      const aria = treeNode?.getAttribute('aria-label') || `#${state.scanned.length + 1}`;
      const dateStr = meta['Onaylandığı Tarih'] || meta['Sisteme Gönderildiği Tarih'];
      const date = parseDateDDMMYYYY(dateStr);
      const type = (meta['Tür'] || '').trim();
      const folderSegments = getEvrakTreeFolderSegments(treeNode);
      state.scanned.push({
        row, treeNode, treeItem, meta, aria, date, type, folderSegments,
        index: state.scanned.length,
      });
    }

    if (skippedDup > 0) {
      log(`${skippedDup} tekrarlayan satır yok sayıldı (aynı evrak ağaçta birden fazla yerde listelenmiş).`, 'info');
    }
    log(
      `Toplam ${state.scanned.length} evrak${skippedDup ? ` (${rows.length} satırdan)` : ''}.`,
      state.scanned.length ? 'ok' : 'warn',
    );

    refreshTypeChips();
    refreshOnlyNewInfo();
    applyFiltersAndRefresh();
    refreshStatusBar();

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
        cb = el('input', { type: 'checkbox', style: 'transform: scale(1); appearance: auto; width: auto; height: auto; background: none; border-radius: 3px;' });
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
      const note = getNote(meta);

      const tagBox = el('span');
      if (note?.tags?.length) {
        note.tags.slice(0, 3).forEach((t) => tagBox.appendChild(el('span', { class: 'tag-mini' }, '# ' + t)));
      }

      const metaEl = el('div', { class: 'meta' },
        el('div', { class: 'title' }, `${turStr}${aciklamaStr ? ' — ' + aciklamaStr : ''}`),
        el('div', { class: 'sub' },
          el('span', {}, tarihStr),
          birim ? el('span', {}, '№ ' + birim) : null,
          meta['Gönderen Yer Kişi'] ? el('span', { title: 'Gönderen' }, '↳ ' + meta['Gönderen Yer Kişi'].slice(0, 40)) : null,
          tagBox,
        )
      );

      let hoverTimer = null;
      const triggerTooltip = () => {
        hoverTimer = setTimeout(() => showTooltip(metaEl, meta), 350);
      };
      const cancelTooltip = () => {
        if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
        hideTooltip();
      };
      metaEl.addEventListener('mouseenter', triggerTooltip);
      metaEl.addEventListener('mouseleave', cancelTooltip);
      metaEl.addEventListener('click', cancelTooltip);

      item.appendChild(metaEl);

      const noteBtn = el('button', {
        class: 'note-mark' + (note ? ' has-note' : ''),
        title: note ? 'Not / etiket düzenle' : 'Not / etiket ekle'
      }, '✎');
      noteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hideTooltip();
        openNotePopup(noteBtn, meta, () => refreshPreview());
      });
      item.appendChild(noteBtn);

      const peekBtn = el('button', { class: 'peek', title: 'UYAP önizleyicide aç' }, '👁');
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

    const headers = ['Sıra', 'Tarih', 'Tür', 'Açıklama', 'Birim Evrak No', 'Gönderen', 'Gönderen Dosya No', 'Tip', 'Sisteme Gönderildiği', 'Etiketler', 'Not'];
    const csvRows = [headers.join(';')];

    rows.forEach((s, i) => {
      const m = s.meta;
      const note = getNote(m);
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
        note?.tags?.join(', ') || '',
        note?.text || '',
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
    refreshStatusBar();
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

    if (UI.useMergePdf.checked && format !== 'pdf') {
      log('UYARI: "Tek birleşik PDF" sadece PDF modunda çalışır. Yok sayılıyor.', 'warn');
    }

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
      console.error('[Uyap Flow]', e);
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

  function getFilenameWithFolder(meta, index, ext, folderSegments) {
    const useTmpl = UI.useTemplate?.checked && (UI.templateInput?.value || '').trim();
    const base = useTmpl
      ? sanitize(renderTemplate(UI.templateInput.value.trim(), meta, index, ext))
      : makeFilename(meta, index, ext);

    const parts = [];
    if (UI.useAutoFolder?.checked) parts.push(getOpenDosyaFolderName());
    if (UI.useCategorize?.checked) {
      const treeParts = Array.isArray(folderSegments) ? folderSegments.filter(Boolean) : [];
      if (treeParts.length) parts.push(...treeParts);
      else parts.push(getCategoryFolder(meta));
    }
    parts.push(base);
    return parts.join('/');
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

  async function mergePdfs(items, mergedName) {
    if (typeof PDFLib === 'undefined' || !PDFLib.PDFDocument) {
      log('pdf-lib kütüphanesi yüklenemedi.', 'err');
      return false;
    }
    const { PDFDocument } = PDFLib;
    log(`Tek PDF\'de birleştiriliyor: ${items.length} evrak…`, 'info');

    const mergedPdf = await PDFDocument.create();
    let okCount = 0, failCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const bytes = await item.blob.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true, throwOnInvalidObject: false });
        const pageIndices = src.getPageIndices();
        const copied = await mergedPdf.copyPages(src, pageIndices);
        copied.forEach((p) => mergedPdf.addPage(p));
        okCount++;
      } catch (e) {
        failCount++;
        log(`Birleştirme atlandı (${item.filename}): ${e?.message || e}`, 'warn');
      }
      setProgress(90 + (i + 1) / items.length * 9,
        `PDF birleştiriliyor [${i + 1}/${items.length}]`);
    }

    if (okCount === 0) {
      log('Hiçbir PDF birleştirilemedi.', 'err');
      return false;
    }

    setProgress(99, 'PDF yazılıyor…');
    try {
      mergedPdf.setTitle('Uyap Flow — Birleşik PDF — ' + getOpenDosyaInfo().raw);
      mergedPdf.setCreator('Uyap Flow — Toplu Evrak İndirici');
      mergedPdf.setProducer('pdf-lib + Uyap Flow');
      mergedPdf.setCreationDate(new Date());
    } catch {}

    const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    saveBlobAs(blob, mergedName);
    log(`Birleşik PDF oluşturuldu: ${okCount} evrak, ${failCount} atlandı, ${(blob.size / 1024 / 1024).toFixed(2)} MB.`, 'ok');
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
        return Promise.reject(new DOMException('Uyap Flow tarafından yakalandı', 'AbortError'));
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
        tasks.push({ url: captured[captured.length - 1], meta: s.meta, index: i + 1, folderSegments: s.folderSegments });
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
        const filename = getFilenameWithFolder(t.meta, t.index, ext, t.folderSegments);
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
    const mergeMode = UI.useMergePdf.checked;
    const batchMode = zipMode || mergeMode; // diskle yazma yerine batch'e topla
    const collected = []; // birleştirme/zip için: { filename, blob, meta, index }
    let ok = 0, bad = 0;

    if (mergeMode && typeof PDFLib === 'undefined') {
      log('pdf-lib yüklenmemiş — birleştirme atlanacak. Eklentiyi yeniden yükle.', 'warn');
    }

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
        const filename = getFilenameWithFolder(s.meta, i + 1, '.pdf', s.folderSegments);
        try {
          if (batchMode) {
            collected.push({ filename, blob: pdf.blob, meta: s.meta, index: i + 1 });
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

      setProgress(((i + 1) / rows.length) * (batchMode ? 88 : 100),
        `PDF yakalanıyor [${i + 1}/${rows.length}]`);
      await sleep(delay);
    }

    captureMode = false;

    if (mergeMode && collected.length > 0 && typeof PDFLib !== 'undefined') {
      const dateTag = new Date().toISOString().slice(0, 10);
      const mergedName = `${getOpenDosyaFolderName()}_Birlesik_${dateTag}.pdf`;
      await mergePdfs(collected, mergedName);
    }

    if (zipMode && collected.length > 0) {
      const zipName = `${getOpenDosyaFolderName()}_PDF_Arsivi.zip`;
      await packageAsZip(collected, zipName);
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
      const dosya = getOpenDosyaInfo().raw || 'Dava dosyası';
      new Notification('Uyap Flow', {
        body: `${dosya}\nBaşarılı: ${ok}, Hatalı: ${bad}`,
        icon: 'https://avukat.uyap.gov.tr/favicon.ico',
        tag: 'uyap-bulk-done',
      });
    } catch (_) {}
  }

  /* ============================== DRAG FAB ============================== */
  function syncFabDockClass() {
    if (!UI.fab) return;
    if (state.fabPos) UI.fab.classList.remove('uyap-bulk-fab--dock');
    else UI.fab.classList.add('uyap-bulk-fab--dock');
  }

  function applyPanelPlacement() {
    if (!UI.panel || UI.panel.hidden) return;
    if (state.fabPos) {
      UI.panel.classList.remove('uyap-bulk-panel--dock');
      requestAnimationFrame(() => {
        repositionPanelNearFab();
        requestAnimationFrame(repositionPanelNearFab);
      });
    } else {
      UI.panel.classList.add('uyap-bulk-panel--dock');
      UI.panel.style.removeProperty('left');
      UI.panel.style.removeProperty('top');
      UI.panel.style.removeProperty('bottom');
      UI.panel.style.removeProperty('right');
    }
  }

  function applyFabPos() {
    if (!UI.fab) return;
    if (state.fabPos && state.fabPos.left != null && state.fabPos.top != null) {
      UI.fab.style.left = state.fabPos.left + 'px';
      UI.fab.style.top  = state.fabPos.top + 'px';
      UI.fab.style.bottom = 'auto';
      UI.fab.style.right  = 'auto';
    } else {
      UI.fab.style.removeProperty('left');
      UI.fab.style.removeProperty('top');
      UI.fab.style.removeProperty('bottom');
      UI.fab.style.removeProperty('right');
    }
    syncFabDockClass();
    applyPanelPlacement();
  }

  function repositionPanelNearFab() {
    if (!UI.fab || !UI.panel || UI.panel.hidden) return;
    if (UI.panel.classList.contains('uyap-bulk-panel--dock')) return;
    const fabRect = UI.fab.getBoundingClientRect();
    const gap = 14;
    const w = UI.panel.offsetWidth || 440;
    const h = Math.min(UI.panel.offsetHeight || 380, window.innerHeight - 24);
    let top = fabRect.top - h - gap;
    let left = fabRect.left;
    if (top < 12) top = fabRect.bottom + gap;
    const maxTop = window.innerHeight - h - 12;
    if (top > maxTop) top = Math.max(12, maxTop);
    if (left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
    if (left < 12) left = 12;
    UI.panel.style.left = left + 'px';
    UI.panel.style.top = top + 'px';
    UI.panel.style.bottom = 'auto';
    UI.panel.style.right = 'auto';
  }

  function setupDraggableFab(fab) {
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    let didDrag = false;
    fab.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      dragging = true; didDrag = false;
      const rect = fab.getBoundingClientRect();
      startX = e.clientX; startY = e.clientY;
      startLeft = rect.left; startTop = rect.top;
      fab.style.transition = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!didDrag && Math.hypot(dx, dy) > 4) didDrag = true;
      if (!didDrag) return;
      fab.classList.remove('uyap-bulk-fab--dock');
      UI.panel?.classList.remove('uyap-bulk-panel--dock');
      const newLeft = Math.max(8, Math.min(window.innerWidth - fab.offsetWidth - 8, startLeft + dx));
      const newTop  = Math.max(8, Math.min(window.innerHeight - fab.offsetHeight - 8, startTop + dy));
      fab.style.left = newLeft + 'px';
      fab.style.top  = newTop + 'px';
      fab.style.bottom = 'auto';
      fab.style.right  = 'auto';
      if (UI.panel && !UI.panel.hidden) repositionPanelNearFab();
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      fab.style.transition = '';
      if (didDrag) {
        const rect = fab.getBoundingClientRect();
        state.fabPos = { left: rect.left, top: rect.top };
        savePersistedFabPos();
        fab._uyapWasDragging = true;
        syncFabDockClass();
        applyPanelPlacement();
      }
    });
    window.addEventListener('resize', () => {
      if (UI.panel && !UI.panel.hidden) applyPanelPlacement();
    });
  }

  /* ============================== STATUS BAR ============================== */
  function refreshStatusBar() {
    if (!UI.statusBar) return;
    UI.statusBar.innerHTML = '';

    const dosya = getOpenDosyaInfo();
    const dosyaText = dosya.esas && dosya.esas !== 'Dosya'
      ? `📁 ${dosya.esas}${dosya.mahkeme ? ' — ' + dosya.mahkeme.slice(0, 28) : ''}`
      : '📁 Dosya açık değil';

    const mainRow = el('div', { class: 'uyap-bulk-statusbar-main' });
    mainRow.appendChild(el('span', { class: 'pill', title: dosya.raw || '' }, dosyaText));

    if (state.scanned.length) {
      mainRow.appendChild(el('span', { class: 'pill active' },
        el('span', { class: 'dot' }), `${state.filtered.length} / ${state.scanned.length} evrak`));
    }

    if (state.queue.length) {
      mainRow.appendChild(el('span', { class: 'pill warn' }, `🗂 Kuyrukta ${state.queue.length} dosya`));
    }

    UI.statusBar.appendChild(mainRow);
  }

  /* ============================== COMMAND PALETTE ============================== */
  function getCommands() {
    const cmds = [
      { id: 'scan', icon: '🔍', title: 'Evrakları Tara', sub: 'Açık dosyadaki tüm evrakları listeden geçir', action: onScan, kbd: 'Ctrl+Shift+S' },
      { id: 'start', icon: '⬇', title: 'İndirmeyi Başlat', sub: 'Filtrelenmiş evrakları indir', action: onStart, kbd: 'Ctrl+Shift+D' },
      { id: 'csv', icon: '📊', title: 'CSV / Excel Listesi İndir', sub: 'Evrak metadata\'sını CSV olarak çıkar', action: exportCSV },
      { id: 'savelog', icon: '📝', title: 'Log Kaydet', sub: 'Mevcut log\'u .txt olarak indir', action: saveLog },
      { id: 'toggle-zip', icon: '📦', title: (UI.useZip?.checked ? '☑ ' : '☐ ') + 'ZIP Modu', sub: 'Tüm evrakları tek arşivde topla', action: () => { UI.useZip.checked = !UI.useZip.checked; } },
      { id: 'toggle-merge', icon: '📑', title: (UI.useMergePdf?.checked ? '☑ ' : '☐ ') + 'Birleşik PDF', sub: 'Tüm PDF\'leri tek dosyada birleştir (PDF modu gerekir)', action: () => { UI.useMergePdf.checked = !UI.useMergePdf.checked; } },
      { id: 'toggle-pdf', icon: '📄', title: (UI.formatSelect?.value === 'pdf' ? '☑ ' : '☐ ') + 'PDF Modu', sub: 'UDF yerine PDF formatında indir', action: () => { UI.formatSelect.value = UI.formatSelect.value === 'pdf' ? 'udf' : 'pdf'; UI.formatSelect.dispatchEvent(new Event('change')); } },
      { id: 'toggle-cat', icon: '🗂', title: (UI.useCategorize?.checked ? '☑ ' : '☐ ') + 'Türe Göre Kategorize', sub: 'Otomatik alt klasörlere ayır', action: () => { UI.useCategorize.checked = !UI.useCategorize.checked; } },
      { id: 'toggle-select', icon: '☑', title: (UI.useSelection?.checked ? '☑ ' : '☐ ') + 'Seçim Modu', sub: 'Tek tek seçerek indir', action: () => { UI.useSelection.checked = !UI.useSelection.checked; UI.useSelection.dispatchEvent(new Event('change')); } },
      { id: 'pin', icon: '📌', title: (state.pinned ? '☑ ' : '☐ ') + 'Paneli Sabitle', sub: 'Sayfa yenilense de açık kalsın', action: () => UI.pinBtn.click() },
      { id: 'reset-filters', icon: '↻', title: 'Filtreleri Sıfırla', sub: 'Tüm aktif filtreleri kapat', action: resetFilters },
      { id: 'reset-fab', icon: '⟲', title: 'Butonu varsayılan konuma al', sub: 'Sol alt köşeye geri taşı', action: () => {
        state.fabPos = null;
        try { localStorage.removeItem(STORAGE_FAB_POS); } catch {}
        applyFabPos();
      } },
      { id: 'ptt-query', icon: '📮', title: 'PTT\'de Tebligat Sorgula', sub: 'Barkod girip yeni sekmede sorgu başlatır', action: () => {
        const barcode = prompt('Tebligat barkod numarasını gir:');
        if (barcode && barcode.trim()) openPttQuery(barcode.trim());
      } },
    ];

    state.scanned.forEach((s, i) => {
      const m = s.meta;
      cmds.push({
        id: 'evrak-' + i,
        icon: '📄',
        title: (m['Tür'] || 'Evrak') + (m['Açıklama'] ? ' — ' + m['Açıklama'] : ''),
        sub: `${m['Onaylandığı Tarih'] || '—'}  •  ${m['Birim Evrak No'] || ''}`.trim(),
        action: () => { try { s.treeItem?.click(); } catch {} },
        searchData: [s.aria, m['Tür'], m['Açıklama'], m['Gönderen Yer Kişi'], m['Birim Evrak No']].join(' ').toLowerCase(),
      });
    });

    return cmds;
  }

  function openPalette() {
    if (paletteEl) return;
    if (UI.panel && UI.panel.hidden) {
      UI.panel.hidden = false;
      UI.fab?.classList.add('open');
    }

    const cmds = getCommands();
    let filtered = cmds.slice();
    let active = 0;

    const input = el('input', { class: 'uyap-bulk-palette-input', placeholder: '🔍  Komut veya evrak ara…', autocomplete: 'off' });
    const list = el('div', { class: 'uyap-bulk-palette-list' });
    const footer = el('div', { class: 'uyap-bulk-palette-footer' },
      el('span', {}, el('kbd', {}, '↑'), el('kbd', {}, '↓'), ' gez  ',
        el('kbd', {}, '↵'), ' seç  ',
        el('kbd', {}, 'Esc'), ' kapat'),
      el('span', {}, `${cmds.length} komut`));

    const palette = el('div', { class: 'uyap-bulk-palette' }, input, list, footer);
    const backdrop = el('div', { class: 'uyap-bulk-palette-backdrop' }, palette);
    document.body.appendChild(backdrop);
    paletteEl = backdrop;

    const render = () => {
      list.innerHTML = '';
      if (!filtered.length) {
        list.appendChild(el('div', { class: 'uyap-bulk-palette-empty' }, 'Eşleşen komut yok.'));
        return;
      }
      filtered.slice(0, 80).forEach((c, i) => {
        const item = el('div', { class: 'uyap-bulk-palette-item' + (i === active ? ' active' : '') },
          el('div', { class: 'pal-icon' }, c.icon),
          el('div', { class: 'pal-content' },
            el('div', { class: 'pal-title' }, c.title),
            c.sub ? el('div', { class: 'pal-sub' }, c.sub) : null),
          c.kbd ? el('div', { class: 'pal-kbd' }, c.kbd) : null);
        item.addEventListener('click', () => execute(i));
        item.addEventListener('mouseenter', () => { active = i; updateActive(); });
        list.appendChild(item);
      });
    };

    const updateActive = () => {
      list.querySelectorAll('.uyap-bulk-palette-item').forEach((n, i) => {
        n.classList.toggle('active', i === active);
      });
      const activeNode = list.querySelector('.uyap-bulk-palette-item.active');
      if (activeNode) activeNode.scrollIntoView({ block: 'nearest' });
    };

    const execute = (i) => {
      const cmd = filtered[i];
      if (!cmd) return;
      closePalette();
      setTimeout(() => { try { cmd.action(); refreshStatusBar(); updateActionButtonCount(); } catch (e) { console.error(e); } }, 50);
    };

    const onInput = () => {
      const q = input.value.trim().toLocaleLowerCase('tr');
      filtered = !q ? cmds.slice() : cmds.filter((c) => {
        const hay = ((c.title + ' ' + (c.sub || '') + ' ' + (c.searchData || ''))).toLocaleLowerCase('tr');
        return hay.includes(q);
      });
      active = 0;
      render();
    };

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(filtered.length - 1, active + 1); updateActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); updateActive(); }
      else if (e.key === 'Enter') { e.preventDefault(); execute(active); }
    };

    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closePalette(); });

    setTimeout(() => input.focus(), 30);
    render();
  }

  function closePalette() {
    if (paletteEl) { paletteEl.remove(); paletteEl = null; }
  }

  /* ============================== TOOLTIP ============================== */
  function showTooltip(target, meta) {
    hideTooltip();
    const note = getNote(meta);
    const rows = [];
    if (meta['Tür']) rows.push({ l: 'Tür', v: meta['Tür'] });
    if (meta['Açıklama']) rows.push({ l: 'Açıklama', v: meta['Açıklama'] });
    if (meta['Onaylandığı Tarih']) rows.push({ l: 'Tarih', v: meta['Onaylandığı Tarih'] });
    if (meta['Birim Evrak No']) rows.push({ l: 'Birim No', v: meta['Birim Evrak No'] });
    if (meta['Gönderen Yer Kişi']) rows.push({ l: 'Gönderen', v: meta['Gönderen Yer Kişi'] });
    if (meta['Tip']) rows.push({ l: 'Tip', v: meta['Tip'] });

    tooltipEl = el('div', { class: 'uyap-bulk-tooltip' });
    rows.forEach((r) => {
      tooltipEl.appendChild(el('div', { class: 'tt-row' },
        el('span', { class: 'tt-label' }, r.l + ':'),
        el('span', { class: 'tt-val' }, r.v)));
    });
    if (note?.tags?.length) {
      const tags = el('div', { class: 'tt-tags' });
      note.tags.forEach((t) => tags.appendChild(el('span', { class: 'tt-tag' }, '# ' + t)));
      tooltipEl.appendChild(tags);
    }
    if (note?.text) {
      tooltipEl.appendChild(el('div', { class: 'tt-note' }, '✎ ' + note.text));
    }

    document.body.appendChild(tooltipEl);
    const r = target.getBoundingClientRect();
    const ttRect = tooltipEl.getBoundingClientRect();
    let left = r.right + 8;
    let top = r.top;
    if (left + ttRect.width > window.innerWidth - 8) left = r.left - ttRect.width - 8;
    if (top + ttRect.height > window.innerHeight - 8) top = window.innerHeight - ttRect.height - 8;
    tooltipEl.style.left = Math.max(8, left) + 'px';
    tooltipEl.style.top = Math.max(8, top) + 'px';
    requestAnimationFrame(() => tooltipEl?.classList.add('show'));
  }
  function hideTooltip() {
    if (tooltipEl) { tooltipEl.remove(); tooltipEl = null; }
  }

  /* ============================== NOTES POPUP ============================== */
  function openNotePopup(anchor, meta, onSaved) {
    closeNotePopup();
    const existing = getNote(meta) || { text: '', tags: [] };
    const tags = Array.isArray(existing.tags) ? existing.tags.slice() : [];

    const textarea = el('textarea', { placeholder: 'Bu evrakla ilgili not yaz...' });
    textarea.value = existing.text || '';

    const tagInput = el('input', { type: 'text', class: 'tag-input', placeholder: 'Etiket ekle ve Enter\'a bas (örn: önemli)' });

    const tagRow = el('div', { class: 'tag-row' });
    const renderTags = () => {
      tagRow.innerHTML = '';
      tags.forEach((t, i) => {
        const x = el('button', { title: 'Kaldır' }, '×');
        x.addEventListener('click', () => { tags.splice(i, 1); renderTags(); });
        tagRow.appendChild(el('span', { class: 'tag-pill' }, '# ' + t, x));
      });
    };
    renderTags();

    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const v = tagInput.value.trim();
        if (v && !tags.includes(v)) { tags.push(v); tagInput.value = ''; renderTags(); }
      }
    });

    const closeBtn = el('button', { class: 'uyap-bulk-close', style: 'background: #f1f3f4; color: ' + C.text + ';' }, '×');
    closeBtn.addEventListener('click', closeNotePopup);

    const cancelBtn = el('button', { class: 'uyap-bulk-btn ghost small', onclick: closeNotePopup }, 'İptal');
    const saveBtn = el('button', { class: 'uyap-bulk-btn small', onclick: () => {
      const note = { text: textarea.value.trim(), tags };
      setNote(meta, note);
      closeNotePopup();
      if (typeof onSaved === 'function') onSaved();
    } }, 'Kaydet');

    notePopEl = el('div', { class: 'uyap-bulk-note-pop' },
      el('h4', {}, 'Not & Etiketler', closeBtn),
      textarea, tagInput, tagRow,
      el('div', { class: 'note-actions' }, cancelBtn, saveBtn));

    document.body.appendChild(notePopEl);
    const r = anchor.getBoundingClientRect();
    let top = r.bottom + 6, left = r.left - 280;
    const popRect = notePopEl.getBoundingClientRect();
    if (left < 8) left = 8;
    if (left + popRect.width > window.innerWidth - 8) left = window.innerWidth - popRect.width - 8;
    if (top + popRect.height > window.innerHeight - 8) top = r.top - popRect.height - 6;
    notePopEl.style.left = left + 'px';
    notePopEl.style.top  = Math.max(8, top) + 'px';

    setTimeout(() => textarea.focus(), 30);

    const outClickHandler = (e) => {
      if (notePopEl && !notePopEl.contains(e.target) && e.target !== anchor) {
        closeNotePopup();
        document.removeEventListener('mousedown', outClickHandler, true);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', outClickHandler, true), 50);
  }
  function closeNotePopup() {
    if (notePopEl) { notePopEl.remove(); notePopEl = null; }
  }

  /* ============================== SELECTION TOOLBAR / PTT ============================== */
  /**
   * Bir metnin barkod olma ihtimalini kontrol eder.
   * PTT barkodu çoğunlukla 13 haneli (eski "AA000000000TR" formatı veya 13 numerik)
   * UYAP elektronik tebligat: alfanumerik 10-25 karakter, baş harf çoğunlukla harf.
   */
  function looksLikeBarcode(text) {
    if (!text) return false;
    const t = text.trim();
    if (t.length < 8 || t.length > 30) return false;
    if (/\s/.test(t)) return false; // boşluk içermemeli
    // Sadece alfanumerik ve - karakterleri
    if (!/^[A-Z0-9\-]+$/i.test(t)) return false;
    // En az bir rakam içermeli
    if (!/\d/.test(t)) return false;
    return true;
  }

  function detectBarcode(text) {
    if (!text) return null;
    // Önce tüm metin tek barkod gibi mi
    const stripped = text.trim();
    if (looksLikeBarcode(stripped)) return stripped;
    // Kelimelere ayır, en uzun barkod-benzeri kelimeyi al
    const tokens = stripped.split(/[\s,;:|/]+/).filter(Boolean);
    const candidates = tokens.filter(looksLikeBarcode).sort((a, b) => b.length - a.length);
    return candidates[0] || null;
  }

  function openPttQuery(barcode) {
    if (!barcode) return;
    try { sessionStorage.setItem('uyap-bulk-barcode', barcode); } catch {}
    const url = 'https://gonderitakip.ptt.gov.tr/#uyap-bulk-barcode=' + encodeURIComponent(barcode);
    window.open(url, '_blank', 'noopener');
  }

  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = el('textarea', { style: 'position:fixed; left:-9999px;' });
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        return true;
      } catch { return false; }
    }
  }

  function searchInUyapKararArama(text) {
    const q = encodeURIComponent(text);
    window.open('https://karararama.uyap.gov.tr/Arama.aspx?q=' + q, '_blank', 'noopener');
  }

  function hideSelectionToolbar() {
    if (selToolEl) { selToolEl.classList.remove('show'); }
    if (selToolTimer) { clearTimeout(selToolTimer); selToolTimer = null; }
  }

  function showSelectionToolbar() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) { hideSelectionToolbar(); return; }
    const text = (sel.toString() || '').trim();
    if (!text || text.length < 3) { hideSelectionToolbar(); return; }

    // Bizim UI'mızdaysa seçim → toolbar gösterme
    let node = sel.anchorNode;
    while (node && node.nodeType !== 1) node = node.parentNode;
    if (node?.closest?.('#uyap-bulk-root, .uyap-bulk-palette-backdrop, .uyap-bulk-note-pop, .uyap-bulk-tooltip')) {
      hideSelectionToolbar(); return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) { hideSelectionToolbar(); return; }

    const barcode = detectBarcode(text);

    // Toolbar oluştur (yoksa)
    if (!selToolEl) {
      selToolEl = el('div', { class: 'uyap-bulk-seltool' });
      document.body.appendChild(selToolEl);
    }
    selToolEl.innerHTML = '';

    if (barcode) {
      const pttBtn = el('button', { class: 'primary', title: 'PTT\'de tebligat sorgula' },
        '🔎 PTT\'de Sorgula');
      pttBtn.addEventListener('mousedown', (e) => e.preventDefault());
      pttBtn.addEventListener('click', () => { openPttQuery(barcode); hideSelectionToolbar(); });
      selToolEl.appendChild(pttBtn);

      selToolEl.appendChild(el('span', { class: 'barcode', title: barcode }, barcode));
      selToolEl.appendChild(el('span', { class: 'sep' }));
    }

    const copyBtn = el('button', { title: 'Panoya kopyala' }, '📋 Kopyala');
    copyBtn.addEventListener('mousedown', (e) => e.preventDefault());
    copyBtn.addEventListener('click', () => {
      copyToClipboard(text);
      copyBtn.innerHTML = '✓ Kopyalandı';
      setTimeout(hideSelectionToolbar, 800);
    });
    selToolEl.appendChild(copyBtn);

    if (text.length >= 3 && text.length <= 80 && !barcode) {
      const kararBtn = el('button', { title: 'UYAP Karar Arama' }, '⚖ Karar Ara');
      kararBtn.addEventListener('mousedown', (e) => e.preventDefault());
      kararBtn.addEventListener('click', () => {
        searchInUyapKararArama(text);
        hideSelectionToolbar();
      });
      selToolEl.appendChild(kararBtn);
    }

    // Konumlandır: seçimin üst-orta noktası
    document.body.appendChild(selToolEl);
    requestAnimationFrame(() => {
      const tw = selToolEl.offsetWidth, th = selToolEl.offsetHeight;
      let left = rect.left + rect.width / 2 - tw / 2;
      let top  = rect.top - th - 8;
      if (top < 8) top = rect.bottom + 8;
      if (left < 8) left = 8;
      if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
      selToolEl.style.left = left + 'px';
      selToolEl.style.top  = top + 'px';
      selToolEl.classList.add('show');
    });
  }

  function setupSelectionToolbar() {
    document.addEventListener('mouseup', (e) => {
      // Eklentinin kendi UI'sındaysa atla
      if (e.target?.closest?.('#uyap-bulk-root, .uyap-bulk-palette-backdrop, .uyap-bulk-note-pop, .uyap-bulk-tooltip, .uyap-bulk-seltool')) return;
      if (selToolTimer) clearTimeout(selToolTimer);
      selToolTimer = setTimeout(showSelectionToolbar, 200);
    });
    document.addEventListener('mousedown', (e) => {
      if (selToolEl && !selToolEl.contains(e.target)) hideSelectionToolbar();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && selToolEl?.classList.contains('show')) hideSelectionToolbar();
    });
    document.addEventListener('selectionchange', () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) hideSelectionToolbar();
    });
    window.addEventListener('scroll', hideSelectionToolbar, true);
  }

  /* ============================== KEYBOARD SHORTCUTS ============================== */
  function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const tag = (e.target?.tagName || '').toLowerCase();
      const inEditable = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      const inOurInput = e.target?.closest?.('#uyap-bulk-root, .uyap-bulk-palette-backdrop, .uyap-bulk-note-pop');

      if (ctrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (paletteEl) closePalette();
        else openPalette();
        return;
      }

      if (e.key === 'Escape') {
        if (paletteEl) { closePalette(); return; }
        if (notePopEl) { closeNotePopup(); return; }
        if (UI.panel && !UI.panel.hidden && !state.pinned) {
          UI.panel.hidden = true;
          UI.fab?.classList.remove('open');
        }
        return;
      }

      if (inEditable && !inOurInput) return;

      if (ctrl && shift && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        if (UI.fab) UI.fab.click();
      } else if (ctrl && shift && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (!UI.panel.hidden) onScan();
        else { UI.fab?.click(); }
      } else if (ctrl && shift && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (!UI.panel.hidden) onStart();
      }
    }, true);
  }

  /* ============================== INIT ============================== */
  function init() {
    try {
      loadPersistedState();
      injectCSS();
      buildUI();
      setupShortcuts();
      setupSelectionToolbar();
    } catch (e) {
      console.error('[Uyap Flow] başlatma hatası:', e);
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
