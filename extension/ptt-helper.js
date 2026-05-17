/* ============================================================================
 *  Uyap+ — PTT Helper (v2.2.0)
 *  PTT tebligat sorgulama sayfasında barkodu otomatik doldurur ve sorgular.
 *  URL hash'ten okunur:  #uyap-bulk-barcode=<BARKOD>
 * ============================================================================ */

(function () {
  'use strict';

  if (window.__uyapPttHelperLoaded) return;
  window.__uyapPttHelperLoaded = true;

  const LOG = (m, ...rest) => console.log('%c[Uyap+ PTT]%c ' + m,
    'background:#0b3d91;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600',
    'color:#0b3d91;font-weight:500', ...rest);

  function getBarcodeFromUrl() {
    // Hash veya search'te ara
    const sources = [location.hash || '', location.search || ''];
    for (const src of sources) {
      const m = src.match(/uyap-bulk-barcode=([^&]+)/);
      if (m) return decodeURIComponent(m[1]).trim();
    }
    // Eklentinin sessionStorage'a koyduğu değer (fallback)
    try {
      const v = sessionStorage.getItem('uyap-bulk-barcode');
      if (v) {
        sessionStorage.removeItem('uyap-bulk-barcode');
        return v.trim();
      }
    } catch { /* ignore */ }
    return null;
  }

  /** PTT sayfasındaki olası barkod input alanlarını dene. */
  function findBarcodeInput() {
    const candidates = [
      'input[name="barcode" i]',
      'input[name="Barcode" i]',
      'input[name="BarkodNo" i]',
      'input[id*="barcode" i]',
      'input[id*="Barkod" i]',
      'input[placeholder*="barkod" i]',
      'input[placeholder*="Barkod" i]',
      'input[placeholder*="takip" i]',
      // Tek textbox varsa
      'form input[type="text"]:not([type="hidden"])',
      'input[type="text"]:not([type="hidden"])',
    ];
    for (const sel of candidates) {
      const inputs = document.querySelectorAll(sel);
      // Görünür olanı tercih et
      for (const inp of inputs) {
        if (inp.offsetParent !== null && !inp.disabled && !inp.readOnly) return inp;
      }
    }
    return null;
  }

  function findSubmitButton(input) {
    if (input) {
      const form = input.closest('form');
      if (form) {
        const fb = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
        if (fb) return fb;
      }
    }
    const fallbacks = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button.btn-primary',
      'button.btn-success',
      // Genel: yazısında "ara" veya "sorgula" geçen butonlar
    ];
    for (const sel of fallbacks) {
      const b = document.querySelector(sel);
      if (b && b.offsetParent !== null) return b;
    }
    const allBtns = Array.from(document.querySelectorAll('button, input[type="button"]'));
    return allBtns.find((b) => {
      const t = (b.textContent || b.value || '').toLowerCase();
      return /sorgu|ara|takip|search/i.test(t) && b.offsetParent !== null;
    }) || null;
  }

  function nativeSetValue(el, value) {
    const proto = el.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function showBanner(message, kind = 'info') {
    const colors = {
      info:  { bg: '#0b3d91', fg: '#fff' },
      ok:    { bg: '#10b981', fg: '#fff' },
      warn:  { bg: '#f59e0b', fg: '#fff' },
      err:   { bg: '#ef4444', fg: '#fff' },
    };
    const c = colors[kind] || colors.info;
    let banner = document.getElementById('uyap-ptt-banner');
    if (banner) banner.remove();
    banner = document.createElement('div');
    banner.id = 'uyap-ptt-banner';
    banner.innerHTML = `
      <div style="display:inline-flex; align-items:center; gap:10px;">
        <span style="background:rgba(255,255,255,0.18); border-radius:6px; padding:3px 8px; font-weight:700; font-size:11px; letter-spacing:0.4px;">Uyap+</span>
        <span>${message}</span>
      </div>
      <button id="uyap-ptt-banner-x" style="margin-left:auto; background:rgba(255,255,255,0.18); border:0; color:#fff; cursor:pointer; width:24px; height:24px; border-radius:6px; font-size:14px;">×</button>`;
    Object.assign(banner.style, {
      position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)',
      background: c.bg, color: c.fg, padding: '10px 14px', borderRadius: '10px',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '13px', fontWeight: '600',
      boxShadow: '0 8px 24px -4px rgba(0,0,0,0.3)',
      zIndex: '2147483647', display: 'flex', alignItems: 'center', gap: '8px',
      maxWidth: '90vw',
      animation: 'uyap-ptt-slidedown .3s ease',
    });
    if (!document.getElementById('uyap-ptt-banner-style')) {
      const style = document.createElement('style');
      style.id = 'uyap-ptt-banner-style';
      style.textContent = `@keyframes uyap-ptt-slidedown { from { opacity: 0; transform: translate(-50%, -16px); } to { opacity: 1; transform: translate(-50%, 0); } }`;
      document.head.appendChild(style);
    }
    document.body.appendChild(banner);
    banner.querySelector('#uyap-ptt-banner-x').addEventListener('click', () => banner.remove());
    if (kind === 'ok') setTimeout(() => banner.remove(), 4500);
  }

  async function autoQuery(barcode, attempt = 1) {
    const input = findBarcodeInput();
    if (!input) {
      if (attempt < 16) {
        setTimeout(() => autoQuery(barcode, attempt + 1), 400);
      } else {
        showBanner(`Barkod alanı bulunamadı. Lütfen elle gir: <b>${barcode}</b>`, 'warn');
      }
      return;
    }

    nativeSetValue(input, barcode);
    input.focus();
    LOG('Barkod dolduruldu:', barcode);

    const btn = findSubmitButton(input);
    if (btn) {
      showBanner(`Barkod sorgulanıyor: <code style="background:rgba(255,255,255,0.18); padding:2px 6px; border-radius:4px;">${barcode}</code>`, 'info');
      setTimeout(() => {
        try {
          btn.click();
          LOG('Submit edildi.');
          setTimeout(() => showBanner(`Sorgu tamamlandı — sonuçlar aşağıda. (UYAP'tan gelen barkod: <b>${barcode}</b>)`, 'ok'), 1500);
        } catch (e) {
          LOG('Submit hatası:', e);
        }
      }, 350);
    } else {
      showBanner(`Barkod dolduruldu: <b>${barcode}</b>. Sorgula butonuna manuel tıkla.`, 'warn');
    }
  }

  function init() {
    const barcode = getBarcodeFromUrl();
    if (!barcode) return;

    // Hash'i temizle (kullanıcı sayfayı paylaşırsa diye)
    try {
      const cleanHash = (location.hash || '').replace(/[#&]?uyap-bulk-barcode=[^&]*/g, '');
      history.replaceState(null, '', location.pathname + location.search + cleanHash);
    } catch { /* ignore */ }

    LOG('Otomatik sorgu başlatılıyor:', barcode);
    autoQuery(barcode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
