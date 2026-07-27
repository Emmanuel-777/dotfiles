/* Consentimiento de cookies + Meta Pixel para LexCRM.
   El pixel NO se carga hasta que el visitante acepta (coherente con la
   política de privacidad y la Ley 21.719). La elección se recuerda. */
(function () {
  var PIXEL_ID = '434640910372433';
  var KEY = 'lex-cookies';

  function cargarPixel() {
    if (window._pixelCargado) return;
    window._pixelCargado = true;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // Helper para registrar el evento Lead (clic en "Probar gratis").
  window.lexLead = function () { if (typeof window.fbq === 'function') window.fbq('track', 'Lead'); };

  var eleccion = null;
  try { eleccion = localStorage.getItem(KEY); } catch (e) { /* sin storage */ }

  if (eleccion === 'accept') { cargarPixel(); return; }
  if (eleccion === 'reject') { return; }

  function recordar(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* noop */ } }

  function mostrarBanner() {
    var bar = document.createElement('div');
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Aviso de cookies');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:760px;margin:0 auto;background:#14254c;color:#e2e8f0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.35);padding:16px 18px;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;line-height:1.5;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;';
    bar.innerHTML =
      '<span style="flex:1;min-width:240px;">Usamos cookies propias y de Meta (Facebook/Instagram) para analizar visitas y mostrar anuncios relevantes. Puedes aceptar o rechazar. Más info en nuestra <a href="/politica-de-privacidad.html" style="color:#60a5fa;text-decoration:underline;">Política de Privacidad</a>.</span>' +
      '<span style="display:flex;gap:8px;flex-shrink:0;">' +
      '<button id="cookie-reject" style="background:transparent;color:#cbd5e1;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;">Rechazar</button>' +
      '<button id="cookie-accept" style="background:#2563eb;color:#fff;border:0;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;">Aceptar</button>' +
      '</span>';
    document.body.appendChild(bar);
    document.getElementById('cookie-accept').onclick = function () { recordar('accept'); cargarPixel(); bar.remove(); };
    document.getElementById('cookie-reject').onclick = function () { recordar('reject'); bar.remove(); };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mostrarBanner);
  } else {
    mostrarBanner();
  }
})();
