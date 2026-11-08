import React from 'react';
import { X, BookOpen, ShieldCheck, Printer, Camera } from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, language }) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {language === 'ar' ? 'دليل الاستوديو والمواصفات الرسمية' : 'Photo Studio & Standards Guide'}
              </h2>
              <p className="text-[11px] text-zinc-400">NadirPhotoLab Professional Suite</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs text-zinc-300 leading-relaxed">
          
          {/* Section 1: DV Lottery */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
            <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4" />
              {language === 'ar' ? 'شروط قرعة الهجرة الأمريكية (DV Lottery)' : 'US DV Lottery Official Rules'}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11.5px]">
              {language === 'ar' ? (
                <>
                  <li><strong>الأبعاد:</strong> مربعة تماماً (1:1)، يفضل 600×600 بكسل حتى 1200×1200 بكسل.</li>
                  <li><strong>حجم الملف:</strong> أقل من أو يساوي 240 كيلوبايت (240 KB) بصيغة JPEG.</li>
                  <li><strong>ارتفاع الرأس:</strong> بين 50% إلى 69% من الارتفاع الكلي للصورة.</li>
                  <li><strong>مستوى العينين:</strong> بين 56% إلى 69% مقاساً من أسفل الصورة.</li>
                  <li><strong>الخلفية:</strong> بيضاء نقية أو مائلة للبياض موحدة وخالية من الظلال.</li>
                  <li><strong>الملامح:</strong> تعبير حيادي، عدم ارتداء نظارات طبية أو شمسية، والفم مغلق.</li>
                </>
              ) : (
                <>
                  <li><strong>Dimensions:</strong> Square aspect ratio (1:1), 600x600 px up to 1200x1200 px.</li>
                  <li><strong>File Size:</strong> Less than or equal to 240 KB in JPEG format.</li>
                  <li><strong>Head Height:</strong> Between 50% and 69% of the image total height.</li>
                  <li><strong>Eye Level:</strong> Between 56% and 69% measured from the bottom of the photo.</li>
                  <li><strong>Background:</strong> Plain white or off-white background with no harsh shadows.</li>
                  <li><strong>Expression:</strong> Neutral facial expression with eyes open, no eyeglasses.</li>
                </>
              )}
            </ul>
          </div>

          {/* Section 2: Algerian & European Passport */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
            <h3 className="font-bold text-cyan-400 flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4" />
              {language === 'ar' ? 'جواز السفر البيومتري الجزائري والأوروبي (35×45 مم)' : 'Algeria & Schengen Biometric (35x45 mm)'}
            </h3>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11.5px]">
              {language === 'ar' ? (
                <>
                  <li><strong>المقاس:</strong> 35 مم عرض × 45 مم ارتفاع.</li>
                  <li><strong>الخلفية:</strong> رمادي فاتح أو أزرق فاتح موحد (يمنع الأبيض الناصع في فرنسا والجزائر).</li>
                  <li><strong>الوجه:</strong> يشغل الوجه بين 70% إلى 80% من مساحة الصورة (من أسفل الذقن لأعلى الرأس).</li>
                </>
              ) : (
                <>
                  <li><strong>Size:</strong> 35 mm width x 45 mm height.</li>
                  <li><strong>Background:</strong> Plain light grey or light blue (Pure white is rejected in France and Algeria).</li>
                  <li><strong>Face Ratio:</strong> Head must occupy 70% to 80% from chin to crown.</li>
                </>
              )}
            </ul>
          </div>

          {/* Section 3: Studio Printing */}
          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/20 space-y-2">
            <h3 className="font-bold text-blue-400 flex items-center gap-2 text-sm">
              <Printer className="w-4 h-4" />
              {language === 'ar' ? 'نصائح طباعة الصور في الاستوديو' : 'Photo Studio Printing Tips'}
            </h3>
            <p className="text-[11.5px] text-zinc-300">
              {language === 'ar'
                ? 'استخدم مقاس ورق 10x15 سم (4x6 إنش) لطباعة 4 إلى 8 صور بيومترية في ورقة واحدة. اضبط الطابعة على جودة High / Best Photo بدقة 300 DPI للحصول على ألوان زاهية وخطوط قص دقيقة.'
                : 'Use 4x6" (10x15 cm) standard photographic paper to print 4 to 8 passport photos per sheet. Set your printer driver to High Quality 300 DPI borderless for crisp cutting and accurate physical measurements.'}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="h-14 border-t border-zinc-800 px-5 flex items-center justify-end bg-zinc-950">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
