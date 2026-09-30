import { expectation, exportQasm, importQasm, sample, sampleExpectation, trace } from './bridge';
import type { WorkerRequest, Responses } from './protocol';

function execute(request: WorkerRequest): Responses[keyof Responses] {
  switch (request.kind) {
    case 'trace': return trace(request.spec, request.seed);
    case 'importQasm': return importQasm(request.source);
    case 'exportQasm': return exportQasm(request.spec);
    case 'counts': {
      const counts = sample(request.spec, request.shots);
      if (!counts.ok) return counts;
      return {
        ok: true,
        sample: counts,
        exact: request.observable ? expectation(request.spec, request.observable) : null,
        estimate: request.observable && request.shots >= 2 ? sampleExpectation(request.spec, request.observable, request.shots) : null,
      };
    }
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try { self.postMessage(execute(event.data)); }
  catch { self.postMessage({ ok: false, error: { code: 'SIMULATION_FAILED' } }); }
};
