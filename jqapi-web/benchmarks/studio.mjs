// Optional browser observations, never CI timing assertions. Uses the actual Studio worker client.
import { chromium } from '@playwright/test';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import os from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = await createServer({ root, logLevel: 'silent', server: { host: '127.0.0.1', port: 0 }, plugins: [{
  name: 'benchmark-page',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url !== '/__benchmark__') return next();
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><title>Studio worker benchmark</title>');
    });
  },
}] });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__benchmark__`);
  const results = await page.evaluate(async () => {
    const { startJob } = await import('/src/wasm/client.ts');
    const { BROWSER_BUDGET: budget } = await import('/src/wasm/policy.ts');
    const gate = (kind, target, controls = []) => ({ kind, targets: [target], controls, params: {} });
    const spec = { version: 1, numQubits: 8, levels: [
      { gates: Array.from({ length: 8 }, (_, q) => gate('H', q)) },
      { gates: [gate('CNOT', 7, [0])] },
    ] };
    const boundary = { ...spec, levels: Array.from({ length: 255 }, () => ({ gates: [gate('H', 0)] })) };
    const cases = [
      { name: 'trace-8q-9-gates', request: { kind: 'trace', spec, seed: 1 }, frames: 10 },
      { name: 'trace-8q-255-gates-output-boundary', request: { kind: 'trace', spec: boundary, seed: 1 }, frames: 256 },
      { name: 'counts-8q-1000-shots', request: { kind: 'counts', spec, shots: 1000, observable: null } },
      { name: 'counts-exact-sampled-8q-1000-shots', request: { kind: 'counts', spec, shots: 1000, observable: { numQubits: 8, terms: [{ coeff: 1, pauli: 'XIIIIIII' }] } } },
      { name: 'counts-8q-near-work-budget', request: { kind: 'counts', spec, shots: 7800, observable: null } },
    ];
    const workloads = [];
    for (const entry of cases) {
      const samplesMs = [], mainThreadTicks = [];
      let outputBytes = 0;
      for (let i = -3; i < 7; i++) {
        let ticks = 0;
        const heartbeat = setInterval(() => ticks++, 10);
        const start = performance.now();
        const result = await startJob(entry.request).result;
        const elapsed = performance.now() - start;
        clearInterval(heartbeat);
        if (!result.ok) throw new Error(JSON.stringify(result));
        if (entry.frames) {
          if (result.frames.length !== entry.frames) throw new Error('Trace length mismatch');
          const norm = result.frames.at(-1).amplitudes.reduce((sum, a) => sum + a.re * a.re + a.im * a.im, 0);
          if (Math.abs(norm - 1) > 1e-9) throw new Error('Trace normalization failed');
        } else {
          if (result.sample.counts.reduce((a, b) => a + b, 0) !== entry.request.shots) throw new Error('Shot mismatch');
          if (entry.request.observable && (!result.exact?.ok || !result.estimate?.ok || Math.abs(result.exact.value - 1) > 1e-9 || result.estimate.standardError !== 0)) throw new Error('Observable mismatch');
        }
        if (i >= 0) { samplesMs.push(elapsed); mainThreadTicks.push(ticks); outputBytes = new TextEncoder().encode(JSON.stringify(result)).length; }
      }
      const sorted = [...samplesMs].sort((a, b) => a - b);
      workloads.push({ name: entry.name, samplesMs, mainThreadTicks, medianMs: sorted[3], minMs: sorted[0], maxMs: sorted.at(-1), outputBytes });
    }
    return { userAgent: navigator.userAgent, budget, workloads };
  });
  const payload = await readFile(new URL('../src/wasm/jqapi.js', import.meta.url));
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(), commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    workingTree: execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim() ? 'dirty' : 'clean',
    machine: { cpu: os.cpus()[0].model, logicalCpus: os.cpus().length, ramBytes: os.totalmem(), os: os.type(), release: os.release(), arch: os.arch() },
    node: process.version, browser: browser.version(), headless: true, warmup: 3, repetitions: 7,
    execution: 'Actual Studio client and fresh module worker per job, served by Vite. Includes worker startup, cached module load, TeaVM, JSON parse and structured clone. Excludes React rendering. Main-thread 10 ms heartbeat counts are observations, not latency guarantees. No worker heap measurement.',
    payload: { rawBytes: payload.length, gzipBytes: gzipSync(payload).length, sha256: createHash('sha256').update(payload).digest('hex') },
    ...results,
  }, null, 2));
} finally {
  if (browser) await browser.close();
  await server.close();
}
