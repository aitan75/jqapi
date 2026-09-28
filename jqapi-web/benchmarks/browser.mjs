// Optional standalone benchmark: never included in Vitest/Playwright pass/fail timing checks.
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import os from 'node:os';

function integer(name, fallback, min, max) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer in [${min}, ${max}]`);
  }
  return value;
}

const warmup = integer('BENCHMARK_WARMUP', 3, 1, 100);
const repetitions = integer('BENCHMARK_REPETITIONS', 7, 1, 100);
const qubits = integer('BENCHMARK_QUBITS', 16, 2, 16);
const shots = integer('BENCHMARK_SHOTS', 1000, 1, 10000);
const root = new URL('../../', import.meta.url);
const payload = await readFile(new URL('../src/wasm/jqapi.js', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const server = createServer((request, response) => {
  if (request.url === '/jqapi.js') {
    response.writeHead(200, { 'Content-Type': 'text/javascript' });
    response.end(payload);
  } else if (request.url === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html' });
    response.end('<!doctype html><title>jqapi simulator benchmark</title>');
  } else {
    response.writeHead(404);
    response.end();
  }
});
let browser;
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  browser = await chromium.launch({ headless: true, args: ['--enable-precise-memory-info'] });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const results = await page.evaluate(async ({ warmup, repetitions, qubits, shots }) => {
    const engine = await import('/jqapi.js');
    const gate = (kind, targets, controls = []) => ({ kind, targets, controls, params: {} });
    function spec(n) {
      return { version: 1, numQubits: n, levels: [
        { gates: [gate('H', Array.from({ length: n }, (_, i) => i))] },
        { gates: [gate('CNOT', [n - 1], [0])] },
      ] };
    }
    const cases = [
      { name: 'run-H-all-CNOT-including-JSON', qubits: 8, shots: 0 },
      { name: 'run-H-all-CNOT-including-JSON', qubits, shots: 0 },
      { name: 'sample-H-all-CNOT-including-JSON', qubits: 8, shots },
    ];
    const memory = () => performance.memory?.usedJSHeapSize ?? null;
    const workloads = [];
    for (const entry of cases) {
      const circuit = spec(entry.qubits);
      const samplesMs = [];
      let observedHeapHighWaterBytes = memory();
      let outputJsonBytes = 0;
      for (let i = -warmup; i < repetitions; i++) {
        const start = performance.now();
        const input = JSON.stringify(circuit);
        const output = entry.shots ? engine.sample(input, entry.shots) : engine.run(input);
        const result = JSON.parse(output);
        const elapsed = performance.now() - start;
        if (!result.ok) throw new Error(JSON.stringify(result));
        if (entry.shots) {
          if (result.counts.reduce((sum, count) => sum + count, 0) !== entry.shots) throw new Error('Shot count mismatch');
        } else {
          const norm = result.amplitudes.reduce((sum, a) => sum + a.re * a.re + a.im * a.im, 0);
          if (result.amplitudes.length !== 2 ** entry.qubits || Math.abs(norm - 1) > 1e-9) throw new Error('Invalid state');
        }
        if (i >= 0) {
          samplesMs.push(elapsed);
          outputJsonBytes = new TextEncoder().encode(output).length;
          const heap = memory();
          if (heap !== null) observedHeapHighWaterBytes = Math.max(observedHeapHighWaterBytes ?? 0, heap);
        }
      }
      const sorted = [...samplesMs].sort((a, b) => a - b);
      workloads.push({ ...entry, samplesMs, minMs: sorted[0],
        medianMs: (sorted[Math.floor((repetitions - 1) / 2)] + sorted[Math.floor(repetitions / 2)]) / 2,
        maxMs: sorted.at(-1), observedHeapHighWaterBytes, outputJsonBytes,
        stateVectorLowerBoundBytes: 16 * 2 ** entry.qubits });
    }
    return { userAgent: navigator.userAgent, jsHeapSizeLimit: performance.memory?.jsHeapSizeLimit ?? null, workloads };
  }, { warmup, repetitions, qubits, shots });
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(), commit: git('rev-parse', 'HEAD'),
    workingTree: git('status', '--porcelain') ? 'dirty' : 'clean',
    machine: { cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, ramBytes: os.totalmem(),
      os: os.type(), release: os.release(), arch: os.arch() },
    node: process.version, browser: await browser.version(), headless: true,
    browserArgs: ['--enable-precise-memory-info'], warmup, repetitions,
    execution: 'sequential TeaVM ES2015 JavaScript; module import excluded; JSON round trip included',
    random: 'production browser random source; bridge does not expose a seed',
    configuredLimits: { maxQubits: 24, maxShots: 10000, maxSamplingWork: 1000000000 },
    memoryMetric: 'Boundary JS heap high-water estimate, including prior workloads/garbage; lower bound on true peak, not RSS. Array buffers and transient in-call peaks may be missing. No capacity ceiling inferred.',
    payload: { rawBytes: payload.length, gzipBytes: gzipSync(payload).length,
      sha256: createHash('sha256').update(payload).digest('hex') },
    ...results,
  }, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
