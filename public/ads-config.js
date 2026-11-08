// Google AdSense configuration.
//
// After Google approves the site, paste your publisher ID below, e.g.
//   window.ADSENSE_CLIENT = 'ca-pub-1234567890123456';
// Leave it empty while the application is pending: no ad code is loaded
// and no cookies are set by this site.
window.ADSENSE_CLIENT = '';

// Helps AdSense verify site ownership (harmless, no ads are loaded here).
(function () {
  if (!window.ADSENSE_CLIENT) return;
  var m = document.createElement('meta');
  m.name = 'google-adsense-account';
  m.content = window.ADSENSE_CLIENT;
  document.head.appendChild(m);
})();
