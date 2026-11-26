/**
 * Face measurements used to colour the guides red/green.
 * Runs MediaPipe Face Mesh fully inside the browser (no upload, works offline).
 * All returned coordinates are in the pixels of the canvas that was analysed.
 */
export interface FaceMetrics {
  chinY: number;
  crownY: number; // estimated top of the head (hair included)
  eyeY: number;
  centerX: number;
}

export interface FitResult {
  ok: boolean;
  headPct: number;
  eyePct: number;
  offPct: number;
  issues: string[]; // keys: headBig, headSmall, eyesHigh, eyesLow, offCenter, cut
}

const BASE = 'mediapipe/face_mesh/';
let instPromise: Promise<any> | null = null;
let modelFailed = false;
/** true when the face model itself could not be loaded (different from "no face in the photo") */
export const faceModelFailed = () => modelFailed;
let diag = '';
/** short technical reason of the last failure (shown to the user so problems can be reported precisely) */
export const faceDiag = () => diag;
let chain: Promise<unknown> = Promise.resolve();

function loadScript(src: string) {
  return new Promise<void>((res, rej) => {
    if ((window as any).FaceMesh) return res();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error('face model script'));
    document.head.appendChild(s);
  });
}

function getInstance() {
  if (!instPromise) {
    instPromise = (async () => {
      const base = new URL(BASE, document.baseURI).href;
      await loadScript(base + 'face_mesh.js');
      const FM = (window as any).FaceMesh;
      const inst = new FM({ locateFile: (f: string) => base + f });
      inst.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.4, minTrackingConfidence: 0.4 });
      await Promise.race([
        inst.initialize(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('init timeout 20s')), 20000)),
      ]);
      modelFailed = false;
      return inst;
    })().catch((e) => {
      modelFailed = true;
      diag = 'init: ' + String((e && (e.message || e)) || e).slice(0, 80);
      instPromise = null;
      throw e;
    });
  }
  return instPromise;
}

/** crown ≈ chin − 1.30 × (chin − forehead landmark): the landmark sits at the hairline, hair adds the rest */
const CROWN_FACTOR = 1.3;

/** Ratio (crown→chin) / (eye line→chin) used by the CPU fallback, calibrated against the Face Mesh result */
const FB_CROWN_RATIO = 1.85;

let fbPromise: Promise<any> | null = null;
function getFallback() {
  if (!fbPromise) {
    fbPromise = (async () => {
      const base = new URL('facefallback/', document.baseURI).href;
      if (!(window as any).faceapi) {
        await new Promise<void>((res, rej) => {
          const sc = document.createElement('script');
          sc.src = base + 'face-api.js';
          sc.onload = () => res();
          sc.onerror = () => rej(new Error('fallback script'));
          document.head.appendChild(sc);
        });
      }
      const fa = (window as any).faceapi;
      // CPU backend: no WebGL needed, so it works on any machine
      try { await fa.tf.setBackend('cpu'); } catch { /* keep default */ }
      await fa.tf.ready();
      await fa.nets.tinyFaceDetector.loadFromUri(base + 'models');
      await fa.nets.faceLandmark68Net.loadFromUri(base + 'models');
      return fa;
    })().catch((e) => {
      fbPromise = null;
      throw e;
    });
  }
  return fbPromise;
}

type Pt = { x: number; y: number };
function metricsFromMesh(L: Pt[], w: number, h: number, s: number): FaceMetrics {
  const chin = L[152].y * h;
  const top = L[10].y * h;
  const eyeIdx = [33, 133, 159, 145, 263, 362, 386, 374];
  const eyeY = (eyeIdx.reduce((a, i) => a + L[i].y, 0) / eyeIdx.length) * h;
  const centerX = ((L[234].x + L[454].x) / 2) * w;
  return {
    chinY: chin / s,
    crownY: (chin - CROWN_FACTOR * (chin - top)) / s,
    eyeY: eyeY / s,
    centerX: centerX / s,
  };
}

async function viaMediaPipe(tmp: HTMLCanvasElement, s: number): Promise<FaceMetrics | null> {
  const inst = await getInstance();
  const L: Pt[] | undefined = await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error('timeout 15s')), 15000);
    inst.onResults((r: any) => {
      clearTimeout(to);
      res(r?.multiFaceLandmarks?.[0]);
    });
    inst.send({ image: tmp }).catch((e: any) => { clearTimeout(to); rej(e); });
  });
  return L ? metricsFromMesh(L, tmp.width, tmp.height, s) : null;
}

