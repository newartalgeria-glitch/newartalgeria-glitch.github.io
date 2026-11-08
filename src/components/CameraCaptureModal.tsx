import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, Sparkles, SwitchCamera } from 'lucide-react';
import type { Language, PassportStandard } from '../types';
import { translations } from '../i18n/translations';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (capturedImage: HTMLImageElement) => void;
  language: Language;
  activeStandard: PassportStandard;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  language,
  activeStandard,
}) => {
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  // Initialize camera when opened
  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      setErrorMsg(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, selectedDeviceId]);

  const startCamera = async () => {
    stopCamera();
    try {
      // Enumerate video devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevs);

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: 'user',
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setErrorMsg(
        language === 'ar'
          ? 'تعذر الوصول إلى الكاميرا. يرجى التأكد من توصيلها ومنح الإذن للمتصفح.'
          : 'Unable to access camera. Please check camera connection and browser permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;

    // Trigger flash
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally to match mirror preview
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedDataUrl(dataUrl);
  };

  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConfirm = () => {
    if (!capturedDataUrl) return;
    const img = new Image();
    img.src = capturedDataUrl;
    img.onload = () => {
      onCapture(img);
      onClose();
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="h-14 border-b border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {language === 'ar' ? 'التقاط الصورة بالكاميرا الحية' : 'Live Camera Studio Capture'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {language === 'ar' ? 'مع دليل المحاذاة البيومترية المباشر' : 'With real-time biometric alignment guide'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {devices.length > 1 && !capturedDataUrl && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="px-2 py-1 bg-zinc-800 text-xs text-zinc-200 rounded border border-zinc-700 focus:outline-none"
              >
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Frame */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center max-w-md">
              <p className="text-sm text-rose-400 font-medium mb-3">{errorMsg}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-lg border border-zinc-700 flex items-center gap-2 mx-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</span>
              </button>
            </div>
          ) : capturedDataUrl ? (
            <img src={capturedDataUrl} alt="Captured preview" className="w-full h-full object-contain" />
          ) : (
            <>
              {/* Mirrored Live Video */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />

              {/* Biometric Oval Alignment Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* SVG Biometric Guide */}
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Face Oval */}
                  <ellipse
                    cx="50"
                    cy="45"
                    rx="18"
                    ry="26"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="0.6"
                    strokeDasharray="2, 1"
                  />
                  {/* Eye Level Guide Band */}
                  <rect
                    x="25"
                    y="36"
                    width="50"
                    height="8"
                    fill="rgba(34, 197, 94, 0.12)"
                    stroke="#22c55e"
                    strokeWidth="0.4"
                  />
                  {/* Center Vertical Axis */}
                  <line
                    x1="50"
                    y1="15"
                    x2="50"
                    y2="80"
                    stroke="#22c55e"
                    strokeWidth="0.4"
                    strokeDasharray="1.5, 1.5"
                  />
                </svg>

                {/* Guide Labels */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-zinc-950/80 backdrop-blur-sm border border-emerald-500/30 px-3 py-1 rounded-full text-[11px] text-emerald-400 font-semibold shadow-lg">
                  {language === 'ar'
                    ? 'حاذِ الوجه داخل الإطار الأخضر والعينين في الشريط المظلل'
                    : 'Align face inside green oval & eyes in shaded band'}
                </div>
              </div>

              {/* Flash effect */}
              {flash && <div className="absolute inset-0 bg-white z-30 transition-opacity duration-200" />}

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center">
                  <span className="text-7xl font-extrabold text-white animate-ping">
                    {countdown}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="h-16 border-t border-zinc-800 px-5 flex items-center justify-between bg-zinc-950">
          <span className="text-xs text-zinc-400">
            {language === 'ar' ? 'المعيار المستهدف:' : 'Target Standard:'} {language === 'ar' ? activeStandard.nameAr : activeStandard.nameEn}
          </span>

          <div className="flex items-center gap-2">
            {capturedDataUrl ? (
              <>
                <button
                  onClick={() => setCapturedDataUrl(null)}
                  className="py-2 px-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إعادة الالتقاط' : 'Retake'}</span>
                </button>

                <button
                  onClick={handleConfirm}
                  className="py-2 px-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'ar' ? 'اعتماد الصورة وبدء التعديل' : 'Use Photo'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startCountdown}
                  className="py-2 px-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 hover:text-white transition flex items-center gap-1.5 border border-zinc-700 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'ar' ? 'مؤقت 3 ثواني' : '3s Timer'}</span>
                </button>

                <button
                  onClick={takeSnapshot}
                  className="py-2 px-5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{language === 'ar' ? 'التقاط الآن' : 'Snap Photo'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
