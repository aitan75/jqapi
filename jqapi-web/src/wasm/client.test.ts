import { afterEach, describe, expect, it, vi } from 'vitest';
import { startJob } from './client';
import { BROWSER_BUDGET } from './policy';

function fakeWorker() {
  return { postMessage: vi.fn(), terminate: vi.fn(), onmessage: null, onerror: null, onmessageerror: null } as unknown as Worker;
}
const request = { kind: 'trace' as const, spec: { version: 1, numQubits: 1, levels: [] }, seed: 1 };
afterEach(() => vi.useRealTimers());

describe('interruptible browser execution', () => {
  it('terminates active work on cancellation and ignores late replies', async () => {
    const worker = fakeWorker();
    const job = startJob(request, () => worker);
    job.cancel();
    worker.onmessage!({ data: { ok: true, frames: [] } } as MessageEvent);
    expect(await job.result).toEqual({ ok: false, error: { code: 'CANCELLED' } });
    expect(worker.terminate).toHaveBeenCalledTimes(1);
  });
  it('enforces the elapsed budget even when the engine cannot yield', async () => {
    vi.useFakeTimers();
    const worker = fakeWorker();
    const job = startJob(request, () => worker);
    vi.advanceTimersByTime(BROWSER_BUDGET.maxElapsedMs);
    expect(await job.result).toEqual({ ok: false, error: { code: 'TIMEOUT' } });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('recovers from a failed worker with an independent new job', async () => {
    const failed = startJob(request, () => { throw new Error('Worker unavailable'); });
    expect(await failed.result).toEqual({ ok: false, error: { code: 'SIMULATION_FAILED' } });
    const worker = fakeWorker();
    const next = startJob(request, () => worker);
    worker.onmessage!({ data: { ok: true, frames: [] } } as MessageEvent);
    expect(await next.result).toEqual({ ok: true, frames: [] });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