async function viaFallback(tmp: HTMLCanvasElement, s: number): Promise<FaceMetrics | null> {
  const fa = await getFallback();
  const det = await fa
    .detectSingleFace(tmp, new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.3 }))
    .withFaceLandmarks();
  if (!det) return null;
  const P: Pt[] = det.landmarks.positions;
  const chin = P[8].y;
  const eyeY = P.slice(36, 48).reduce((a, p) => a + p.y, 0) / 12;
  const centerX = (P[0].x + P[16].x) / 2;
  return {
    chinY: chin / s,
    crownY: (chin - FB_CROWN_RATIO * (chin - eyeY)) / s,
    eyeY: eyeY / s,
    centerX: centerX / s,
  };
}

export async function detectFace(source: HTMLCanvasElement): Promise<FaceMetrics | null> {
  const run = async (): Promise<FaceMetrics | null> => {
    const s = Math.min(1, 720 / Math.max(source.width, source.height));
    const w = Math.max(2, Math.round(source.width * s));
    const h = Math.max(2, Math.round(source.height * s));
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const c = tmp.getContext('2d')!;
    // faces on transparent areas would be seen as black: put the photo on white
    c.fillStyle = '#fff';
    c.fillRect(0, 0, w, h);
    c.drawImage(source, 0, 0, w, h);

    let mpErr = '';
    try {
      const r = await viaMediaPipe(tmp, s);
      if (r) { modelFailed = false; diag = ''; return r; }
    } catch (e: any) {
      mpErr = 'mp: ' + String((e && (e.message || e)) || e).slice(0, 60);
    }
    // Second engine (CPU, no WebGL): used when the first one cannot run, or does not see a face
    try {
      const r = await viaFallback(tmp, s);
      if (r) { modelFailed = false; diag = ''; return r; }
      modelFailed = !!mpErr;
      diag = mpErr;
      return null;
    } catch (e: any) {
      modelFailed = true;
      diag = (mpErr ? mpErr + ' | ' : '') + 'cpu: ' + String((e && (e.message || e)) || e).slice(0, 60);
      return null;
    }
  };
  const p = chain.then(run, run);
  chain = p.catch(() => null);
  return p;
}

if (typeof window !== 'undefined') {
  // calibration / support hook
  (window as any).__faceDebug = { viaMediaPipe, viaFallback };
}

export function evalFit(
  f: FaceMetrics,
  crop: { x: number; y: number; width: number; height: number },
  mode: 'dv' | 'bio',
  headMin: number,
  headMax: number,
): FitResult {
  const headPct = ((f.chinY - f.crownY) / crop.height) * 100;
  const eyePct = ((f.eyeY - crop.y) / crop.height) * 100; // from the top of the crop
  const offPct = ((f.centerX - (crop.x + crop.width / 2)) / crop.width) * 100;
  const issues: string[] = [];
  const tol = mode === 'dv' ? 2 : 3;
  if (f.crownY < crop.y || f.chinY > crop.y + crop.height) issues.push('cut');
  if (headPct > headMax + tol) issues.push('headBig');
  else if (headPct < headMin - tol) issues.push('headSmall');
  if (mode === 'dv') {
    if (eyePct < 31 - tol) issues.push('eyesHigh');
    else if (eyePct > 44 + tol) issues.push('eyesLow');
  }
  if (Math.abs(offPct) > 7) issues.push('offCenter');
  return { ok: issues.length === 0, headPct, eyePct, offPct, issues };
}

export const FIT_TEXT: Record<string, { ar: string; en: string }> = {
  ok: { ar: '✔ القص مناسب', en: '✔ Crop is correct' },
  cut: { ar: 'الرأس خارج الإطار', en: 'Head is cut by the frame' },
  headBig: { ar: 'الرأس كبير جدا — صغّر الصورة', en: 'Head too large — zoom out' },
  headSmall: { ar: 'الرأس صغير — كبّر الصورة', en: 'Head too small — zoom in' },
  eyesHigh: { ar: 'العينان مرتفعتان عن النطاق', en: 'Eyes are above the zone' },
  eyesLow: { ar: 'العينان منخفضتان عن النطاق', en: 'Eyes are below the zone' },
  offCenter: { ar: 'الوجه غير متوسط', en: 'Face is not centred' },
};
