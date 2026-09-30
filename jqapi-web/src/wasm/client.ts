import { BROWSER_BUDGET } from './policy';
import type { Requests, Responses } from './protocol';
import type { EngineErrorCode } from './types';

export interface Job<T> { result: Promise<T>; cancel: () => void }

/** Each job owns its worker: termination interrupts synchronous TeaVM code and frees its state. */
export function startJob<K extends keyof Requests>(
  request: { kind: K } & Requests[K],
  createWorker = () => new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' }),
): Job<Responses[K]> {
  let cancel = () => {};
  const result = new Promise<Responses[K]>((resolve) => {
    let worker: Worker | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (value: Responses[K]) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker?.terminate();
      resolve(value);
    };
    const fail = (code: EngineErrorCode) => finish({ ok: false, error: { code } } as Responses[K]);
    cancel = () => fail('CANCELLED');
    try {
      worker = createWorker();
      worker.onmessage = (event: MessageEvent<Responses[K]>) => finish(event.data);
      worker.onerror = () => fail('SIMULATION_FAILED');
      worker.onmessageerror = () => fail('SIMULATION_FAILED');
      timer = setTimeout(() => fail('TIMEOUT'), BROWSER_BUDGET.maxElapsedMs);
      worker.postMessage(request);
    } catch { fail('SIMULATION_FAILED'); }
  });
  return { result, cancel: () => cancel() };
}
