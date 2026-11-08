# Google AdSense setup / إعداد إعلانات AdSense

## بالعربية

الموقع جاهز للتقديم على AdSense. الإعلانات تظهر **في صفحات الأدلة فقط** (`public/guides/`) ولا تظهر داخل أداة التحرير.

1. قدّم طلبا على https://adsense.google.com وأدخل رابط الموقع.
2. بعد الموافقة (أو حين تطلب Google التحقق من الموقع)، افتح الملف `public/ads-config.js` وضع معرّف الناشر:

   ```js
   window.ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
   ```

3. ارفع التغيير إلى فرع `main`، وسيُنشر الموقع تلقائيا عبر GitHub Actions.
4. في لوحة AdSense فعّل **الإعلانات التلقائية (Auto ads)** للموقع.
5. فعّل رسالة الموافقة (Privacy & messaging) من لوحة AdSense لزوار أوروبا والمملكة المتحدة.
6. أنشئ ملف `public/ads.txt` بالسطر الذي تعطيه لك Google (الصيغة: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`).

ملاحظة: AdSense قد ترفض الموقع إذا كان على نطاق `github.io` لأنه ليس نطاقا تملكه. الحل المعتاد هو شراء نطاق خاص وربطه بـ GitHub Pages ثم إعادة التقديم.

## English

The site is ready for an AdSense application. Ads load **on the guide pages only** (`public/guides/`), never inside the editor tool.

1. Apply at https://adsense.google.com with the site URL.
2. After approval (or when Google asks you to verify the site), set your publisher ID in `public/ads-config.js`:

   ```js
   window.ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
   ```

3. Push to `main`; GitHub Actions redeploys the site.
4. Turn on **Auto ads** for the site in the AdSense dashboard.
5. Enable the consent message (Privacy & messaging) in AdSense for EEA/UK visitors.
6. Create `public/ads.txt` with the line Google gives you (format: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`).

Note: AdSense may reject sites on a `github.io` address since you do not own that domain. The usual fix is to register your own domain, point it at GitHub Pages and reapply.
