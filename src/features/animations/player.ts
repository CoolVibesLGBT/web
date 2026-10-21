// Shared lazy worker, mirroring tweb's loader/player split. The renderer is tweb's unchanged TLottieWasm.
type Metadata = { id: number; frames: number; fps: number; width: number; height: number };
let worker: Worker | undefined;
let sequence = 0;
let users = 0;
let idle: ReturnType<typeof setTimeout> | undefined;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason: Error) => void }>();
function call<T>(method: string, data: Record<string, unknown>): Promise<T> {
  if (!worker) {
    worker = new Worker(new URL('./lottie.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = event => {
      const entry = pending.get(event.data.request);
      if (!entry) return;
      pending.delete(event.data.request);
      if (event.data.error) entry.reject(new Error(event.data.error));
      else entry.resolve(event.data.result);
    };
    worker.onerror = () => {
      pending.forEach(entry => entry.reject(new Error('Animation worker failed'))); pending.clear();
      worker?.terminate(); worker = undefined;
    };
  }
  const request = ++sequence;
  return new Promise<T>((resolve, reject) => {
    pending.set(request, { resolve: value => resolve(value as T), reject });
    worker!.postMessage({ request, method, ...data });
  });
}
export async function createAnimationPlayer(src: string, canvas: HTMLCanvasElement) {
  if (idle) clearTimeout(idle);
  users++;
  let meta: Metadata;
  try { meta = await call<Metadata>('create', { src }); }
  catch (error) { users--; throw error; }
  let destroyed = false, playing = false, raf = 0, busy = false, start = 0, lastFrame = -1;
  const context = canvas.getContext('2d');
  const draw = async (frame: number) => {
    if (busy || destroyed || frame === lastFrame) return;
    busy = true;
    try {
      const pixels = await call<Uint8ClampedArray>('render', { id: meta.id, frame, width: canvas.width, height: canvas.height });
      if (!destroyed && context) {
        const image = context.createImageData(canvas.width, canvas.height);
        image.data.set(pixels); context.putImageData(image, 0, 0);
        canvas.dataset.frame = String(frame); lastFrame = frame;
      }
    } finally { busy = false; }
  };
  const tick = (now: number) => {
    if (!playing || destroyed) return;
    if (!start) start = now;
    void draw(Math.floor((now - start) * meta.fps / 1000) % meta.frames).catch(() => { playing = false; });
    raf = requestAnimationFrame(tick);
  };
  try { await draw(0); }
  catch (error) {
    await call('destroy', { id: meta.id }).catch(() => {});
    users--;
    throw error;
  }
  return {
    metadata: meta,
    play() { if (!playing && !destroyed) { playing = true; start = 0; raf = requestAnimationFrame(tick); } },
    pause() { playing = false; cancelAnimationFrame(raf); },
    async destroy() {
      if (destroyed) return;
      destroyed = true; playing = false; cancelAnimationFrame(raf);
      await call('destroy', { id: meta.id }).catch(() => {});
      if (--users === 0) idle = setTimeout(() => { worker?.terminate(); worker = undefined; }, 30_000);
    },
  };
}
