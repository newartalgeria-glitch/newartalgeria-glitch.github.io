(function () {
  'use strict';

  // ---- Language toggle (Arabic default, English alternative) ----
  var KEY = 'nadir_photolab_lang';
  var lang = 'ar';
  try {
    var saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'ar') lang = saved;
    else if (document.documentElement.lang === 'en') lang = 'en';
  } catch (e) { /* storage unavailable */ }

  function apply(l) {
    lang = l;
    document.documentElement.lang = l;
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    var nodes = document.querySelectorAll('[data-lang]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].hidden = nodes[i].getAttribute('data-lang') !== l;
    }
    var titleEl = document.querySelector('title');
    var t = titleEl && titleEl.getAttribute('data-title-' + l);
    if (t) document.title = t;
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = l === 'ar' ? 'English' : 'العربية';
    try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
  }

  // ---- Email links: assembled at runtime so the address is not plain text in the HTML ----
  function wireEmails() {
    var links = document.querySelectorAll('a[data-mail-user]');
    for (var i = 0; i < links.length; i++) {
      var addr = links[i].getAttribute('data-mail-user') + '@' + links[i].getAttribute('data-mail-domain');
      links[i].href = 'mailto:' + addr;
      links[i].textContent = addr;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireEmails();
    apply(lang);
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.addEventListener('click', function () { apply(lang === 'ar' ? 'en' : 'ar'); });
  });

  // ---- AdSense (only on content pages, only when a publisher ID is set) ----
  if (window.ADSENSE_CLIENT) {
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
      encodeURIComponent(window.ADSENSE_CLIENT);
    document.head.appendChild(s);
  }
})();
