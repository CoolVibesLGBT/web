/// <reference lib="webworker" />
import loadTLottieWasm, { type TLottieWasm, type TLottieAnimation } from './tlottieWasm';

const items = new Map<number, { renderer: TLottieWasm; animation: TLottieAnimation }>();
const sources = new Map<string, Promise<string>>();
let nextItem = 1;
const simd = WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));
const renderer = () => loadTLottieWasm(`/animations/telegram/renderer/tlottie${simd ? '' : '.nosimd'}.wasm`);
async function source(url: string) {
  let promise = sources.get(url);
  if (!promise) {
    promise = fetch(url).then(async response => {
      if (!response.ok) throw new Error(`Animation request failed: ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes[0] === 31 && bytes[1] === 139) return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
      return new TextDecoder().decode(bytes);
    });
    sources.set(url, promise);
    promise.catch(() => sources.delete(url));
  }
  return promise;
}
self.onmessage = async (event: MessageEvent) => {
  const { request, method, ...data } = event.data;
  try {
    if (method === 'create') {
      const [wasm, json] = await Promise.all([renderer(), source(data.src)]);
      const animation = wasm.createAnimation(json);
      const id = nextItem++;
      items.set(id, { renderer: wasm, animation });
      self.postMessage({ request, result: { id, frames: animation.frameCount, fps: animation.frameRate, width: animation.width, height: animation.height } });
    } else if (method === 'render') {
      const item = items.get(data.id);
      if (!item) throw new Error('Animation is no longer available');
      const pixels = new Uint8ClampedArray(item.renderer.render(item.animation.handle, data.frame, data.width, data.height));
      self.postMessage({ request, result: pixels }, { transfer: [pixels.buffer] });
    } else if (method === 'destroy') {
      const item = items.get(data.id);
      if (item) { item.renderer.destroyAnimation(item.animation.handle); items.delete(data.id); }
      self.postMessage({ request, result: null });
    }
  } catch (error) {
    self.postMessage({ request, error: error instanceof Error ? error.message : String(error) });
  }
};
